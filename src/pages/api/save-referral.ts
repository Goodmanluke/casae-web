import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, referralId } = req.body;

    if (!userId || !referralId) {
      return res.status(400).json({ error: "Missing userId or referralId" });
    }

    // Use supabaseAdmin to bypass RLS policies
    // This is safe because the API endpoint validates the request
    const { data, error } = await supabaseAdmin
      .from("user_referrals")
      .upsert(
        {
          user_id: userId,
          referral_id: referralId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving referral ID:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      data,
      message: "Referral ID saved successfully" 
    });
  } catch (error: any) {
    console.error("Error in save-referral endpoint:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
