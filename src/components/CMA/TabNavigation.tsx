type Tab = "address" | "condition" | "baseline" | "adjustments" | "result" | "calculators";

interface TabNavigationProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  addressConfirmed: boolean;
  conditionCompleted: boolean;
  baselineCompleted: boolean;
}

export default function TabNavigation({
  currentTab,
  setTab,
  addressConfirmed,
  conditionCompleted,
  baselineCompleted
}: TabNavigationProps) {
  const canAccessTab = (tabName: Tab) => {
    switch (tabName) {
      case "address":
        return true;
      case "condition":
        return addressConfirmed;
      case "baseline":
        return addressConfirmed && conditionCompleted;
      case "adjustments":
        return baselineCompleted;
      case "result":
        return baselineCompleted;
      case "calculators":
        return baselineCompleted;
      default:
        return false;
    }
  };

  const getTabButtonClass = (tabName: Tab) => {
    const isActive = currentTab === tabName;
    const canAccess = canAccessTab(tabName);
    
    if (isActive) {
      return "bg-cyan-500 text-white shadow-lg";
    } else if (canAccess) {
      return "bg-white/20 text-white hover:bg-white/30";
    } else {
      return "bg-white/10 text-white/50 cursor-not-allowed";
    }
  };

  const tabs = [
    { key: "address", label: "1. Address" },
    { key: "condition", label: "2. Current Condition" },
    { key: "baseline", label: "3. Baseline CMA" },
    { key: "adjustments", label: "4. Planned Changes" },
    { key: "result", label: "5. Results" },
    { key: "calculators", label: "6. Calculators" }
  ];

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => canAccessTab(key as Tab) && setTab(key as Tab)}
          className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${getTabButtonClass(key as Tab)}`}
          disabled={!canAccessTab(key as Tab)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
