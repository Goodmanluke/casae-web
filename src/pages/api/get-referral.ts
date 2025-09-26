import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

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
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from("user_referrals")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no record found, return null instead of error
      if (error.code === "PGRST116") {
        return res.status(200).json({ referralId: null });
      }
      console.error("Error fetching referral ID:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      referralId: data.referral_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  } catch (error: any) {
    console.error("Error in get-referral endpoint:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
