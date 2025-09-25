declare global {
  interface Window {
    rewardful?: (action: string, data?: any) => void;
    Rewardful?: {
      referral?: string;
    };
  }
}

/**
 * Rewardful integration service
 */
export class RewardfulService {
  /**
   * Track a conversion (customer signup/purchase)
   * @param email Customer's email address
   * @param orderId Optional order ID for tracking
   * @param amount Optional order amount
   */
  static trackConversion(
    email: string,
    orderId?: string,
    amount?: number
  ): void {
    if (typeof window === "undefined") return;

    try {
      if (window.rewardful) {
        const conversionData: any = { email };

        if (orderId) conversionData.order_id = orderId;
        if (amount) conversionData.amount = amount;

        window.rewardful("convert", conversionData);
        console.log("Rewardful conversion tracked:", {
          email,
          orderId,
          amount,
        });
      } else {
        console.warn("Rewardful not loaded yet, queueing conversion");
        // Queue the conversion for when Rewardful loads
        this.executeWhenReady(() => {
          this.trackConversion(email, orderId, amount);
        });
      }
    } catch (error) {
      console.error("Error tracking Rewardful conversion:", error);
    }
  }

  /**
   * Get current referral ID if user was referred
   * @returns Referral ID or null
   */
  static getReferralId(): string | null {
    if (typeof window === "undefined") return null;

    try {
      return window.Rewardful?.referral || null;
    } catch (error) {
      console.error("Error getting referral ID:", error);
      return null;
    }
  }

  /**
   * Check if current user was referred
   * @returns boolean indicating if user was referred
   */
  static isReferred(): boolean {
    return Boolean(this.getReferralId());
  }

  /**
   * Execute code when Rewardful is ready
   * @param callback Function to execute when ready
   */
  static executeWhenReady(callback: () => void): void {
    if (typeof window === "undefined") return;

    if (window.rewardful) {
      callback();
    } else {
      // Wait for Rewardful to load
      const checkRewardful = () => {
        if (window.rewardful) {
          callback();
        } else {
          setTimeout(checkRewardful, 100);
        }
      };
      checkRewardful();
    }
  }

  /**
   * Generate affiliate signup URL for the Rewardful affiliate portal
   * @returns Affiliate signup URL
   */
  static getAffiliateSignupUrl(): string {
    const apiKey = process.env.NEXT_PUBLIC_REWARDFUL_API_KEY;
    return `https://${apiKey}.rewardful.com/affiliates/signup`;
  }

  /**
   * Get the Rewardful affiliate dashboard URL for existing affiliates
   * @returns Affiliate dashboard URL
   */
  static getAffiliateDashboardUrl(): string {
    const apiKey = process.env.NEXT_PUBLIC_REWARDFUL_API_KEY;
    return `https://${apiKey}.rewardful.com/affiliates/dashboard`;
  }

  /**
   * Create an affiliate for the current user and get their referral link
   * This now uses the Rewardful API to create real affiliates
   * @param userId User ID
   * @param userEmail User's email
   * @param firstName User's first name
   * @param lastName User's last name
   * @returns Promise resolving to affiliate data including referral link
   */
  static async createAffiliateAndGetLink(
    userId: string,
    userEmail: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ affiliateId: string; referralUrl: string; token: string } | null> {
    try {
      const response = await fetch("/api/create-affiliate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          firstName: firstName || "User",
          lastName: lastName || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create affiliate");
      }

      const data = await response.json();
      return {
        affiliateId: data.affiliate_id,
        referralUrl: data.referral_url,
        token: data.token,
      };
    } catch (error) {
      console.error("Error creating affiliate:", error);
      return null;
    }
  }

  /**
   * Get user's existing affiliate link
   * @param userId User ID
   * @returns Promise resolving to affiliate data or null
   */
  static async getUserReferralLink(userId: string): Promise<{
    affiliateId: string;
    referralUrl: string;
    token: string;
  } | null> {
    try {
      const response = await fetch(`/api/get-affiliate-link?userId=${userId}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.affiliate_id && data.referral_url && data.token) {
        return {
          affiliateId: data.affiliate_id,
          referralUrl: data.referral_url,
          token: data.token,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user referral link:", error);
      return null;
    }
  }

  /**
   * Attach Rewardful tracking to forms
   * This should be called after forms are dynamically added
   */
  static attachToForms(): void {
    if (typeof window === "undefined") return;

    this.executeWhenReady(() => {
      try {
        // If Rewardful has a forms attachment method
        if (window.rewardful && typeof window.rewardful === "function") {
          window.rewardful("attach");
        }
      } catch (error) {
        console.error("Error attaching Rewardful to forms:", error);
      }
    });
  }

  /**
   * Track a lead (someone who visited via referral link)
   * @param email Lead's email address
   * @param metadata Optional additional data
   */
  static trackLead(email: string, metadata?: any): void {
    if (typeof window === "undefined") return;

    try {
      if (window.rewardful) {
        const leadData: any = { email };
        if (metadata) Object.assign(leadData, metadata);
        
        window.rewardful("lead", leadData);
        console.log("Rewardful lead tracked:", { email, metadata });
      }
    } catch (error) {
      console.error("Error tracking Rewardful lead:", error);
    }
  }
}

/**
 * Interface for Rewardful affiliate data returned by the API
 */
export interface RewardfulAffiliateData {
  affiliateId: string;
  referralUrl: string;
  token: string;
}

/**
 * Interface for Rewardful API affiliate response
 */
export interface RewardfulAPIAffiliate {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  state: string;
  visitors: number;
  leads: number;
  conversions: number;
  links: Array<{
    id: string;
    url: string;
    token: string;
    visitors: number;
    leads: number;
    conversions: number;
  }>;
}

export default RewardfulService;
