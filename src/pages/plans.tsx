import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Navigation from "../components/Navigation";
import Notification from "../components/Notification";
import { useSubscription } from "../hooks/useSubscription";
import { useRewardful } from "../hooks/useRewardful";

const PlansPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const { isReferred, referralId } = useRewardful();

  const {
    subscription,
    loading: subLoading,
    isPremium,
    isPro,
    isTrialing,
    isPastDue,
    hasProAccess,
    changePlan,
    getAvailablePlans,
    cancelSubscription,
  } = useSubscription(userId);

  useEffect(() => {
    const fetchSession = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user?.id);
    };
    fetchSession();
  }, [router]);

  const [allPlans, setAllPlans] = useState([
    {
      id: "premium-plan",
      name: "Premium",
      price: 49.99,
      description: "Perfect for real estate professionals",
      features: [
        "Everything in Pro",
        "50 CMA Reports",
        "Advanced Investment Analytics",
        "Market Trend Analysis",
        "Priority Support",
        "Custom Reports",
        "API Access",
      ],
      color: "from-emerald-500 to-teal-600",
      popular: true,
    },
    {
      id: "pro-plan",
      name: "Pro",
      price: 79.99,
      description: "Perfect for serious investors",
      features: [
        "Investment Calculators (BRRR, Flip, Buy & Hold)",
        "200 CMA Reports",
        "PDF Downloads",
        "Email Support",
        "Basic Analytics",
      ],
      color: "from-blue-500 to-cyan-500",
      popular: false,
    },
  ]);

  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const response = await fetch("/api/subscription-plans");
        if (response.ok) {
          const plans = await response.json();
          if (plans.length > 0) {
            // Update with real data if available
            const updatedPlans = allPlans.map((staticPlan) => {
              const dbPlan = plans.find((p: any) =>
                p.name.toLowerCase().includes(staticPlan.name.toLowerCase())
              );
              if (dbPlan) {
                return {
                  ...staticPlan,
                  id: dbPlan.id,
                  price: dbPlan.price || staticPlan.price,
                };
              }
              return staticPlan;
            });
            setAllPlans(updatedPlans);
          }
        }
      } catch (err) {
        console.error("Error fetching plan data:", err);
      }
    };

    fetchPlanData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (isPremium || (isPro && planId.includes("pro"))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Please log in to subscribe");
        return;
      }

      const currentReferralId = referralId;

      const checkoutData: any = {
        userId: session.user.id,
        planId: planId,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/plans?canceled=true`,
      };

      if (currentReferralId) {
        checkoutData.referralId = currentReferralId;
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError(
        "Checkout failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (
    planId: string,
    action: "upgrade" | "downgrade"
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await changePlan(planId, action);

      if (action === "upgrade") {
        alert("Plan upgraded successfully! Changes are effective immediately.");
      } else {
        alert(
          "Plan will be downgraded at the end of your current billing period."
        );
      }

      window.location.reload();
    } catch (err) {
      console.error("Plan change error:", err);
      setNotification({
        message:
          "Failed to change plan: " +
          (err instanceof Error ? err.message : "Unknown error"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      await cancelSubscription();
      setShowCancelConfirm(false);
      setNotification({
        message:
          "Subscription will be canceled at the end of your current billing period.",
        type: "success",
      });
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
      setNotification({
        message: "Failed to cancel subscription. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Unlock the full potential of your real estate analysis
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {allPlans.map((plan) => {
              const isCurrentPlan =
                (plan.name.toLowerCase().includes("pro") && isPro) ||
                (plan.name.toLowerCase().includes("premium") && isPremium);

              let planAction = null;
              let canInteract = false;

              if (!subscription) {
                planAction = "subscribe";
                canInteract = true;
              } else if (isCurrentPlan) {
                planAction = "current";
                canInteract = true;
              } else if (isPremium) {
                planAction = "upgrade";
                canInteract = true;
              } else if (isPro) {
                planAction = "downgrade";
                canInteract = true;
              } else {
                planAction = "unavailable";
                canInteract = false;
              }

              return (
                <div key={plan.id} className="relative group">
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full shadow-lg font-bold text-sm">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-6 -left-6 z-20">
                      <div className="relative">
                        <div
                          className={`bg-gradient-to-r ${plan.color} text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm transform -rotate-12 hover:rotate-0 transition-transform duration-300`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="font-bold text-sm tracking-wide">
                              YOUR CURRENT PLAN
                            </span>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${plan.color} rounded-2xl blur-lg opacity-50 -z-10`}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`bg-white/10 backdrop-blur-xl rounded-3xl px-8 py-8 border border-white/20 shadow-2xl h-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl ${
                      plan.popular ? "ring-2 ring-yellow-400/50" : ""
                    }`}
                  >
                    <div className="text-center mb-8">
                      <div
                        className={`w-20 h-20 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                      >
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-white/60">{plan.description}</p>
                    </div>

                    <div className="text-center mb-8">
                      <div className="text-4xl font-bold text-white mb-2">
                        ${plan.price}
                      </div>
                      <div className="text-white/60">per month</div>
                    </div>

                    {/* Show subscription status if user has this plan */}
                    {isCurrentPlan && subscription?.current_period_end && (
                      <div className="text-center mb-6 p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                        <p className="text-emerald-300 font-semibold">
                          {calculateDaysRemaining(
                            subscription.current_period_end
                          )}{" "}
                          days remaining
                        </p>
                        <p className="text-emerald-200 text-sm">
                          Your subscription is active
                        </p>
                        <p className="text-emerald-200/60 text-xs mt-1">
                          Ends:{" "}
                          {new Date(
                            subscription.current_period_end
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <div
                            className={`w-5 h-5 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-white/80 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (planAction === "subscribe") {
                          handleSubscribe(plan.id);
                        } else if (planAction === "upgrade") {
                          handlePlanChange(plan.id, "upgrade");
                        } else if (planAction === "downgrade") {
                          handlePlanChange(plan.id, "downgrade");
                        } else if (planAction === "current") {
                          setShowCancelConfirm(true);
                        }
                      }}
                      disabled={loading}
                      className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 ${
                        planAction === "current"
                          ? subscription?.cancel_at_period_end
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed disabled:opacity-50"
                            : "bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 text-white transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          : planAction === "unavailable"
                          ? "bg-gray-500/50 text-gray-300 cursor-not-allowed border border-gray-400/30"
                          : planAction === "downgrade"
                          ? "bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : planAction === "current" ? (
                        subscription?.cancel_at_period_end ? (
                          <div className="flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Cancellation Scheduled
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Cancel Subscription
                          </div>
                        )
                      ) : planAction === "upgrade" ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 10l5-5m0 0l5 5m-5-5v18"
                            />
                          </svg>
                          Upgrade to {plan.name}
                        </div>
                      ) : planAction === "downgrade" ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 14l-5 5m0 0l-5-5m5 5V3"
                            />
                          </svg>
                          Downgrade to {plan.name}
                        </div>
                      ) : planAction === "subscribe" ? (
                        `Start ${plan.name} Plan`
                      ) : (
                        "Not Available"
                      )}
                    </button>

                    {error && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                        <p className="text-red-300 text-sm text-center">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cancel Subscription
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your subscription? You'll
                continue to have access until the end of your current billing
                period.
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
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Canceling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
