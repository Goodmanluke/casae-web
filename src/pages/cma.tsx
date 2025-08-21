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

  const [condition, setCondition] = useState("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState(0);
  const [addBaths, setAddBaths] = useState(0);
  const [addSqft, setAddSqft] = useState(0);

  useEffect(() => {
    if (query.address) {
      setAddress(query.address as string);
      fetchBaseline(query.address as string);
    }
  }, [query.address]);

  const fetchBaseline = async (addr: string) => {
    const data = await cmaBaseline(addr);
    setBaselineData(data);
    setTab("snapshot");
  };

  const applyAdjustments = async () => {
    if (!baselineData) return;
    const data = await cmaAdjust({
      cma_run_id: baselineData?.cma_run_id!,
      condition,
      renovations,
      add_beds: addBeds,
      add_baths: addBaths,
      add_sqft: addSqft,
    });
    setAdjustedData(data);
    setTab("result");
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
    await cmaPdf(baselineData.cma_run_id);
  };

  const renderComps = (comps: Comp[]) => (
    <div className="grid grid-cols-1 gap-2 mt-4">
      {comps.map((comp, idx) => (
        <div
          key={idx}
          className="border rounded p-2 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">{comp.address}</div>
            <div className="text-sm text-gray-600">
              {comp.beds} bd | {comp.baths} ba | {comp.living_sqft} sqft
            </div>
          </div>
          <div className="font-bold">${comp.price?.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">CMA Tool</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter property address"
          className="border rounded p-2 w-2/3"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => fetchBaseline(address)}
        >
          Run CMA
        </button>
      </div>

      <div className="mb-4 flex space-x-4">
        <button
          className={`px-3 py-1 rounded ${
            tab === "snapshot" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("snapshot")}
        >
          Snapshot
        </button>
        <button
          className={`px-3 py-1 rounded ${
            tab === "adjustments" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("adjustments")}
        >
          Adjustments
        </button>
        <button
          className={`px-3 py-1 rounded ${
            tab === "result" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("result")}
        >
          Result
        </button>
      </div>

      {tab === "snapshot" && baselineData && (
        <div>
          <h2 className="text-xl font-bold mb-2">Baseline CMA</h2>
          <div className="text-lg font-bold mb-2">
            Estimated Value: ${baselineData.estimate?.toLocaleString()}
          </div>
          {renderComps(baselineData.comps)}
          <button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            onClick={downloadPdf}
          >
            Download PDF
          </button>
        </div>
      )}

      {tab === "adjustments" && baselineData && (
        <div>
          <h2 className="text-xl font-bold mb-2">Adjust Property</h2>
          <div className="mb-2">
            <label className="block">Condition</label>
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

          <div className="mb-2">
            <div className="mb-1">Renovations</div>
            <div className="flex gap-4 flex-wrap">
              {["Kitchen", "Bath", "Flooring", "Roof"].map((opt) => (
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

          <div className="mb-2">
            <label className="block">Add Beds</label>
            <input
              type="number"
              value={addBeds}
              onChange={(e) => setAddBeds(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <div className="mb-2">
            <label className="block">Add Baths</label>
            <input
              type="number"
              value={addBaths}
              onChange={(e) => setAddBaths(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <div className="mb-2">
            <label className="block">Add Sqft</label>
            <input
              type="number"
              value={addSqft}
              onChange={(e) => setAddSqft(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={applyAdjustments}
          >
            Apply Adjustments
          </button>
        </div>
      )}

      {tab === "result" && adjustedData && (
        <div>
          <h2 className="text-xl font-bold mb-2">Adjusted CMA</h2>
          <div className="text-lg font-bold mb-2">
            Adjusted Value: ${adjustedData.estimate?.toLocaleString()}
          </div>
          {renderComps(adjustedData.comps)}
          <button
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            onClick={downloadPdf}
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
