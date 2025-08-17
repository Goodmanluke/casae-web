import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  async function geocodeAddress(addr: string) {
    // Minimal client-side Mapbox Geocoding
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${token}&limit=1&country=US`;

    const r = await fetch(url);
    const j = await r.json();
    const f = j.features?.[0];
    if (!f) return null;
    const [lng, lat] = f.center;
    return { lat, lng, place_name: f.place_name };
  }

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!q.trim()) return;
  // Skip Mapbox geocoding; let the backend handle it
  router.push(`/cma?address=${encodeURIComponent(q.trim())}`);
};

  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold">Start a CMA</h1>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter subject property address"
            className="flex-1 border rounded-xl px-4 py-3"
          />
          <button className="rounded-xl px-5 py-3 border">Go</button>
        </form>
      </div>
    </div>
  );
}
