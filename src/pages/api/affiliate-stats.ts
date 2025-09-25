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

    if (!REWARDFUL_API_SECRET) {
      return res.status(500).json({ error: "Rewardful API not configured" });
    }

    // Get affiliate data from local database
    const { data: affiliate, error: fetchError } = await supabase
      .from("user_affiliates")
      .select("rewardful_affiliate_id, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error:", fetchError);
      return res
        .status(500)
        .json({ error: "Failed to fetch affiliate record" });
    }

    if (!affiliate || !affiliate.rewardful_affiliate_id) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    // Fetch affiliate stats from Rewardful API
    try {
      const statsResponse = await fetch(
        `${REWARDFUL_API_BASE}/affiliates/${affiliate.rewardful_affiliate_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(`${REWARDFUL_API_SECRET}:`).toString("base64")}`,
          },
        }
      );

      if (!statsResponse.ok) {
        console.error("Rewardful API error:", await statsResponse.text());
        return res.status(500).json({ 
          error: "Failed to fetch affiliate stats from Rewardful" 
        });
      }

      const statsData = await statsResponse.json();
      
      return res.status(200).json({
        affiliate_id: statsData.id,
        email: statsData.email,
        first_name: statsData.first_name,
        last_name: statsData.last_name,
        state: statsData.state,
        visitors: statsData.visitors || 0,
        leads: statsData.leads || 0,
        conversions: statsData.conversions || 0,
        links: statsData.links || [],
        created_at: statsData.created_at,
        updated_at: statsData.updated_at,
      });
    } catch (rewardfulError) {
      console.error("Error fetching from Rewardful API:", rewardfulError);
      return res.status(500).json({ 
        error: "Failed to communicate with Rewardful API" 
      });
    }
  } catch (error) {
    console.error("Unexpected error getting affiliate stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
