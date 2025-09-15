import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.STRIPE_SECRET_KEY
) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, newPlanId, action } = req.body;

    if (!userId || !newPlanId || !action) {
      return res.status(400).json({
        error: "Missing required fields: userId, newPlanId, action",
      });
    }

    if (!["upgrade", "downgrade"].includes(action)) {
      return res.status(400).json({
        error: "Action must be 'upgrade' or 'downgrade'",
      });
    }

    // Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subError || !currentSubscription) {
      return res.status(404).json({
        error: "No active subscription found for user",
      });
    }

    if (!currentSubscription.stripe_subscription_id) {
      return res.status(400).json({
        error: "No Stripe subscription ID found",
      });
    }

    // Get new plan's Stripe price ID
    let newStripePriceId = null;

    // Get from database first
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select(
        `
        id,
        name,
        plan_pricing!inner (
          stripe_price_id,
          price,
          interval
        )
      `
      )
      .eq("id", newPlanId)
      .eq("is_active", true)
      .single();

    // Fallback to environment variables
    let planId;
    if (planError || !planData) {
      if (
        newPlanId === "pro-plan" ||
        newPlanId === "pro" ||
        newPlanId.toLowerCase().includes("pro")
      ) {
        newStripePriceId = process.env.STRIPE_PRO_PRICE_ID;
      } else if (
        newPlanId === "premium-plan" ||
        newPlanId === "premium" ||
        newPlanId.toLowerCase().includes("premium")
      ) {
        newStripePriceId = process.env.STRIPE_PRICE_ID_PRO;
      }
    } else {
      if (
        planData?.name === "Pro" ||
        planData?.name.toLowerCase().includes("pro")
      ) {
        newStripePriceId = process.env.STRIPE_PRO_PRICE_ID;
        planId = process.env.STRIPE_PRO_PLAN_ID;
      } else if (
        planData?.name === "Premium Plan" ||
        planData?.name.toLowerCase().includes("premium")
      ) {
        newStripePriceId = process.env.STRIPE_PRICE_ID_PRO;
        planId = process.env.STRIPE_PLAN_ID;
      }
    }

    if (!newStripePriceId) {
      return res.status(400).json({
        error: "New plan's Stripe price ID not found",
      });
    }

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripe_subscription_id
    );

    if (!stripeSubscription.items.data[0]) {
      return res.status(400).json({
        error: "No subscription items found",
      });
    }

    // Update the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newStripePriceId,
          },
        ],
        // For downgrades, apply at period end; for upgrades, apply immediately with proration
        proration_behavior: action === "upgrade" ? "create_prorations" : "none",
        ...(action === "downgrade" && {
          proration_behavior: "none",
          billing_cycle_anchor: "unchanged",
        }),
      }
    );

    // Update the subscription in our database
    const updateData: any = {
      plan_id: planId,
      current_period_start: new Date(
        updatedSubscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        updatedSubscription.current_period_end * 1000
      ).toISOString(),
    };

    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update(updateData)
      .eq("id", currentSubscription.id);

    if (updateError) {
      console.error("Error updating subscription in database:", updateError);
    }

    const message =
      action === "upgrade"
        ? "Subscription upgraded successfully"
        : "Subscription will be downgraded at the end of the current billing period";

    res.status(200).json({
      success: true,
      message,
      subscription: updatedSubscription,
      effectiveDate:
        action === "upgrade"
          ? "immediate"
          : new Date(
              updatedSubscription.current_period_end * 1000
            ).toISOString(),
    });
  } catch (error) {
    console.error("Error changing subscription plan:", error);
    res.status(500).json({
      error: "Failed to change subscription plan",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
