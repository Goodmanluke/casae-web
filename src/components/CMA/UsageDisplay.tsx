interface UsageDisplayProps {
  userId: string | undefined;
  subscriptionLoading: boolean;
  usageLoading: boolean;
  subscription: any;
  safeCheckUsageLimit: () => { canUse: boolean; usedCount: number; limit: number; remaining: number };
  getPlanName: () => string;
}

export default function UsageDisplay({
  userId,
  subscriptionLoading,
  usageLoading,
  subscription,
  safeCheckUsageLimit,
  getPlanName
}: UsageDisplayProps) {
  if (!userId || subscriptionLoading || usageLoading || !subscription) {
    return null;
  }

  const usageCheck = safeCheckUsageLimit();

  return (
    <div className="mb-6 rounded-xl bg-white/10 p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-80">CMA Usage This Month</div>
          <div className="text-lg font-semibold">
            {usageCheck.usedCount} / {usageCheck.limit} used
          </div>
          <div className="text-xs opacity-75">
            {usageCheck.remaining} remaining on {getPlanName()} plan
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              usageCheck.canUse ? "text-green-400" : "text-red-400"
            }`}
          >
            {usageCheck.canUse ? "Available" : "Limit Reached"}
          </div>
          {!usageCheck.canUse && (
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
              usageCheck.usedCount >= usageCheck.limit
                ? "bg-red-500"
                : usageCheck.usedCount >= usageCheck.limit * 0.8
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                usageCheck.limit > 0
                  ? (usageCheck.usedCount / usageCheck.limit) * 100
                  : 0
              )}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
