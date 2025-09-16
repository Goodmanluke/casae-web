type ConditionInputMode = "simple" | "advanced";

type PropertyCondition = {
  overall: "Excellent" | "Good" | "Fair" | "Poor";
  roof?: "Excellent" | "Good" | "Fair" | "Poor";
  windows?: "Excellent" | "Good" | "Fair" | "Poor";
  siding?: "Excellent" | "Good" | "Fair" | "Poor";
  kitchen?: "Excellent" | "Good" | "Fair" | "Poor";
  bathrooms?: "Excellent" | "Good" | "Fair" | "Poor";
  flooring?: "Excellent" | "Good" | "Fair" | "Poor";
  interior?: "Excellent" | "Good" | "Fair" | "Poor";
};

interface ConditionTabProps {
  conditionMode: ConditionInputMode;
  setConditionMode: (mode: ConditionInputMode) => void;
  propertyCondition: PropertyCondition;
  setPropertyCondition: (condition: PropertyCondition | ((prev: PropertyCondition) => PropertyCondition)) => void;
  onContinue: () => void;
}

export default function ConditionTab({
  conditionMode,
  setConditionMode,
  propertyCondition,
  setPropertyCondition,
  onContinue
}: ConditionTabProps) {
  const getConditionChips = () => {
    const chips: { label: string; color: string }[] = [];
    if (conditionMode === "simple") {
      chips.push({ label: `Overall: ${propertyCondition.overall}`, color: "blue" });
    } else {
      if (propertyCondition.roof) chips.push({ label: `Roof: ${propertyCondition.roof}`, color: "green" });
      if (propertyCondition.windows) chips.push({ label: `Windows: ${propertyCondition.windows}`, color: "green" });
      if (propertyCondition.siding) chips.push({ label: `Siding: ${propertyCondition.siding}`, color: "green" });
      if (propertyCondition.kitchen) chips.push({ label: `Kitchen: ${propertyCondition.kitchen}`, color: "purple" });
      if (propertyCondition.bathrooms) chips.push({ label: `Bathrooms: ${propertyCondition.bathrooms}`, color: "purple" });
      if (propertyCondition.flooring) chips.push({ label: `Flooring: ${propertyCondition.flooring}`, color: "orange" });
      if (propertyCondition.interior) chips.push({ label: `Interior: ${propertyCondition.interior}`, color: "orange" });
    }
    return chips;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/10 p-6 border border-white/10">
        <div className="text-xl font-semibold mb-4">Current Property Condition</div>
        <div className="text-sm opacity-80 mb-6">
          Assess the current condition of the property. This helps provide more accurate valuations.
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="text-sm font-medium mb-3">Assessment Mode</div>
          <div className="flex gap-3">
            <button
              onClick={() => setConditionMode("simple")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                conditionMode === "simple"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setConditionMode("advanced")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                conditionMode === "advanced"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Advanced Mode
            </button>
          </div>
        </div>

        {/* Simple Mode */}
        {conditionMode === "simple" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Overall Property Quality</label>
              <select
                value={propertyCondition.overall}
                onChange={(e) => setPropertyCondition(prev => ({
                  ...prev,
                  overall: e.target.value as any
                }))}
                className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="Excellent">Excellent - Move-in ready, recently updated</option>
                <option value="Good">Good - Well-maintained, minor updates needed</option>
                <option value="Fair">Fair - Some wear, moderate updates needed</option>
                <option value="Poor">Poor - Significant repairs/updates needed</option>
              </select>
            </div>
          </div>
        )}

        {/* Advanced Mode */}
        {conditionMode === "advanced" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'roof', label: 'Roof Condition' },
                { key: 'windows', label: 'Windows' },
                { key: 'siding', label: 'Siding/Exterior' },
                { key: 'kitchen', label: 'Kitchen' },
                { key: 'bathrooms', label: 'Bathrooms' },
                { key: 'flooring', label: 'Flooring' },
                { key: 'interior', label: 'Overall Interior' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2">{label}</label>
                  <select
                    value={propertyCondition[key as keyof PropertyCondition] || "Good"}
                    onChange={(e) => setPropertyCondition(prev => ({
                      ...prev,
                      [key]: e.target.value as any
                    }))}
                    className="w-full bg-white/90 text-gray-800 p-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Summary */}
        {getConditionChips().length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Condition Summary</div>
            <div className="flex flex-wrap gap-2">
              {getConditionChips().map((chip, idx) => (
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

        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onContinue}
            className="w-full px-6 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition"
          >
            Continue - Run Baseline CMA
          </button>
        </div>
      </div>
    </div>
  );
}
