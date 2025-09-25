import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REWARDFUL_API_SECRET = process.env.REWARDFUL_SECRET_KEY;
const REWARDFUL_API_BASE = "https://api.getrewardful.com/v1";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, email, firstName, lastName } = req.body;

    if (typeof userId !== "string" || typeof email !== "string") {
      return res
        .status(400)
        .json({ error: "userId and email are required and must be strings" });
    }

    if (!REWARDFUL_API_SECRET) {
      console.error("REWARDFUL_SECRET_KEY not configured");
      return res.status(500).json({ error: "Rewardful API not configured" });
    }

    const { data: existingAffiliate, error: fetchError } = await supabase
      .from("user_affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching affiliate record:", fetchError);
      return res
        .status(500)
        .json({ error: "Failed to fetch affiliate record" });
    }

    if (existingAffiliate && existingAffiliate.rewardful_affiliate_id) {
      return res.status(200).json({
        affiliate_id: existingAffiliate.rewardful_affiliate_id,
        referral_url: existingAffiliate.referral_url,
        token: existingAffiliate.token,
        existing: true,
      });
    }

    // Create affiliate using Rewardful API
    const affiliateResponse = await fetch(`${REWARDFUL_API_BASE}/affiliates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${REWARDFUL_API_SECRET}:`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        first_name: firstName || "User",
        last_name: lastName || "#",
        email: email,
      }).toString(),
    });

    if (!affiliateResponse.ok) {
      const errorText = await affiliateResponse.text();
      console.error("Rewardful API error:", errorText);
      return res.status(500).json({
        error: "Failed to create affiliate with Rewardful",
        details: errorText,
      });
    }

    const affiliateData = await affiliateResponse.json();
    console.log("Created affiliate:", affiliateData);

    // Create affiliate link using Rewardful API
    const linkResponse = await fetch(`${REWARDFUL_API_BASE}/affiliate_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${REWARDFUL_API_SECRET}:`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        affiliate_id: affiliateData.id,
      }).toString(),
    });

    if (!linkResponse.ok) {
      const errorText = await linkResponse.text();
      console.error("Rewardful link API error:", errorText);
      return res.status(500).json({
        error: "Failed to create affiliate link with Rewardful",
        details: errorText,
      });
    }

    const linkData = await linkResponse.json();
    console.log("Created affiliate link:", linkData);

    // Store affiliate data in our database
    const { data: newAffiliate, error: insertError } = await supabase
      .from("user_affiliates")
      .upsert(
        {
          user_id: userId,
          rewardful_affiliate_id: affiliateData.id,
          referral_url: linkData.url,
          token: linkData.token,
          email,
          first_name: firstName || "User",
          last_name: lastName || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (insertError || !newAffiliate) {
      console.error("Error storing affiliate data:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to store affiliate record" });
    }

    return res.status(201).json({
      affiliate_id: newAffiliate.rewardful_affiliate_id,
      referral_url: newAffiliate.referral_url,
      token: newAffiliate.token,
      existing: false,
    });
  } catch (error) {
    console.error("Error creating affiliate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
