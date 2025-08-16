import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Comp = {
  address: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  distance_mi?: number;
};

type BaselineResp = {
  estimate: number;
  comps: Comp[];
  cma_run_id?: string;
};

export default function CMA() {
  const { query } = useRouter();
  const { address, lat, lng } = query as {
    address?: string;
    lat?: string;
    lng?: string;
  };

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<BaselineResp | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!address || !lat || !lng) return;
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/cma/baseline`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: {
                address,
                lat: Number(lat),
                lng: Number(lng),
                // (Optional) add beds/baths/sqft if you later enrich from Supabase/Estated
              },
              rules: {},
            }),
          }
        );
        if (!r.ok) throw new Error(`Baseline failed: ${r.status}`);
        const j = (await r.json()) as BaselineResp;
        setData(j);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address, lat, lng]);

  if (!address) return <div className="p-6">No address provided.</div>;
  if (loading) return <div className="p-6">Computing CMA for {address}…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{address}</h1>
        <div className="text-3xl font-bold">
          ${Math.round(data.estimate).toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">AI-selected comps</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {data.comps?.map((c, i) => (
            <div key={i} className="border rounded-xl p-4">
              <div className="font-medium">{c.address}</div>
              <div className="text-sm opacity-70">
                ${c.price?.toLocaleString()} · {c.beds ?? "—"} bd ·{" "}
                {c.baths ?? "—"} ba · {c.sqft ?? "—"} sqft{" "}
                {c.distance_mi ? `· ${c.distance_mi.toFixed(2)} mi` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="border rounded-xl px-4 py-2"
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_API_BASE}/pdf?cma_run_id=${data.cma_run_id}`,
              "_blank"
            )
          }
          disabled={!data.cma_run_id}
          title={data.cma_run_id ? "Download CMA PDF" : "Compute baseline first"}
        >
          Download AI-CMA PDF
        </button>
        {/* Future: Add Adjustments/New CMA tabs */}
      </div>
    </div>
  );
}
