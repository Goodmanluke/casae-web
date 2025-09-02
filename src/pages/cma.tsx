import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf, getRentEstimate } from "../lib/api";
import type { CMAResponse, Comp } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import Navigation from "../components/Navigation";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);

  // Adjustment inputs
  const [condition, setCondition] = useState("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState(0);
  const [addBaths, setAddBaths] = useState(0);
  const [addSqft, setAddSqft] = useState(0);

  // Auto-run when ?address= is present and handle tab parameter
  useEffect(() => {
    if (typeof query.address === "string" && query.address.trim().length > 0) {
      setAddress(query.address);
      fetchBaseline(query.address);
    }

    // Handle tab parameter
    if (typeof query.tab === "string" && ["snapshot", "adjustments", "result"].includes(query.tab)) {
      setTab(query.tab as Tab);
    }
  }, [query.address, query.tab]);

  const fetchBaseline = async (addr: string) => {
    if (!addr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cmaBaseline({ subject: { address: addr } } as any);
      console.log("[CMA] Received baseline data:", data);
      console.log("[CMA] Subject property details:", data.subject);
      console.log("[CMA] Subject beds:", data.subject.beds);
      console.log("[CMA] Subject baths:", data.subject.baths);
      console.log("[CMA] Subject sqft:", data.subject.sqft);
      console.log("[CMA] Subject year_built:", data.subject.year_built);
      setBaselineData(data);
      // fetch monthly rent in parallel (non-blocking)
      getRentEstimate(addr)
        .then((r) => setMonthlyRent(r?.monthly_rent ?? null))
        .catch(() => setMonthlyRent(null));
      setAdjustedData(null);
      setSaved(false);
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
      console.log("[CMA] Applying adjustments:", {
        cma_run_id: baselineData.cma_run_id,
        condition,
        renovations,
        add_beds: addBeds,
        add_baths: addBaths,
        add_sqft: addSqft,
      });
      
      const data = await cmaAdjust({
        cma_run_id: baselineData.cma_run_id,
        condition,
        renovations,
        add_beds: addBeds,
        add_baths: addBaths,
        add_sqft: addSqft,
      });
      
      console.log("[CMA] Received adjusted data:", data);
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

  const downloadPdf = async (useAdjusted: boolean = false) => {
    if (!baselineData) return;
    try {
      await cmaPdf(baselineData.cma_run_id, { adjusted: useAdjusted });
    } catch (err) {
      console.error("PDF failed:", err);
      alert("Could not start PDF download.");
    }
  };

  const saveProperty = async () => {
    if (!baselineData) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        alert('Please login to save properties.');
        return;
      }
      const s = baselineData.subject;
      const { error } = await supabase
        .from('properties')
        .insert([{
          user_id: userId,
          address: s.address,
          raw_price: baselineData.estimate,
          beds: s.beds ?? null,
          baths: s.baths ?? null,
          living_sqft: s.sqft ?? null,
          lot_size: s.lot_sqft ?? null,
          year_built: s.year_built ?? null,
          condition_rating: s.condition ?? null,
          sale_date: null,
        }]);
      if (error) throw error;
      setSaved(true);
      alert('Property saved.');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  // Get adjustment summary chips
  const getAdjustmentChips = () => {
    const chips = [];
    if (condition !== "Good") chips.push({ label: condition, color: "blue" });
    renovations.forEach(renovation => chips.push({ label: renovation, color: "green" }));
    if (addBeds > 0) chips.push({ label: `+${addBeds} Bed`, color: "purple" });
    if (addBaths > 0) chips.push({ label: `+${addBaths} Bath`, color: "purple" });
    if (addSqft > 0) chips.push({ label: `+${addSqft} Sqft`, color: "orange" });
    return chips;
  };

  // Render property card with photo
  const renderPropertyCard = (comp: Comp, isSubject: boolean = false) => (
    <div className={`bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-black/50 transition-all duration-300 ${isSubject ? 'ring-2 ring-cyan-400' : ''}`}>
      {/* Property Photo */}
      <div className="w-full h-48 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl mb-4 overflow-hidden">
        {comp.photo_url ? (
          <img
            src={comp.photo_url}
            alt={comp.address}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${comp.address.split(',')[0]}`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {comp.address}
          </h3>
          {isSubject && (
            <div className="inline-block bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-lg text-xs font-medium">
              Subject Property
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-2xl font-bold text-emerald-400">
              ${(comp.raw_price || 0).toLocaleString()}
            </div>
            <div className="text-white/60 text-sm">Price</div>
          </div>

          <div className="bg-black/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-2xl font-bold text-cyan-400">
              {comp.beds || 0}
            </div>
            <div className="text-white/60 text-sm">Beds</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-black/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
            <div className="text-lg font-semibold text-white">{comp.baths || 0}</div>
            <div className="text-white/60 text-xs">Baths</div>
          </div>
          <div className="bg-black/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
            <div className="text-lg font-semibold text-white">{comp.living_sqft || 0}</div>
            <div className="text-white/60 text-xs">Sqft</div>
          </div>
          <div className="bg-black/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
            <div className="text-lg font-semibold text-white">{comp.year_built || 'N/A'}</div>
            <div className="text-white/60 text-xs">Year</div>
          </div>
        </div>

        {/* Additional details */}
        <div className="space-y-2 text-sm text-white/70">
          {comp.lot_sqft && (
            <div className="flex justify-between">
              <span>Lot Size:</span>
              <span>{comp.lot_sqft} sqft</span>
            </div>
          )}
          {comp.distance_mi && (
            <div className="flex justify-between">
              <span>Distance:</span>
              <span>{comp.distance_mi.toFixed(1)} mi</span>
            </div>
          )}
          {!isSubject && (
            <div className="flex justify-between">
              <span>Similarity:</span>
              <span>{Math.round((comp.similarity || 0) * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <img src="/cma-bg.svg" alt="" className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed inset-0 bg-black/30 -z-10" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navigation />

        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {/* Address input section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex gap-4 items-center">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchBaseline(address);
                  }
                }}
                placeholder="Enter subject property address"
                className="flex-1 bg-white/90 text-gray-800 px-6 py-4 rounded-xl border-0 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50"
              />
              <button
                onClick={() => fetchBaseline(address)}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Running...' : 'Run CMA'}
              </button>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <p className="mt-4 text-white text-lg">Analyzing property...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Tabs */}
          {baselineData && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTab("snapshot")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${tab === "snapshot"
                      ? "bg-cyan-500 text-white shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  Snapshot
                </button>
                <button
                  onClick={() => setTab("adjustments")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${tab === "adjustments"
                      ? "bg-cyan-500 text-white shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  Adjustments
                </button>
                <button
                  onClick={() => setTab("result")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${tab === "result"
                      ? "bg-cyan-100 text-gray-800 shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  Result
                </button>
              </div>

              {/* Tab content */}
              {tab === "snapshot" && (
                <div className="space-y-6">
                  {/* AI Narrative */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
                    <h3 className="text-xl font-semibold text-white mb-4">AI Analysis</h3>
                    <p className="text-white/90 leading-relaxed">{baselineData.explanation}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Subject Property */}
                    {baselineData.subject && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Subject Property</h3>
                        {(() => {
                          const subjectCard = {
                            id: "subject",
                            address: baselineData.subject.address,
                            raw_price: baselineData.estimate,
                            living_sqft: baselineData.subject.sqft || 0,
                            beds: baselineData.subject.beds || 0,
                            baths: baselineData.subject.baths || 0,
                            year_built: baselineData.subject.year_built,
                            lot_sqft: baselineData.subject.lot_sqft,
                            similarity: 1,
                          };
                          console.log("[CMA] Subject card data:", subjectCard);
                          return renderPropertyCard(subjectCard, true);
                        })()}
                      </div>
                    )}

                    {/* Estimate & Rent */}
                    <div className="bg-gradient-to-br from-cyan-100/10 to-blue-200/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/30">
                      <h3 className="text-xl font-semibold text-white mb-4">Estimated Value</h3>
                      <div className="text-4xl font-bold text-cyan-300">
                        ${baselineData.estimate?.toLocaleString()}
                      </div>
                      <p className="text-cyan-200 mt-2">Baseline CMA</p>
                      {monthlyRent !== null && (
                        <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20">
                          <div className="text-sm text-white/70">Estimated Monthly Rent</div>
                          <div className="text-2xl font-semibold text-emerald-300">
                            ${monthlyRent.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparables */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Comparable Properties</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {baselineData.comps.map((comp, idx) => (
                        <div key={comp.id ?? idx}>
                          {renderPropertyCard(comp)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => downloadPdf(false)}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={saveProperty}
                      disabled={saving || saved}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
                    >
                      {saved ? 'Saved' : saving ? 'Saving...' : 'Save Property'}
                    </button>
                  </div>
                </div>
              )}

              {tab === "adjustments" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Adjust Property</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <label className="block text-white font-medium mb-3">Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="Poor">Poor</option>
                        <option value="Fair">Fair</option>
                        <option value="Good">Good</option>
                        <option value="Excellent">Excellent</option>
                      </select>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <label className="block text-white font-medium mb-3">Renovations</label>
                      <div className="space-y-2">
                        {["Kitchen", "Bath", "Flooring", "Roof"].map((opt) => (
                          <label key={opt} className="flex items-center text-white/90">
                            <input
                              type="checkbox"
                              className="mr-3 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                              checked={renovations.includes(opt.toLowerCase())}
                              onChange={() => toggleRenovation(opt.toLowerCase())}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <label className="block text-white font-medium mb-3">Add Beds</label>
                      <input
                        type="number"
                        value={addBeds}
                        onChange={(e) => setAddBeds(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <label className="block text-white font-medium mb-3">Add Baths</label>
                      <input
                        type="number"
                        value={addBaths}
                        onChange={(e) => setAddBaths(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <label className="block text-white font-medium mb-3">Add Sqft</label>
                      <input
                        type="number"
                        value={addSqft}
                        onChange={(e) => setAddSqft(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Adjustment Summary */}
                  {getAdjustmentChips().length > 0 && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                      <h4 className="text-white font-medium mb-3">Adjustment Summary</h4>
                      <div className="flex flex-wrap gap-2">
                        {getAdjustmentChips().map((chip, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${chip.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                                chip.color === 'green' ? 'bg-green-500/20 text-green-300' :
                                  chip.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                                    'bg-orange-500/20 text-orange-300'
                              }`}
                          >
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      onClick={applyAdjustments}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Apply Adjustments
                    </button>
                  </div>
                </div>
              )}

              {tab === "result" && adjustedData && (
                <div className="space-y-6">
                  {/* Side-by-side comparison */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/30">
                      <h3 className="text-xl font-semibold text-white mb-4">Baseline Value</h3>
                      <div className="text-4xl font-bold text-cyan-300">
                        ${baselineData.estimate?.toLocaleString()}
                      </div>
                      <p className="text-cyan-200 mt-2">Original Estimate</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
                      <h3 className="text-xl font-semibold text-white mb-4">Adjusted Value</h3>
                      <div className="text-4xl font-bold text-green-300">
                        ${adjustedData.estimate?.toLocaleString()}
                      </div>
                      <p className="text-green-200 mt-2">After Adjustments</p>
                    </div>
                  </div>

                  {/* Value Change */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30 text-center">
                    <h4 className="text-white font-medium mb-2">Value Change</h4>
                    <div className={`text-2xl font-bold ${adjustedData.estimate > baselineData.estimate ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {adjustedData.estimate > baselineData.estimate ? '+' : ''}
                      ${(adjustedData.estimate - baselineData.estimate).toLocaleString()}
                      <span className="text-lg text-white/60 ml-2">
                        ({((adjustedData.estimate - baselineData.estimate) / baselineData.estimate * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Updated Comparables */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Updated Comparables</h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {adjustedData.comps.map((comp, idx) => (
                        <div key={comp.id ?? idx}>
                          {renderPropertyCard(comp)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => downloadPdf(true)}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Download Adjusted PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial state */}
          {!baselineData && !loading && !error && (
            <div className="text-center py-16">
              <div className="text-white/60 text-xl">
                Enter an address above, then click <strong className="text-white">Run CMA</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
