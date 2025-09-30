import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !process.env.STRIPE_SECRET_KEY
) {
  throw new Error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or STRIPE_SECRET_KEY"
  );
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15", // Keep the version that matches your Stripe package
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS for Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    console.log("Method not allowed, returning 405");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, planId, successUrl, cancelUrl, referralId } = req.body;

    if (!userId || !planId || !successUrl || !cancelUrl) {
      console.log("Missing required fields:", {
        userId,
        planId,
        successUrl,
        cancelUrl,
      });
      return res.status(400).json({
        error: "Missing required fields: userId, planId, successUrl, cancelUrl",
      });
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error("Error fetching user:", userError);
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userEmail = userData.user.email;

    let finalReferralId = referralId;

    if (!finalReferralId) {
      try {
        const { data: referralData } = await supabaseAdmin
          .from("user_referrals")
          .select("referral_id")
          .eq("user_id", userId)
          .single();

        if (referralData?.referral_id) {
          finalReferralId = referralData.referral_id;
          console.log("Retrieved referral ID from database:", finalReferralId);
        }
      } catch (err) {
        console.log(
          "No referral ID found for user (this is okay for non-referred users)"
        );
      }
    }

    let stripePriceId = null;

    // Get the Stripe price ID from the database based on planId
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
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    let subscriptionId = null;
    let fallbackPriceId = null;
    if (
      planId === "pro-plan" ||
      planId === "pro" ||
      planData?.name?.toLowerCase().includes("pro")
    ) {
      fallbackPriceId = process.env.STRIPE_PRO_PRICE_ID;
      subscriptionId = process.env.STRIPE_PRO_PLAN_ID;
    } else if (
      planId === "premium-plan" ||
      planId === "premium" ||
      planData?.name?.toLowerCase().includes("premium")
    ) {
      fallbackPriceId = process.env.STRIPE_PRICE_ID_PRO;
      subscriptionId = process.env.STRIPE_PLAN_ID;
    }
    if (planError || !planData) {
      console.error("Error fetching plan:", planError);

      if (!fallbackPriceId) {
        return res
          .status(400)
          .json({ error: "Invalid plan ID and no fallback configured" });
      }
      stripePriceId = fallbackPriceId;
    } else {
      stripePriceId = planData.plan_pricing[0]?.stripe_price_id;
    }

    if (!stripePriceId) {
      console.error("No Stripe price ID found for plan:", planId);
      return res
        .status(500)
        .json({ error: "Stripe price ID not configured for this plan" });
    }

    const customerMetadata: any = {
      supabase_user_id: userId,
    };
    if (finalReferralId) {
      customerMetadata.referral = finalReferralId;
      console.log("Adding referral to Stripe customer:", finalReferralId);
    }

    // Prepare session metadata
    const sessionMetadata: any = {
      userId,
      planId: subscriptionId || "",
    };

    if (finalReferralId) {
      sessionMetadata.referral_id = finalReferralId;
    }

    let customerId: string | undefined;

    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;

      if (finalReferralId && !existingCustomers.data[0].metadata.referral) {
        await stripe.customers.update(customerId, {
          metadata: customerMetadata,
        });
        console.log("Updated existing customer with referral metadata");
      }
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: customerMetadata,
      });
      customerId = customer.id;
      console.log("Created new Stripe customer with referral metadata");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer: customerId,
      metadata: sessionMetadata,
      allow_promotion_codes: true,
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
