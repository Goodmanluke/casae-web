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

    // First check our database for existing affiliate
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
    console.log("here is email::", email);
    // Check if affiliate exists in Rewardful by email
    const checkAffiliateResponse = await fetch(
      `${REWARDFUL_API_BASE}/affiliates?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${REWARDFUL_API_SECRET}:`
          ).toString("base64")}`,
        },
      }
    );

    let affiliateData = null;

    if (checkAffiliateResponse.ok) {
      const affiliateResponse = await checkAffiliateResponse.json();
      console.log("Existing affiliates found:", affiliateResponse);

      if (
        affiliateResponse &&
        affiliateResponse.data &&
        affiliateResponse.data.length > 0
      ) {
        // Use the first matching affiliate
        affiliateData = affiliateResponse.data[0];
        console.log("Using existing affiliate:", affiliateData);
      }
    } else {
      console.log(
        "No existing affiliate found or error checking:",
        await checkAffiliateResponse.text()
      );
    }

    if (!affiliateData) {
      const affiliateResponse = await fetch(
        `${REWARDFUL_API_BASE}/affiliates`,
        {
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
        }
      );

      if (!affiliateResponse.ok) {
        const errorText = await affiliateResponse.text();
        console.error("Rewardful API error:", errorText);
        return res.status(500).json({
          error: "Failed to create affiliate with Rewardful",
          details: errorText,
        });
      }

      affiliateData = await affiliateResponse.json();
      console.log("Created new affiliate:", affiliateData);
    }

    let linkData = null;
    let isExistingAffiliate = false;
    if (affiliateData.links && affiliateData.links.length > 0) {
      linkData = affiliateData.links[0]; // Use the first existing link
      if (linkData.url && linkData.token) {
        linkData.url = `https://www.cmai.app/signup?via=${linkData.token}`;
      }

      console.log("Using existing affiliate link:", linkData);
      isExistingAffiliate = true;
    } else {
      if (affiliateData && !affiliateData.hasOwnProperty("links")) {
        const affiliateDetailResponse = await fetch(
          `${REWARDFUL_API_BASE}/affiliates/${affiliateData.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${REWARDFUL_API_SECRET}:`
              ).toString("base64")}`,
            },
          }
        );

        if (affiliateDetailResponse.ok) {
          const detailedAffiliate = await affiliateDetailResponse.json();
          console.log("Detailed affiliate data:", detailedAffiliate);

          if (detailedAffiliate.links && detailedAffiliate.links.length > 0) {
            linkData = detailedAffiliate.links[0];

            // Transform the URL to use /signup path instead of query parameter only
            if (linkData.url && linkData.token) {
              linkData.url = `https://www.cmai.app/signup?via=${linkData.token}`;
            }

            console.log(
              "Using existing affiliate link from detailed data:",
              linkData
            );
            isExistingAffiliate = true;
          }
        }
      }

      if (!linkData) {
        const linkResponse = await fetch(
          `${REWARDFUL_API_BASE}/affiliate_links`,
          {
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
          }
        );

        if (!linkResponse.ok) {
          const errorText = await linkResponse.text();
          console.error("Rewardful link API error:", errorText);
          return res.status(500).json({
            error: "Failed to create affiliate link with Rewardful",
            details: errorText,
          });
        }

        linkData = await linkResponse.json();

        // Transform the URL to use /signup path instead of query parameter only
        if (linkData.url && linkData.token) {
          linkData.url = `https://www.cmai.app/signup?via=${linkData.token}`;
        }

        console.log("Created new affiliate link:", linkData);
      }
    }

    // Store affiliate data in our database
    // First try to update existing record
    const { data: updatedAffiliate, error: updateError } = await supabase
      .from("user_affiliates")
      .update({
        rewardful_affiliate_id: affiliateData.id,
        referral_url: linkData.url,
        token: linkData.token,
        email,
        first_name: affiliateData.first_name || firstName || "User",
        last_name: affiliateData.last_name || lastName || "",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    let newAffiliate = updatedAffiliate;
    let insertError = updateError;

    // If no existing record was updated, insert a new one
    if (!updatedAffiliate && !updateError) {
      const { data: insertedAffiliate, error: insertErr } = await supabase
        .from("user_affiliates")
        .insert({
          user_id: userId,
          rewardful_affiliate_id: affiliateData.id,
          referral_url: linkData.url,
          token: linkData.token,
          email,
          first_name: affiliateData.first_name || firstName || "User",
          last_name: affiliateData.last_name || lastName || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      newAffiliate = insertedAffiliate;
      insertError = insertErr;
    }

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
      existing: isExistingAffiliate, // true if we used an existing affiliate
    });
  } catch (error) {
    console.error("Error creating affiliate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
