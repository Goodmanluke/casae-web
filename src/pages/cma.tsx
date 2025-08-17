import { useState, useEffect } from "react";
import { useRouter } from "next/router";

/**
 * A full CMA wizard with three tabs: Snapshot, Adjustments and Result.
 *
 * The Snapshot tab computes a baseline estimate and displays the selected
 * comparables. The Adjustments tab lets the user tweak high‑level
 * property attributes (condition, renovations and additions) and then
 * re‑price the subject using the backend `/cma/adjust` endpoint. The
 * Result tab shows the updated estimate and allows a PDF download.
 */
export default function CMA() {
  const { query } = useRouter();
  const { address, lat, lng } = query as {
    address?: string;
    lat?: string;
    lng?: string;
  };

  type Comp = {
    address: string;
    price: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    distance_mi?: number;
  };

  interface CMAResponse {
    estimate: number;
    comps: Comp[];
    cma_run_id?: string;
  }

  // Tab state: snapshot (baseline), adjustments, result (new CMA)
  const [tab, setTab] = useState<'snapshot' | 'adjustments' | 'result'>('snapshot');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineData, setBaselineData] = useState<CMAResponse | null>(null);
  const [adjustedData, setAdjustedData] = useState<CMAResponse | null>(null);

  // Adjustment form state
  const [condition, setCondition] = useState<string>('Good');
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState<number>(0);
  const [addBaths, setAddBaths] = useState<number>(0);
  const [addSqft, setAddSqft] = useState<number>(0);
  const [dockLength, setDockLength] = useState<number>(0);

  // Fetch baseline estimate when an address and coordinates are present
  useEffect(() => {
    const fetchBaseline = async () => {
      if (!address || !lat || !lng) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/cma/baseline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: {
              address,
              lat: Number(lat),
              lng: Number(lng),
              beds: 0,
              baths: 0,
              sqft: 0,
            },
            rules: {},
          }),
        });
        if (!res.ok) throw new Error(`Baseline request failed: ${res.status}`);
        const data = (await res.json()) as CMAResponse;
        setBaselineData(data);
        // Reset adjustments
        setAdjustedData(null);
        setTab('snapshot');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseline();
  }, [address, lat, lng]);

  // Handler to toggle renovations selection
  const toggleRenovation = (item: string) => {
    setRenovations((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  // Handler to submit adjustments and fetch new CMA
  const applyAdjustments = async () => {
    if (!baselineData?.cma_run_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/cma/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cma_run_id: baselineData.cma_run_id,
          condition,
          renovations,
          add_beds: addBeds,
          add_baths: addBaths,
          add_sqft: addSqft,
          dock_length: dockLength,
        }),
      });
      if (!res.ok) throw new Error(`Adjust request failed: ${res.status}`);
      const data = (await res.json()) as CMAResponse;
      setAdjustedData(data);
      setTab('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived comps to display depending on step
  const compsToShow = tab === 'result' && adjustedData ? adjustedData.comps : baselineData?.comps;
  const estimateToShow = tab === 'result' && adjustedData ? adjustedData.estimate : baselineData?.estimate;
  const cmaRunId = tab === 'result' && adjustedData ? adjustedData.cma_run_id : baselineData?.cma_run_id;

  return (
    <div className="p-6 space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-4 border-b pb-2 mb-4">
        <button
          className={tab === 'snapshot' ? 'font-semibold' : 'text-gray-500'}
          onClick={() => setTab('snapshot')}
          disabled={!baselineData}
        >
          Snapshot
        </button>
        <button
          className={tab === 'adjustments' ? 'font-semibold' : 'text-gray-500'}
          onClick={() => setTab('adjustments')}
          disabled={!baselineData}
        >
          Adjustments
        </button>
        <button
          className={tab === 'result' ? 'font-semibold' : 'text-gray-500'}
          onClick={() => setTab('result')}
          disabled={!adjustedData}
        >
          New CMA
        </button>
      </div>

      {/* Error / Loading states */}
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">Error: {error}</div>}

      {/* Snapshot tab */}
      {tab === 'snapshot' && baselineData && (
        <>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold">{address}</h1>
            <div className="text-3xl font-bold">
              ${estimateToShow?.toLocaleString()}
            </div>
          </div>
          <h2 className="text-lg font-medium">AI‑selected comps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {compsToShow?.map((c, i) => (
              <div key={i} className="border rounded-xl p-4">
                <div className="font-medium">{c.address}</div>
                <div className="text-sm opacity-70">
                  ${c.price?.toLocaleString()} · {c.beds ?? '—'} bd · {c.baths ?? '—'} ba · {c.sqft ?? '—'} sqft {c.distance_mi ? `· ${c.distance_mi.toFixed(2)} mi` : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Adjustments tab */}
      {tab === 'adjustments' && baselineData && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Adjust Subject</h2>
          <div className="space-y-2">
            {/* Condition select */}
            <label className="block">
              <span className="block mb-1">Condition</span>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="border p-2 rounded w-full">
                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            {/* Renovations multi-select checkboxes */}
            <div>
              <span className="block mb-1">Renovations</span>
              {['Kitchen', 'Bath', 'Flooring', 'Roof', 'Dock'].map((opt) => (
                <label key={opt} className="mr-4">
                  <input
                    type="checkbox"
                    checked={renovations.includes(opt)}
                    onChange={() => toggleRenovation(opt)}
                  /> {opt}
                </label>
              ))}
            </div>
            {/* Additions inputs */}
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="block mb-1">Add Bedrooms</span>
                <input type="number" className="border p-2 rounded w-full" value={addBeds} min={0} max={3} onChange={(e) => setAddBeds(Number(e.target.value))} />
              </label>
              <label>
                <span className="block mb-1">Add Bathrooms</span>
                <input type="number" className="border p-2 rounded w-full" value={addBaths} min={0} max={3} onChange={(e) => setAddBaths(Number(e.target.value))} />
              </label>
              <label>
                <span className="block mb-1">Add Sqft</span>
                <input type="number" className="border p-2 rounded w-full" value={addSqft} min={0} step={50} onChange={(e) => setAddSqft(Number(e.target.value))} />
              </label>
              <label>
                <span className="block mb-1">Dock Length (ft)</span>
                <input type="number" className="border p-2 rounded w-full" value={dockLength} min={0} step={5} onChange={(e) => setDockLength(Number(e.target.value))} />
              </label>
            </div>
          </div>
          <button onClick={applyAdjustments} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            Apply Adjustments
          </button>
        </div>
      )}

      {/* Result tab */}
      {tab === 'result' && adjustedData && (
        <>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold">{address}</h1>
            <div className="text-3xl font-bold">
              ${adjustedData.estimate.toLocaleString()}
            </div>
          </div>
          <h2 className="text-lg font-medium">Adjusted comps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {adjustedData.comps?.map((c, i) => (
              <div key={i} className="border rounded-xl p-4">
                <div className="font-medium">{c.address}</div>
                <div className="text-sm opacity-70">
                  ${c.price?.toLocaleString()} · {c.beds ?? '—'} bd · {c.baths ?? '—'} ba · {c.sqft ?? '—'} sqft {c.distance_mi ? `· ${c.distance_mi.toFixed(2)} mi` : ''}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PDF download button (always visible when baseline exists) */}
      {baselineData && (
        <button
          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_BASE}/pdf?cma_run_id=${cmaRunId}`, '_blank')}
          className="border rounded px-4 py-2"
          disabled={!cmaRunId}
        >
          Download AI‑CMA PDF
        </button>
      )}
    </div>
  );
}
