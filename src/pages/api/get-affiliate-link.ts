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
      .select("rewardful_affiliate_id, referral_url, token")
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
