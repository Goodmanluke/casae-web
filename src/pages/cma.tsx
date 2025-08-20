// src/pages/cma.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf } from "../lib/api";
import type { CMAResponse, Comp } from "../lib/api";


type Tab = "snapshot" | "adjustments" | "result";

export default function CMA() {
  const { query } = useRouter();
  const { address, lat, lng } = query as {
    address?: string;
    lat?: string;
    lng?: string;
  };

  // --- state ---
  const [tab, setTab] = useState<Tab>("snapshot");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baselineData, setBaselineData] = useState<CMAResponse | null>(null);
  const [adjustedData, setAdjustedData] = useState<CMAResponse | null>(null);

  // adjustment form state
  const [condition, setCondition] = useState("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState(0);
  const [addBaths, setAddBaths] = useState(0);
  const [addSqft, setAddSqft] = useState(0);
  const [dockLength, setDockLength] = useState(0);

  // --- baseline fetch ---
  useEffect(() => {
    const run = async () => {
      if (!address || !lat || !lng) return;
      setLoading(true);
      setError(null);
      try {
        const data = await cmaBaseline({
          subject: {
            address,
            lat: Number(lat),
            lng: Number(lng),
            beds: 0,
            baths: 0,
            sqft: 0,
          },
          rules: {},
        });
        setBaselineData(data);
        setAdjustedData(null);
        setTab("adjustments");
      } catch (e: any) {
        setError(e?.message || "Failed to load baseline");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [address, lat, lng]);

  // --- helpers ---
  const toggleRenovation = (item: string) => {
    setRenovations((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const applyAdjustments = async () => {
    if (!baselineData?.cma_run_id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cmaAdjust({
        cma_run_id: baselineData.cma_run_id!,
        condition,
        renovations,
        add_beds: addBeds,
        add_baths: addBaths,
        add_sqft: addSqft,
        dock_length: dockLength,
      });
      setAdjustedData(data);
      setTab("result");
    } catch (e: any) {
      setError(e?.message || "Failed to apply adjustments");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    const id = adjustedData?.cma_run_id || baselineData?.cma_run_id;
    if (!id) return;
    try {
      const { url } = await cmaPdf(id);
      window.open(url, "_blank");
    } catch (e: any) {
      alert(e?.message || "Failed to create PDF");
    }
  };

  // --- derived state ---
  const compsToShow: Comp[] | undefined =
    tab === "result" ? adjustedData?.comps : baselineData?.comps;

  const estimateToShow: number | undefined =
    tab === "result" ? adjustedData?.estimate : baselineData?.estimate;

  const cmaRunId =
    (tab === "result" ? adjustedData?.cma_run_id : baselineData?.cma_run_id) ||
    "";

  // --- UI ---
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">
          {address ?? "Enter an address…"}
        </h1>
        <div className="text-3xl font-bold">
          {estimateToShow !== undefined
            ? `$${estimateToShow.toLocaleString()}`
            : "—"}
        </div>
      </div>

      {/* Tabs + Download */}
      <div className="flex gap-3">
        <button
          className={tab === "snapshot" ? "font-semibold" : "text-gray-500"}
          onClick={() => setTab("snapshot")}
          disabled={!baselineData}
        >
          Snapshot
        </button>
        <button
          className={tab === "adjustments" ? "font-semibold" : "text-gray-500"}
          onClick={() => setTab("adjustments")}
          disabled={!baselineData}
        >
          Adjustments
        </button>
        <button
          className={tab === "result" ? "font-semibold" : "text-gray-500"}
          onClick={() => setTab("result")}
          disabled={!adjustedData}
        >
          New CMA
        </button>
        <div className="flex-1" />
        <button
          className="border rounded px-3 py-1"
          onClick={downloadPdf}
          disabled={!cmaRunId || loading}
        >
          Download PDF
        </button>
      </div>

      {/* Status */}
      {loading && <div>Loading…</div>}
      {!!error && <div className="text-red-600">Error: {error}</div>}

      {/* Snapshot */}
      {tab === "snapshot" && baselineData && (
        <>
          <h2 className="text-lg font-medium">AI-selected comps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {compsToShow?.map((c, i) => (
              <div key={i} className="border rounded p-4">
                <div className="font-medium">{c.address}</div>
                <div className="text-sm opacity-70">
                  ${c.price?.toLocaleString()} · {c.beds ?? "—"} bd ·{" "}
                  {c.baths ?? "—"} ba · {c.sqft ?? "—"} sqft{" "}
                  {c.distance_mi ? `· ${c.distance_mi.toFixed(2)} mi` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Adjustments */}
      {tab === "adjustments" && baselineData && (
        <div className="space-y-4">
          <label className="block">
            <span className="block mb-1">Condition</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {["Poor", "Fair", "Good", "Very Good", "Excellent"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="mb-1">Renovations</div>
            <div className="flex gap-4 flex-wrap">
              {["Kitchen", "Bath", "Flooring", "Roof", "Dock"].map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={renovations.includes(opt.toLowerCase())}
                    onChange={() => toggleRenovation(opt.toLowerCase())}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <label className="block">
              <span className="block mb-1">Add Beds</span>
              <input
                type="number"
                value={addBeds}
                onChange={(e) => setAddBeds(Number(e.target.value))}
                className="border rounded p-2 w-full"
                min={0}
              />
            </label>
            <label className="block">
              <span className="block mb-1">Add Baths</span>
              <input
                type="number"
                value={addBaths}
                onChange={(e) => setAddBaths(Number(e.target.value))}
                className="border rounded p-2 w-full"
                min={0}
              />
            </label>
            <label className="block">
              <span className="block mb-1">Add Sqft</span>
              <input
                type="number"
                value={addSqft}
                onChange={(e) => setAddSqft(Number(e.target.value))}
                className="border rounded p-2 w-full"
                min={0}
              />
            </label>
            <label className="block">
              <span className="block mb-1">Dock Length</span>
              <input
                type="number"
                value={dockLength}
                onChange={(e) => setDockLength(Number(e.target.value))}
                className="border rounded p-2 w-full"
                min={0}
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              className="border rounded px-3 py-1"
              onClick={applyAdjustments}
              disabled={!baselineData?.cma_run_id || loading}
            >
              Apply Adjustments
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {tab === "result" && adjustedData && (
        <>
          <h2 className="text-lg font-medium">Adjusted Comps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {compsToShow?.map((c, i) => (
              <div key={i} className="border rounded p-4">
                <div className="font-medium">{c.address}</div>
                <div className="text-sm opacity-70">
                  ${c.price?.toLocaleString()} · {c.beds ?? "—"} bd ·{" "}
                  {c.baths ?? "—"} ba · {c.sqft ?? "—"} sqft{" "}
                  {c.distance_mi ? `· ${c.distance_mi.toFixed(2)} mi` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
