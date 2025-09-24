import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (existingAffiliate) {
      return res.status(200).json({
        affiliate_id: existingAffiliate.rewardful_affiliate_id,
        referral_url: existingAffiliate.referral_url,
        token: existingAffiliate.token,
        existing: true,
      });
    }

    const userToken = `user-${userId.substring(0, 8)}-${Date.now()
      .toString()
      .slice(-6)}`;

    const baseUrl =
      (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        "https://www.casae.com") + "/signup";

    const referralUrl = `${baseUrl}/?via=${encodeURIComponent(userToken)}`;

    const { data: newAffiliate, error: insertError } = await supabase
      .from("user_affiliates")
      .insert({
        user_id: userId,
        rewardful_affiliate_id: `affiliate_${userId}`,
        referral_url: referralUrl,
        token: userToken,
        email,
        first_name: firstName || "User",
        last_name: lastName || "",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !newAffiliate) {
      console.error("Error storing affiliate data:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to create affiliate record" });
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
