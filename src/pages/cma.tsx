import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { cmaBaseline, cmaAdjust, cmaPdf, getRentEstimate } from "../lib/api";
import type { Comp } from "../lib/api";
import { supabase } from "../lib/supabase";
import Navigation from "../components/Navigation";
import InvestmentCalculators from "../components/InvestmentCalculators";
import { useSubscription } from "../hooks/useSubscription";
import { useUsageLimit } from "../hooks/useUsageLimit";

type Tab = "snapshot" | "adjustments" | "result" | "calculators";

export default function CMA() {
  const { query } = useRouter();

  const [address, setAddress] = useState("");
  const [baselineData, setBaselineData] = useState<any>(null);
  const [adjustedData, setAdjustedData] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("snapshot");
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [adjustedMonthlyRent, setAdjustedMonthlyRent] = useState<number | null>(
    null
  );

  const {
    subscription,
    loading: subscriptionLoading,
    isPremium,
    isPro,
  } = useSubscription(userId);
  const {
    usageRecord,
    loading: usageLoading,
    checkUsageLimit,
    incrementUsage,
  } = useUsageLimit(userId, subscription?.plan_id || null);

  const getPlanName = () => {
    if (isPro) return "Pro";
    if (isPremium) return "Premium";
    return "Free";
  };

  const safeCheckUsageLimit = () => {
    try {
      return checkUsageLimit();
    } catch (error) {
      console.warn("Error checking usage limit:", error);
      return { canUse: false, usedCount: 0, limit: 0, remaining: 0 };
    }
  };

  const isButtonDisabled = (): boolean => {
    if (subscriptionLoading || usageLoading || !userId) return true;
    if (userId && !subscriptionLoading && !subscription) return true;
    if (userId && subscription && !safeCheckUsageLimit().canUse) return true;
    return false;
  };

  const getButtonText = (): string => {
    if (subscriptionLoading || usageLoading) return "Loading...";
    if (!userId) return "Login Required";
    if (!subscription) return "Subscription Required";
    if (!safeCheckUsageLimit().canUse) return "Limit Reached";
    return "Run CMA";
  };

  // Adjustment inputs
  const [condition, setCondition] = useState<
    "Poor" | "Fair" | "Good" | "Excellent"
  >("Good");
  const [renovations, setRenovations] = useState<string[]>([]);
  const [addBeds, setAddBeds] = useState<number>(0);
  const [addBaths, setAddBaths] = useState<number>(0);
  const [addSqft, setAddSqft] = useState<number>(0);

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    };
    getUserId();
  }, []);

  // On mount / on query change
  useEffect(() => {
    // Address bootstrap
    if (typeof query.address === "string" && query.address.trim().length > 0) {
      setAddress(query.address);
      fetchBaseline(query.address);
    }
    // Tab bootstrap
    if (
      typeof query.tab === "string" &&
      ["snapshot", "adjustments", "result", "calculators"].includes(query.tab)
    ) {
      setTab(query.tab as Tab);
    }
  }, [query.address, query.tab]);

  const fetchBaseline = async (addr: string) => {
    if (!addr) return;

    if (!userId) {
      setError("Please log in to use the CMA feature.");
      return;
    }
    if (!subscription) {
      setError(
        "You need an active Premium or Pro subscription to use the CMA feature. Please upgrade your plan."
      );
      return;
    }
    const usageCheck = safeCheckUsageLimit();
    if (!usageCheck.canUse) {
      setError(
        `You have reached your monthly CMA limit of ${
          usageCheck.limit
        } for your ${getPlanName()} plan. ${
          !isPro ? "Consider upgrading to Pro for more CMA runs or " : ""
        }Please wait until next month.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await cmaBaseline({ subject: { address: addr } } as any);
      setBaselineData(data);

      if (userId) {
        await incrementUsage();
      }

      // non-blocking rent fetch
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
        alert("Please login to save properties.");
        return;
      }
      const s = baselineData.subject || {};
      const { error } = await supabase.from("properties").insert([
        {
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
        },
      ]);
      if (error) throw error;
      setSaved(true);
      alert("Property saved.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const getAdjustmentChips = () => {
    const chips: { label: string; color: string }[] = [];
    if (condition !== "Good") chips.push({ label: condition, color: "blue" });
    renovations.forEach((r) => chips.push({ label: r, color: "green" }));
    if (addBeds > 0) chips.push({ label: `+${addBeds} Bed`, color: "purple" });
    if (addBaths > 0)
      chips.push({ label: `+${addBaths} Bath`, color: "purple" });
    if (addSqft > 0) chips.push({ label: `+${addSqft} Sqft`, color: "orange" });
    return chips;
  };

  const renderPropertyCard = (comp: Comp | any, isSubject: boolean = false) => (
    <div
      key={comp.id || (isSubject ? "subject" : Math.random())}
      className="rounded-xl bg-white/10 p-4 text-white backdrop-blur border border-white/10"
    >
      <div className="flex items-start justify-between">
        <div className="text-sm opacity-80">
          {isSubject ? "Subject Property" : "Comparable"}
        </div>
        {typeof comp.similarity === "number" && !isSubject && (
          <div className="text-xs bg-white/20 px-2 py-1 rounded">
            Similarity {(comp.similarity * 100).toFixed(0)}%
          </div>
        )}
      </div>
      <div className="mt-2 text-lg font-semibold">{comp.address ?? "—"}</div>
      <div className="mt-1 text-sm opacity-90">
        {comp.beds ?? comp.subject_beds ?? "—"} bd ·{" "}
        {comp.baths ?? comp.subject_baths ?? "—"} ba ·{" "}
        {comp.living_sqft ?? comp.sqft ?? "—"} sqft
      </div>
      <div className="mt-2 text-emerald-200 font-semibold">
        {typeof comp.raw_price === "number"
          ? `$${comp.raw_price.toLocaleString()}`
          : comp.price
          ? `$${Number(comp.price).toLocaleString()}`
          : "—"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8 text-white">
        {/* Address bar */}
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!address.trim()) return;
              fetchBaseline(address.trim());
            }}
            className="flex gap-3"
          >
            <input
              className="flex-1 bg-white/90 text-gray-800 p-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Enter property address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              type="submit"
              disabled={isButtonDisabled()}
              className={`px-6 py-3 rounded-xl transition text-white font-semibold shadow-lg ${
                isButtonDisabled()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-600"
              }`}
            >
              {getButtonText()}
            </button>
          </form>
        </div>

        {userId && !subscriptionLoading && !usageLoading && subscription && (
          <div className="mb-6 rounded-xl bg-white/10 p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">CMA Usage This Month</div>
                <div className="text-lg font-semibold">
                  {safeCheckUsageLimit().usedCount} /{" "}
                  {safeCheckUsageLimit().limit} used
                </div>
                <div className="text-xs opacity-75">
                  {safeCheckUsageLimit().remaining} remaining on {getPlanName()}{" "}
                  plan
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    safeCheckUsageLimit().canUse
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {safeCheckUsageLimit().canUse ? "Available" : "Limit Reached"}
                </div>
                {!safeCheckUsageLimit().canUse && (
                  <div className="text-xs opacity-75 mt-1">
                    Resets next month
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    safeCheckUsageLimit().usedCount >=
                    safeCheckUsageLimit().limit
                      ? "bg-red-500"
                      : safeCheckUsageLimit().usedCount >=
                        safeCheckUsageLimit().limit * 0.8
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      safeCheckUsageLimit().limit > 0
                        ? (safeCheckUsageLimit().usedCount /
                            safeCheckUsageLimit().limit) *
                            100
                        : 0
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {userId && !subscriptionLoading && !subscription && (
          <div className="mb-6 rounded-xl bg-orange-500/20 p-4 border border-orange-400/30">
            <div className="font-semibold text-orange-200">
              Subscription Required
            </div>
            <div className="opacity-90 text-orange-100">
              You need an active Premium or Pro subscription to use the CMA
              feature.
              <a href="/dashboard" className="underline hover:no-underline">
                Upgrade your plan
              </a>{" "}
              to get started.
            </div>
          </div>
        )}

        {/* Loading / Error */}
        {loading && (
          <div className="mb-6 rounded-xl bg-white/10 p-4 border border-white/10">
            Analyzing property...
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/20 p-4 border border-red-400/30">
            <div className="font-semibold">Error</div>
            <div className="opacity-90">{error}</div>
          </div>
        )}

        {/* Tabs */}
        {baselineData && (
          <>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab("snapshot")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  tab === "snapshot"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Snapshot
              </button>
              <button
                onClick={() => setTab("adjustments")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  tab === "adjustments"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Adjustments
              </button>
              <button
                onClick={() => setTab("result")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  tab === "result"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Result
              </button>
              <button
                onClick={() => setTab("calculators")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  tab === "calculators"
                    ? "bg-cyan-500 text-white shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Calculators
              </button>
            </div>

            {/* Tab content */}
            {tab === "snapshot" && (
              <div className="space-y-6">
                {/* AI Narrative */}
                {baselineData.explanation && (
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="text-lg font-semibold mb-1">
                      AI Analysis
                    </div>
                    <div className="opacity-90">{baselineData.explanation}</div>
                  </div>
                )}

                {/* Subject Property */}
                {baselineData.subject && (
                  <div className="space-y-3">
                    <div className="text-lg font-semibold">
                      Subject Property
                    </div>
                    {renderPropertyCard(
                      {
                        id: "subject",
                        address: baselineData.subject.address,
                        raw_price: baselineData.estimate,
                        living_sqft: baselineData.subject.sqft || 0,
                        beds: baselineData.subject.beds || 0,
                        baths: baselineData.subject.baths || 0,
                        year_built: baselineData.subject.year_built,
                        lot_sqft: baselineData.subject.lot_sqft,
                        similarity: 1,
                      },
                      true
                    )}
                  </div>
                )}

                {/* Estimate & Rent */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="text-sm opacity-80">Estimated Value</div>
                    <div className="text-2xl font-bold">
                      {baselineData.estimate
                        ? `$${baselineData.estimate.toLocaleString()}`
                        : "—"}
                    </div>
                    <div className="text-xs opacity-75 mt-1">Baseline CMA</div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="text-sm opacity-80">
                      Estimated Monthly Rent
                    </div>
                    <div className="text-2xl font-bold">
                      {monthlyRent !== null
                        ? `$${monthlyRent.toLocaleString()}`
                        : "—"}
                    </div>
                  </div>
                </div>

                {Array.isArray(baselineData.comps) &&
                  baselineData.comps.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">
                        Comparable Properties
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {baselineData.comps.map((comp: Comp, idx: number) =>
                          renderPropertyCard(comp)
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => downloadPdf(false)}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                  >
                    Download PDF
                  </button>

                  <button
                    onClick={saveProperty}
                    className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition text-white font-medium"
                  >
                    {saved ? "Saved" : saving ? "Saving..." : "Save Property"}
                  </button>
                </div>
              </div>
            )}

            {tab === "adjustments" && (
              <div className="space-y-6">
                <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                  <div className="text-lg font-semibold mb-3">
                    Adjust Property
                  </div>

                  {/* Condition */}
                  <label className="block text-sm mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option>Poor</option>
                    <option>Fair</option>
                    <option>Good</option>
                    <option>Excellent</option>
                  </select>

                  {/* Renovations */}
                  <div className="mt-4">
                    <div className="text-sm mb-2">Renovations</div>
                    <div className="flex flex-wrap gap-3">
                      {["Kitchen", "Bath", "Flooring", "Roof", "Windows"].map(
                        (opt) => (
                          <label
                            key={opt}
                            className="inline-flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={renovations.includes(opt.toLowerCase())}
                              onChange={() =>
                                toggleRenovation(opt.toLowerCase())
                              }
                            />
                            {opt}
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Adds */}
                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Add Beds</label>
                      <input
                        type="number"
                        value={addBeds}
                        onChange={(e) => setAddBeds(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Add Baths</label>
                      <input
                        type="number"
                        value={addBaths}
                        onChange={(e) => setAddBaths(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Add Sqft</label>
                      <input
                        type="number"
                        value={addSqft}
                        onChange={(e) => setAddSqft(Number(e.target.value))}
                        className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Summary chips */}
                  {getAdjustmentChips().length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm mb-2">Adjustment Summary</div>
                      <div className="flex flex-wrap gap-2">
                        {getAdjustmentChips().map((chip, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1 rounded-full bg-white/20 text-xs border border-white/20"
                          >
                            {chip.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5">
                    <button
                      onClick={applyAdjustments}
                      className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition text-white font-semibold shadow-lg"
                    >
                      Apply Adjustments
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "result" && adjustedData && (
              <div className="space-y-6">
                {/* Side-by-side values */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="text-sm opacity-80">Baseline Value</div>
                    <div className="text-2xl font-bold">
                      {baselineData.estimate
                        ? `$${baselineData.estimate.toLocaleString()}`
                        : "—"}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Original Estimate
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                    <div className="text-sm opacity-80">Adjusted Value</div>
                    <div className="text-2xl font-bold">
                      {adjustedData.estimate
                        ? `$${adjustedData.estimate.toLocaleString()}`
                        : "—"}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      After Adjustments
                    </div>
                  </div>
                </div>

                {/* Value Change */}
                <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                  <div className="text-sm opacity-80 mb-1">Value Change</div>
                  <div className="text-xl font-semibold">
                    {baselineData?.estimate && adjustedData?.estimate ? (
                      <>
                        {adjustedData.estimate > baselineData.estimate
                          ? "+"
                          : "-"}
                        $
                        {Math.abs(
                          adjustedData.estimate - baselineData.estimate
                        ).toLocaleString()}{" "}
                        (
                        {(
                          ((adjustedData.estimate - baselineData.estimate) /
                            baselineData.estimate) *
                          100
                        ).toFixed(1)}
                        %)
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>

                {/* Updated comps */}
                {Array.isArray(adjustedData.comps) &&
                  adjustedData.comps.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">
                        Updated Comparables
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {adjustedData.comps.map((comp: Comp, idx: number) =>
                          renderPropertyCard(comp)
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => downloadPdf(true)}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                  >
                    Download Adjusted PDF
                  </button>
                </div>
              </div>
            )}

            {tab === "calculators" && (
              <InvestmentCalculators
                baselineData={baselineData}
                adjustedData={adjustedData}
                monthlyRent={monthlyRent}
              />
            )}
          </>
        )}

        {/* Initial state */}
        {!baselineData && !loading && !error && (
          <div className="rounded-xl bg-white/10 p-6 border border-white/10 text-center">
            Enter an address above, then click{" "}
            <span className="font-semibold">Run CMA</span>.
          </div>
        )}
      </div>
    </div>
  );
}
