import { useEffect, useState, useCallback } from "react";
import { RewardfulService } from "../lib/rewardful";

/**
 * Custom hook for Rewardful integration
 */
export function useRewardful() {
  const [isReferred, setIsReferred] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    RewardfulService.executeWhenReady(() => {
      if (!mounted) return;

      setIsLoaded(true);
      const refId = RewardfulService.getReferralId();
      setReferralId(refId);
      setIsReferred(Boolean(refId));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const trackConversion = useCallback(
    (email: string, orderId?: string, amount?: number) => {
      if (!isLoaded) {
        console.warn("Rewardful not loaded yet");
        return;
      }
      RewardfulService.trackConversion(email, orderId, amount);
    },
    [isLoaded]
  );

  const getAffiliateSignupUrl = useCallback((): string | null => {
    if (!isLoaded) return null;
    return RewardfulService.getAffiliateSignupUrl();
  }, [isLoaded]);

  return {
    isReferred,
    referralId,
    isLoaded,
    trackConversion,
    getAffiliateSignupUrl,
  };
}

export default useRewardful;
