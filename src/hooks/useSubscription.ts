import { useState, useEffect } from "react";
import { supabase, UserSubscription } from "../lib/supabase";

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // First check if user is authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("No authenticated session:", sessionError);
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const sub = data;
      setSubscription(sub);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          planId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create checkout session"
      );
    }
  };

  const cancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;

    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Reload subscription data
      await loadSubscription();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    }
  };

  const isTrialing = subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";

  const isPro =
    subscription?.status === "active" &&
    subscription?.plan_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID;
  const isPremium =
    subscription?.status === "active" &&
    subscription?.plan_id === process.env.NEXT_PUBLIC_STRIPE_PLAN_ID;

  const hasAccess = isPremium || isTrialing;
  const hasProAccess = isPro || isPremium || isTrialing;

  return {
    subscription,
    loading,
    error,
    isPremium,
    isPro,
    isTrialing,
    isPastDue,
    hasAccess,
    hasProAccess,
    createCheckoutSession,
    cancelSubscription,
    refresh: loadSubscription,
  };
}
