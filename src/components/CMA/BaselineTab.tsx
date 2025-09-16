import type { Comp } from "../../lib/api";

interface BaselineTabProps {
  baselineData: any;
  monthlyRent: number | null;
  onDownloadPdf: () => void;
  onSaveProperty: () => void;
  onMakeAdjustments: () => void;
  saved: boolean;
  saving: boolean;
}

export default function BaselineTab({
  baselineData,
  monthlyRent,
  onDownloadPdf,
  onSaveProperty,
  onMakeAdjustments,
  saved,
  saving
}: BaselineTabProps) {
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
          onClick={onDownloadPdf}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
        >
          Download PDF
        </button>

        <button
          onClick={onSaveProperty}
          className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition text-white font-medium"
        >
          {saved ? "Saved" : saving ? "Saving..." : "Save Property"}
        </button>

        <button
          onClick={onMakeAdjustments}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition"
        >
          Make Adjustments
        </button>
      </div>
    </div>
  );
}
