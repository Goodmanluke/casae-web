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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res
        .status(400)
        .json({ error: "userId is required and must be a string" });
    }

    const { data: affiliate, error: fetchError } = await supabase
      .from("user_affiliates")
      .select("rewardful_affiliate_id, referral_url, token, email, first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return res
        .status(500)
        .json({ error: "Failed to fetch affiliate record" });
    }

    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    // If we have a valid Rewardful affiliate ID, return the stored data
    if (affiliate.rewardful_affiliate_id && affiliate.referral_url && affiliate.token) {
      return res.status(200).json({
        affiliate_id: affiliate.rewardful_affiliate_id,
        referral_url: affiliate.referral_url,
        token: affiliate.token,
      });
    }

    // If affiliate exists but missing Rewardful data, try to create it
    if (REWARDFUL_API_SECRET && affiliate.email) {
      try {
        // Create affiliate using Rewardful API
        const affiliateResponse = await fetch(`${REWARDFUL_API_BASE}/affiliates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${REWARDFUL_API_SECRET}:`).toString("base64")}`,
          },
          body: new URLSearchParams({
            first_name: affiliate.first_name || "User",
            last_name: affiliate.last_name || "",
            email: affiliate.email,
          }).toString(),
        });

        if (affiliateResponse.ok) {
          const affiliateData = await affiliateResponse.json();
          
          // Create affiliate link
          const linkResponse = await fetch(`${REWARDFUL_API_BASE}/affiliate_links`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${REWARDFUL_API_SECRET}:`).toString("base64")}`,
            },
            body: new URLSearchParams({
              affiliate_id: affiliateData.id,
            }).toString(),
          });

          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            
            // Update the database with Rewardful data
            await supabase
              .from("user_affiliates")
              .update({
                rewardful_affiliate_id: affiliateData.id,
                referral_url: linkData.url,
                token: linkData.token,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);

            return res.status(200).json({
              affiliate_id: affiliateData.id,
              referral_url: linkData.url,
              token: linkData.token,
            });
          }
        }
      } catch (rewardfulError) {
        console.error("Error creating Rewardful affiliate:", rewardfulError);
        // Continue to return existing data even if Rewardful fails
      }
    }

    return res.status(200).json({
      affiliate_id: affiliate.rewardful_affiliate_id,
      referral_url: affiliate.referral_url,
      token: affiliate.token,
    });
  } catch (error) {
    console.error("Unexpected error getting affiliate link:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
