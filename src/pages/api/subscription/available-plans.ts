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
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
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

    // Get user's current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Error fetching user subscription:", subError);
      return res.status(500).json({
        error: "Failed to fetch user subscription",
      });
    }

    // Define plan hierarchy (lower index = lower tier)
    const planHierarchy = ["pro", "premium"];

    const staticPlans = [
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
        tier: 0,
      },
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
        tier: 1,
      },
    ];

    // Determine current plan tier
    let currentTier = -1;
    if (currentSubscription) {
      const currentPlanName = currentSubscription.plan_id;
      if (currentPlanName?.toLowerCase().includes("pro")) {
        currentTier = 0;
      } else if (currentPlanName?.toLowerCase().includes("premium")) {
        currentTier = 1;
      }
    }

    // Mark plans with their relationship to current plan
    const plansWithActions = staticPlans.map((plan) => {
      let action = null;
      let canChange = false;
      let isCurrent = false;

      if (currentSubscription && currentTier >= 0) {
        if (plan.tier === currentTier) {
          isCurrent = true;
        } else if (plan.tier > currentTier) {
          action = "upgrade";
          canChange = true;
        } else if (plan.tier < currentTier) {
          action = "downgrade";
          canChange = true;
        }
      } else {
        // No subscription, can subscribe to any plan
        action = "subscribe";
        canChange = true;
      }

      return {
        ...plan,
        action,
        canChange,
        isCurrent,
      };
    });

    res.status(200).json({
      plans: plansWithActions,
      currentSubscription: currentSubscription
        ? {
            planId: currentSubscription.plan_id,
            status: currentSubscription.status,
            currentPeriodEnd: currentSubscription.current_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching available plans:", error);
    res.status(500).json({
      error: "Failed to fetch available plans",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
