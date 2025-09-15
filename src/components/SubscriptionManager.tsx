import { useState, useEffect } from "react";
import { useSubscription } from "../hooks/useSubscription";
import { useRouter } from "next/router";

interface SubscriptionManagerProps {
  userId: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  userId,
}) => {
  const router = useRouter();
  const {
    subscription,
    loading,
    error,
    isPremium,
    isPro,
    isTrialing,
    cancelSubscription,
    changePlan,
  } = useSubscription(userId);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await cancelSubscription();
      setShowCancelConfirm(false);
      alert(
        "Subscription will be canceled at the end of your current billing period."
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanChange = async (
    newPlanId: string,
    action: "upgrade" | "downgrade"
  ) => {
    try {
      setActionLoading(true);
      setActionError(null);

      const result = await changePlan(newPlanId, action);

      if (action === "upgrade") {
        alert("Plan upgraded successfully! Changes are effective immediately.");
      } else {
        alert(
          "Plan will be downgraded at the end of your current billing period."
        );
      }

      // Refresh the page to show updated state
      window.location.reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to change plan"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Subscription Management
        </h2>
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2.5"
            />
          </svg>
          <p className="text-gray-500 mb-4">No active subscription found</p>
          <button
            onClick={() => router.push("/plans")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Available Plans
          </button>
        </div>
      </div>
    );
  }

  const currentPlanName = isPremium ? "Premium" : isPro ? "Pro" : "Unknown";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Subscription Management
      </h2>

      {/* Current Subscription Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Current Plan: {currentPlanName}
            </h3>
            <p className="text-gray-600">
              Status:{" "}
              <span className="capitalize font-medium text-green-600">
                {subscription.status}
              </span>
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isPremium
                ? "bg-emerald-100 text-emerald-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {currentPlanName}
          </div>
        </div>

        {subscription.current_period_end && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Days remaining:</span>
              <span className="ml-2 font-medium">
                {calculateDaysRemaining(subscription.current_period_end)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Next billing date:</span>
              <span className="ml-2 font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm">
              ⚠️ Your subscription will be canceled at the end of the current
              billing period.
            </p>
          </div>
        )}
      </div>
      {(error || actionError) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error || actionError}</p>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue
              to have access until the end of your current billing period.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
