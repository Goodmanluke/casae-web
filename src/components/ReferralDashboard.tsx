import { useState, useEffect } from "react";
import { useRewardful } from "../hooks/useRewardful";
import { supabase } from "../lib/supabase";
import RewardfulService from "../lib/rewardful";

export default function ReferralDashboard() {
  const { getAffiliateSignupUrl } = useRewardful();
  const [referralLink, setReferralLink] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    visitors: number;
    leads: number;
    conversions: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ✅ Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error);
        setError("Authentication failed. Please log in again.");
        return;
      }
      if (data?.user) setUserId(data.user.id);
    };
    getCurrentUser();
  }, []);

  // ✅ Load affiliate stats
  const loadStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/affiliate-stats?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          visitors: data.visitors || 0,
          leads: data.leads || 0,
          conversions: data.conversions || 0,
        });
      }
    } catch (error) {
      console.error("Error loading affiliate stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ✅ Fetch or create referral link
  const generateReferralLink = async () => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to fetch existing affiliate
      const existingAffiliate = await RewardfulService.getUserReferralLink(
        userId
      );
      if (existingAffiliate && existingAffiliate.referralUrl) {
        setReferralLink(existingAffiliate.referralUrl);
        return;
      }

      // If no affiliate found, create new one using Rewardful API
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const affiliateData = await RewardfulService.createAffiliateAndGetLink(
        user.id,
        user.email!,
        user.user_metadata?.first_name || "User",
        user.user_metadata?.last_name || ""
      );

      if (!affiliateData) {
        throw new Error("Failed to create affiliate with Rewardful API");
      }

      setReferralLink(affiliateData.referralUrl);

      await loadStats(userId);
    } catch (err) {
      console.error("Error generating referral link:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate referral link"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Copy link to clipboard
  const copyToClipboard = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard error:", error);
      setError("Failed to copy link to clipboard");
    }
  };

  // ✅ Auto-generate link when userId is set
  useEffect(() => {
    if (userId && !referralLink && !loading) {
      generateReferralLink();
    }
  }, [userId]);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Referral Program</h2>

      <div className="space-y-6">
        {/* Referral link section */}
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-3">
            Your Referral Link
          </h3>
          <p className="text-white/70 text-sm mb-4">
            Share this link with friends and earn rewards when they sign up!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-200 hover:text-white text-xs mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder={
                loading
                  ? "Generating your referral link..."
                  : "Your referral link will appear here"
              }
            />
            <button
              onClick={copyToClipboard}
              disabled={!referralLink || loading}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {!referralLink && !loading && (
            <button
              onClick={generateReferralLink}
              className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl border border-white/20 transition-all duration-300"
            >
              Generate Referral Link
            </button>
          )}

          {loading && (
            <div className="mt-3 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400 mr-2"></div>
              <span className="text-white/70 text-sm">
                Creating your referral link...
              </span>
            </div>
          )}
        </div>

        {stats && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-white font-semibold mb-4">Your Performance</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {stats.visitors}
                </div>
                <div className="text-white/70 text-sm">Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {stats.leads}
                </div>
                <div className="text-white/70 text-sm">Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {stats.conversions}
                </div>
                <div className="text-white/70 text-sm">Conversions</div>
              </div>
            </div>
            {statsLoading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2"></div>
                <span className="text-white/70 text-sm">Loading stats...</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h4 className="text-white font-semibold mb-3">Affiliate Dashboard</h4>
          <p className="text-white/70 text-sm mb-4">
            Track your referral performance, earnings, and detailed analytics.
          </p>
          <a
            href={RewardfulService.getAffiliateDashboardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-xl transition-all duration-300"
          >
            View Dashboard
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h4 className="text-white font-semibold mb-3">How it works:</h4>
          <ul className="text-white/70 text-sm space-y-2">
            <li>• Share your referral link with friends</li>
            <li>• They sign up using your link</li>
            <li>• You both get rewards when they subscribe</li>
            <li>• Track your progress in the affiliate dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
