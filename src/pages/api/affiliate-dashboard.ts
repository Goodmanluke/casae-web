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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { data: conversions, error: conversionsError } = await supabase
      .from("rewardful_conversions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (conversionsError) {
      console.error("Error fetching conversions:", conversionsError);
      return res.status(500).json({ error: "Failed to fetch conversion data" });
    }

    const totalConversions = conversions?.length ?? 0;
    const totalEarnings =
      conversions?.reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;

    const completedConversions =
      conversions?.filter((c) => c.status === "completed") ?? [];
    const pendingConversions =
      conversions?.filter((c) => c.status === "pending") ?? [];

    const stats = {
      totalConversions,
      completedConversions: completedConversions.length,
      pendingConversions: pendingConversions.length,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      completedEarnings: Number(
        completedConversions
          .reduce((sum, c) => sum + (c.amount || 0), 0)
          .toFixed(2)
      ),
      pendingEarnings: Number(
        pendingConversions
          .reduce((sum, c) => sum + (c.amount || 0), 0)
          .toFixed(2)
      ),
    };

    return res.status(200).json({
      conversions: conversions ?? [],
      stats,
    });
  } catch (error) {
    console.error("Error in affiliate dashboard API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
