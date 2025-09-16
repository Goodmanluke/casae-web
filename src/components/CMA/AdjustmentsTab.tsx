interface AdjustmentsTabProps {
  condition: "Poor" | "Fair" | "Good" | "Excellent";
  setCondition: (condition: "Poor" | "Fair" | "Good" | "Excellent") => void;
  renovations: string[];
  toggleRenovation: (renovation: string) => void;
  addBeds: number;
  setAddBeds: (beds: number) => void;
  addBaths: number;
  setAddBaths: (baths: number) => void;
  addSqft: number;
  setAddSqft: (sqft: number) => void;
  onApplyAdjustments: () => void;
  loading: boolean;
}

export default function AdjustmentsTab({
  condition,
  setCondition,
  renovations,
  toggleRenovation,
  addBeds,
  setAddBeds,
  addBaths,
  setAddBaths,
  addSqft,
  setAddSqft,
  onApplyAdjustments,
  loading,
}: AdjustmentsTabProps) {
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/10 p-4 border border-white/10">
        <div className="text-lg font-semibold mb-3">Adjustmetns</div>
        <div className="text-sm opacity-80 mb-4">
          Plan renovations, additions, or improvements to calculate the After
          Repair Value (ARV).
        </div>

        {/* Condition */}
        <label className="block text-sm mb-1">
          Overall Condition After Improvements
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as any)}
          className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-4"
        >
          <option>Poor</option>
          <option>Fair</option>
          <option>Good</option>
          <option>Excellent</option>
        </select>

        {/* Renovations */}
        <div className="mt-4">
          <div className="text-sm mb-2">Planned Renovations</div>
          <div className="flex flex-wrap gap-3">
            {["Kitchen", "Bath", "Flooring", "Roof", "Windows"].map((opt) => (
              <label key={opt} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={renovations.includes(opt.toLowerCase())}
                  onChange={() => toggleRenovation(opt.toLowerCase())}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Adds */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Add Bedrooms</label>
            <input
              type="number"
              value={addBeds}
              onChange={(e) => setAddBeds(Number(e.target.value))}
              className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Add Bathrooms</label>
            <input
              type="number"
              step="0.5"
              value={addBaths}
              onChange={(e) => setAddBaths(Number(e.target.value))}
              className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Add Square Feet</label>
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
            onClick={onApplyAdjustments}
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed text-white"
                : "bg-cyan-500 hover:bg-cyan-600 text-white"
            }`}
          >
            {loading ? "Applying..." : "Apply Addjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
