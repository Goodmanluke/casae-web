import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        error: "Missing or invalid userId parameter",
      });
    }

    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      return res.status(500).json({
        error: "Failed to fetch subscription",
      });
    }

    let subscriptionStatus = {
      hasSubscription: !!subscription,
      isPro: false,
      isPremium: false,
      isTrialing: false,
      isPastDue: false,
      planName: null as string | null,
      currentPeriodEnd: null as string | null,
      cancelAtPeriodEnd: false,
      daysRemaining: 0,
    };

    if (subscription) {
      subscriptionStatus.isPro =
        subscription.plan_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID ||
        subscription.plan_id?.toLowerCase().includes("pro");
      subscriptionStatus.isPremium =
        subscription.plan_id === process.env.NEXT_PUBLIC_STRIPE_PLAN_ID ||
        subscription.plan_id?.toLowerCase().includes("premium");
      subscriptionStatus.isTrialing = subscription.status === "trialing";
      subscriptionStatus.isPastDue = subscription.status === "past_due";
      subscriptionStatus.planName = subscriptionStatus.isPremium
        ? "Premium"
        : subscriptionStatus.isPro
        ? "Pro"
        : "Unknown";
      subscriptionStatus.currentPeriodEnd = subscription.current_period_end;
      subscriptionStatus.cancelAtPeriodEnd =
        subscription.cancel_at_period_end || false;

      if (subscription.current_period_end) {
        const end = new Date(subscription.current_period_end);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        subscriptionStatus.daysRemaining = diffDays > 0 ? diffDays : 0;
      }
    }

    res.status(200).json({
      subscription: subscriptionStatus,
      rawSubscription: subscription,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({
      error: "Failed to check subscription status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
