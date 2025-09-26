import { useEffect, useState } from "react";
import { RewardfulService } from "../lib/rewardful";
import { supabase } from "../lib/supabase";

/**
 * Hook to get the user's referral ID from the database after login
 * This retrieves the referral ID that was saved during signup
 */
export function useUserReferralId() {
  const [referralId, setReferralId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralId = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setReferralId(null);
          setLoading(false);
          return;
        }

        // Get referral ID from database
        const savedReferralId = await RewardfulService.getReferralFromDatabase(user.id);
        setReferralId(savedReferralId);
        
        if (savedReferralId) {
          console.log("Retrieved referral ID from database:", savedReferralId);
        }
      } catch (err: any) {
        console.error("Error fetching referral ID:", err);
        setError(err.message || "Failed to fetch referral ID");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralId();
  }, []);

  return { referralId, loading, error };
}
