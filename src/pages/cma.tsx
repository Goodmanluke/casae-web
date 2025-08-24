import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf } from "../lib/api";
import type { CMAResponse, Comp } from "../lib/api";

/**
 * CMA page
 *
 * This page implements the CMA (comparative market analysis) workflow.  The
 * user can enter an address and generate a baseline CMA with comparable
 * properties fetched from the backend.  They can then apply adjustments
 * (condition, renovations, additions) to the subject property to see how
 * the value changes.  The comps are rendered with proper markup and use
 * the `raw_price` field returned by the API.
 */

type Tab = "snapshot" | "adjustments" | "result";

export default function CMA() {
  const { query } = useRouter();
  const [address, setAddress] = useState("");
  const [baselineData, setBaselineData] = useState<CMAResponse | null>(null);
  const [adjustedData, setAdjustedData] = useState<CMAResponse | null>(null);
  const [tab, setTab] = useState<Tab>("snapshot");

  // Adjustment inputs
  const [condition, setCondition] = useState("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState(0);
  const [addBaths, setAddBaths] = useState(0);
  const [addSqft, setAddSqft] = useState(0);

  // When the page loads with a query parameter (?address=...), auto-run baseline
  useEffect(() => {
    if (query.address) {
      setAddress(query.address as string);
      fetchBaseline(query.address as string);
    }
  }, [query.address]);

  /**
   * Fetch the baseline CMA for a given address.  Sets the baseline data
   * and switches the tab to the snapshot view.
   */
  const fetchBaseline = async (addr: string) => {
    const data = await cmaBaseline({ subject: { address: addr } } as any);
    setBaselineData(data);
    setTab("snapshot");
  };

  /**
   * Apply adjustments on top of the baseline CMA.  Requires a baseline
   * result.  Sends the selected adjustments to the backend and uses the
   * returned CMA as the adjusted result.
   */
  const applyAdjustments = async () => {
    if (!baselineData) return;
    const data = await cmaAdjust({
      cma_run_id: baselineData.cma_run_id!,
      condition,
      renovations,
      add_beds: addBeds,
      add_baths: addBaths,
      add_sqft: addSqft,
    });
    setAdjustedData(data);
    setTab("result");
  };

  /**
   * Toggle a renovation option in the list.  Keeps the list in sync when
   * checkboxes are toggled.
   */
  const toggleRenovation = (renovation: string) => {
    setRenovations((prev) =>
      prev.includes(renovation)
        ? prev.filter((r) => r !== renovation)
        : [...prev, renovation]
    );
  };

  /**
   * Download the CMA PDF for the current baseline run.
   */
  const downloadPdf = async () => {
    if (!baselineData) return;
    await cmaPdf(baselineData.cma_run_id);
  };

  /**
   * Render a list of comparable properties.  Each comp is wrapped in its
   * own card with address, specs, and price.  Uses raw_price from the
   * backend response to display the sales price.
   */
  const renderComps = (comps: Comp[]) => (
    <div className="grid grid-cols-1 gap-2 mt-4">
      {comps.map((comp, idx) => (
        <div key={comp.id ?? idx} className="border rounded p-3">
          <div className="font-semibold">{comp.address}</div>
          <div className="text-sm opacity-80">
            {comp.beds} bd | {comp.baths} ba | {comp.living_sqft} sqft
          </div>
          <div className="text-lg">
            ${((comp as any).raw_price ?? (comp as any).price ?? 0).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CMA Tool</h1>

      {/* Input for the subject property address */}
      <div className="flex gap-2 mb-4">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter subject property address"
          className="flex-1 border rounded-xl px-4 py-3"
        />
        <button
          onClick={() => fetchBaseline(address)}
          className="px-4 py-3 rounded-xl border"
        >
          Run CMA
        </button>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("snapshot")}
          className={`px-3 py-2 rounded ${tab === "snapshot" ? "font-bold" : ""}`}
        >
          Snapshot
        </button>
        <button
          onClick={() => setTab("adjustments")}
          className={`px-3 py-2 rounded ${tab === "adjustments" ? "font-bold" : ""}`}
        >
          Adjustments
        </button>
        <button
          onClick={() => setTab("result")}
          className={`px-3 py-2 rounded ${tab === "result" ? "font-bold" : ""}`}
        >
          Result
        </button>
      </div>

      {/* Snapshot tab */}
      {tab === "snapshot" && baselineData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Baseline CMA</h2>
          <div className="mb-2">
            Estimated Value: ${baselineData.estimate?.toLocaleString()}
          </div>
          {renderComps(baselineData.comps)}
          <button
            onClick={downloadPdf}
            className="mt-4 px-4 py-2 rounded bg-gray-100 border"
          >
            Download PDF
          </button>
        </div>
      )}

      {/* Adjustments tab */}
      {tab === "adjustments" && baselineData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Adjust Property</h2>

          {/* Condition selector */}
          <div className="mb-4">
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

          {/* Renovations checkboxes */}
          <div className="mb-4">
            <label className="block mb-1">Renovations</label>
            {[
              "Kitchen",
              "Bath",
              "Flooring",
              "Roof",
            ].map((opt) => (
              <label key={opt} className="block">
                <input
                  type="checkbox"
                  checked={renovations.includes(opt.toLowerCase())}
                  onChange={() => toggleRenovation(opt.toLowerCase())}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>

          {/* Add bedrooms */}
          <div className="mb-4">
            <label className="block mb-1">Add Beds</label>
            <input
              type="number"
              value={addBeds}
              onChange={(e) => setAddBeds(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          {/* Add bathrooms */}
          <div className="mb-4">
            <label className="block mb-1">Add Baths</label>
            <input
              type="number"
              value={addBaths}
              onChange={(e) => setAddBaths(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          {/* Add square footage */}
          <div className="mb-4">
            <label className="block mb-1">Add Sqft</label>
            <input
              type="number"
              value={addSqft}
              onChange={(e) => setAddSqft(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <button
            onClick={applyAdjustments}
            className="px-4 py-2 rounded bg-gray-100 border"
          >
            Apply Adjustments
          </button>
        </div>
      )}

      {/* Result tab */}
      {tab === "result" && adjustedData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Adjusted CMA</h2>
          <div className="mb-2">
            Adjusted Value: ${adjustedData.estimate?.toLocaleString()}
          </div>
          {renderComps(adjustedData.comps)}
          <button
            onClick={downloadPdf}
            className="mt-4 px-4 py-2 rounded bg-gray-100 border"
          >
            Download PDF
          </button>
        </div>
      )}
    </main>
  );
}