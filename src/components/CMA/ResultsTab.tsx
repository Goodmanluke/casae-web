import type { Comp } from "../../lib/api";

interface ResultsTabProps {
  baselineData: any;
  adjustedData: any;
  monthlyRent: number | null;
  adjustedMonthlyRent: number | null;
  onDownloadPdf: () => void;
  onGoToCalculators: () => void;
}

export default function ResultsTab({
  baselineData,
  adjustedData,
  monthlyRent,
  adjustedMonthlyRent,
  onDownloadPdf,
  onGoToCalculators,
}: ResultsTabProps) {
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
          <div className="text-xs opacity-75 mt-1">Current Condition</div>
        </div>
        <div className="rounded-xl bg-white/10 p-4 border border-white/10">
          <div className="text-sm opacity-80">After Repair Value (ARV)</div>
          <div className="text-2xl font-bold">
            {adjustedData.estimate
              ? `$${adjustedData.estimate.toLocaleString()}`
              : "—"}
          </div>
          <div className="text-xs opacity-75 mt-1">After Improvements</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/10 p-4 border border-white/10">
          <div className="text-sm opacity-80">Current Monthly Rent</div>
          <div className="text-2xl font-bold">
            {monthlyRent !== null ? `$${monthlyRent.toLocaleString()}` : "—"}
          </div>
          <div className="text-xs opacity-75 mt-1">Current Condition</div>
        </div>
        <div className="rounded-xl bg-white/10 p-4 border border-white/10">
          <div className="text-sm opacity-80">Improved Monthly Rent</div>
          <div className="text-2xl font-bold">
            {adjustedMonthlyRent !== null
              ? `$${adjustedMonthlyRent.toLocaleString()}`
              : monthlyRent !== null
              ? `$${monthlyRent.toLocaleString()}`
              : "—"}
          </div>
          <div className="text-xs opacity-75 mt-1">
            {adjustedMonthlyRent !== null ? "After Improvements" : "No Change"}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/10 p-4 border border-white/10">
          <div className="text-sm opacity-80 mb-1">Value Increase</div>
          <div className="text-xl font-semibold">
            {baselineData?.estimate && adjustedData?.estimate ? (
              <>
                {adjustedData.estimate > baselineData.estimate ? "+" : ""}$
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
        <div className="rounded-xl bg-white/10 p-4 border border-white/10">
          <div className="text-sm opacity-80 mb-1">Rent Increase</div>
          <div className="text-xl font-semibold">
            {monthlyRent !== null &&
            adjustedMonthlyRent !== null &&
            adjustedMonthlyRent !== monthlyRent ? (
              <>
                {adjustedMonthlyRent > monthlyRent ? "+" : ""}$
                {Math.abs(adjustedMonthlyRent - monthlyRent).toLocaleString()} (
                {(
                  ((adjustedMonthlyRent - monthlyRent) / monthlyRent) *
                  100
                ).toFixed(1)}
                %)
              </>
            ) : (
              "No Change"
            )}
          </div>
        </div>
      </div>

      {/* Updated comps */}
      {Array.isArray(adjustedData.comps) && adjustedData.comps.length > 0 && (
        <div className="space-y-3">
          <div className="text-lg font-semibold">
            Updated Comparable Properties
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
          onClick={onDownloadPdf}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
        >
          Download Result
        </button>

        <button
          onClick={onGoToCalculators}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition"
        >
          Investment Analysis
        </button>
      </div>
    </div>
  );
}
