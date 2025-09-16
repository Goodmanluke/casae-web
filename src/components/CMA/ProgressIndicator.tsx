type Tab = "address" | "condition" | "baseline" | "adjustments" | "result" | "calculators";

interface ProgressIndicatorProps {
  currentTab: Tab;
  addressConfirmed: boolean;
  conditionCompleted: boolean;
  baselineCompleted: boolean;
}

export default function ProgressIndicator({
  currentTab,
  addressConfirmed,
  conditionCompleted,
  baselineCompleted
}: ProgressIndicatorProps) {
  const steps = [
    { key: "address", label: "1. Address", completed: addressConfirmed },
    { key: "condition", label: "2. Condition", completed: conditionCompleted },
    { key: "baseline", label: "3. Baseline CMA", completed: baselineCompleted },
    { key: "adjustments", label: "4. Planned Changes", completed: false },
    { key: "result", label: "5. Results", completed: false },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4 mb-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step.completed 
                ? "bg-green-500 text-white" 
                : currentTab === step.key
                ? "bg-cyan-500 text-white"
                : "bg-white/20 text-white/50"
            }`}>
              {step.completed ? "✓" : index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              step.completed || currentTab === step.key ? "text-white" : "text-white/50"
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-px mx-4 ${
                step.completed ? "bg-green-500" : "bg-white/20"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
