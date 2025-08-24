import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf } from "../lib/api";
import type { CMAResponse, Comp } from "../lib/api";

type Tab = "snapshot" | "adjustments" | "result";

export default function CMA() {
  const { query } = useRouter();

  const [address, setAddress] = useState("");
  const [baselineData, setBaselineData] = useState<CMAResponse | null>(null);
  const [adjustedData, setAdjustedData] = useState<CMAResponse | null>(null);
  const [tab, setTab] = useState<Tab>("snapshot");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjustment inputs
  const [condition, setCondition] = useState("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState(0);
  const [addBaths, setAddBaths] = useState(0);
  const [addSqft, setAddSqft] = useState(0);

  // Auto-run when ?address= is present
  useEffect(() => {
    if (typeof query.address === "string" && query.address.trim().length > 0) {
      setAddress(query.address);
      fetchBaseline(query.address);
    }
  }, [query.address]);

  const fetchBaseline = async (addr: string) => {
    if (!addr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cmaBaseline({ subject: { address: addr } } as any);
      setBaselineData(data);
      setTab("snapshot");
    } catch (err: any) {
      console.error("Baseline failed:", err);
      setError(err?.message ?? "Failed to fetch baseline");
    } finally {
      setLoading(false);
    }
  };

  const applyAdjustments = async () => {
    if (!baselineData) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cmaAdjust({
        cma_run_id: baselineData.cma_run_id,
        condition,
        renovations,
        add_beds: addBeds,
        add_baths: addBaths,
        add_sqft: addSqft,
      });
      setAdjustedData(data);
      setTab("result");
    } catch (err: any) {
      console.error("Adjust failed:", err);
      setError(err?.message ?? "Failed to apply adjustments");
    } finally {
      setLoading(false);
    }
  };

  const toggleRenovation = (renovation: string) => {
    setRenovations((prev) =>
      prev.includes(renovation)
        ? prev.filter((r) => r !== renovation)
        : [...prev, renovation]
    );
  };

  const downloadPdf = async () => {
    if (!baselineData) return;
    try {
      await cmaPdf(baselineData.cma_run_id);
    } catch (err) {
      console.error("PDF failed:", err);
      alert("Could not start PDF download.");
    }
  };

  // Renders a simple grid of comps using the API fields your backend returns
const renderComps = (comps: Comp[]) => (
  <div className="grid grid-cols-1 gap-3 mt-3">
    {comps.map((comp, idx) => (
      <div key={comp.id ?? idx} className="border rounded p-3">
        <div className="font-semibold">{comp.address}</div>
        <div className="text-sm opacity-80">
          {comp.beds} bd | {comp.baths} ba | {comp.living_sqft} sqft
        </div>
        <div className="text-lg">
          ${((comp.raw_price ?? 0)).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
);


  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CMA Tool</h1>

      {/* Subject property address input */}
      <div className="flex gap-2 mb-4">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter subject property address"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={() => fetchBaseline(address)}
          className="border rounded px-4 py-2"
        >
          Run CMA
        </button>
      </div>

      {/* Loading / Error */}
      {loading && <div className="mb-3">Loading…</div>}
      {error && (
        <div className="mb-3 text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("snapshot")}
          className={`px-3 py-2 rounded ${tab === "snapshot" ? "font-bold border" : "border"}`}
        >
          Snapshot
        </button>
        <button
          onClick={() => setTab("adjustments")}
          className={`px-3 py-2 rounded ${tab === "adjustments" ? "font-bold border" : "border"}`}
        >
          Adjustments
        </button>
        <button
          onClick={() => setTab("result")}
          className={`px-3 py-2 rounded ${tab === "result" ? "font-bold border" : "border"}`}
        >
          Result
        </button>
      </div>

      {/* Snapshot tab */}
      {tab === "snapshot" && baselineData && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Baseline CMA</h2>
          <div className="mb-2">
            Estimated Value: ${baselineData.estimate?.toLocaleString()}
          </div>
               {baselineData.subject && (
      <div className="mb-2">
        <div className="font-semibold">{baselineData.subject.address}</div>
        <div className="text-sm opacity-80">
          {baselineData.subject.beds} bd | {baselineData.subject.baths} ba | {baselineData.subject.sqft} sqft
        </div>
      </div>
    )}

    )}  
  
          {renderComps(baselineData.comps)}
          <button onClick={downloadPdf} className="mt-3 border rounded px-3 py-2">
            Download PDF
          </button>
        </section>
      )}

      {/* Adjustments tab */}
      {tab === "adjustments" && baselineData && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Adjust Property</h2>

          {/* Condition */}
          <div className="mb-3">
            <label className="block mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="border rounded p-2"
            >
              <option value="Poor">Poor</option>
              <option value="Fair">Fair</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>

          {/* Renovations */}
          <div className="mb-3">
            <label className="block mb-1">Renovations</label>
            {["Kitchen", "Bath", "Flooring", "Roof"].map((opt) => (
              <label key={opt} className="block">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={renovations.includes(opt.toLowerCase())}
                  onChange={() => toggleRenovation(opt.toLowerCase())}
                />
                {opt}
              </label>
            ))}
          </div>

          {/* Adds */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block mb-1">Add Beds</label>
              <input
                type="number"
                value={addBeds}
                onChange={(e) => setAddBeds(Number(e.target.value))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Add Baths</label>
              <input
                type="number"
                value={addBaths}
                onChange={(e) => setAddBaths(Number(e.target.value))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Add Sqft</label>
              <input
                type="number"
                value={addSqft}
                onChange={(e) => setAddSqft(Number(e.target.value))}
                className="border rounded p-2 w-full"
              />
            </div>
          </div>

          <button onClick={applyAdjustments} className="border rounded px-4 py-2">
            Apply Adjustments
          </button>
        </section>
      )}

      {/* Result tab */}
      {tab === "result" && adjustedData && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Adjusted CMA</h2>
          <div className="mb-2">
            Adjusted Value: ${adjustedData.estimate?.toLocaleString()}
          </div>
          {renderComps(adjustedData.comps)}
          <button onClick={downloadPdf} className="mt-3 border rounded px-3 py-2">
            Download PDF
          </button>
        </section>
      )}

      {/* If nothing to show yet */}
      {!baselineData && !loading && !error && (
        <div className="opacity-70">
          Enter an address above, then click <strong>Run CMA</strong>.
        </div>
      )}
    </main>
  );
}
