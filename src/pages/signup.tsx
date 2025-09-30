import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { logoSrc } from "../lib/logo";
import { useRewardful } from "../hooks/useRewardful";
import { RewardfulService } from "../lib/rewardful";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { trackConversion, isReferred, referralId, isLoaded } = useRewardful();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isReferred && referralId) {
      setMessage("You were referred to CMAi! Sign up to get started.");
    }
  }, [isReferred, referralId]);

  useEffect(() => {
    if (isLoaded) {
      console.log("Rewardful loaded:", {
        isReferred,
        referralId,
      });
    }
  }, [isLoaded, isReferred, referralId]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service to continue.");
      setLoading(false);
      return;
    }

    try {
      let finalReferralId = referralId;

      if (formRef.current) {
        const hiddenInput = formRef.current.querySelector<HTMLInputElement>(
          'input[name="referral"]'
        );
        if (hiddenInput && hiddenInput.value) {
          finalReferralId = hiddenInput.value;
        }
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const signupData: any = {
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/login`,
          data: {},
        },
      };

      // Add referral data to user metadata
      if (finalReferralId) {
        signupData.options.data.referral_id = finalReferralId;
        signupData.options.data.referred = true;
        console.log("Signing up with referral ID:", finalReferralId);
      } else {
        console.log("No referral ID found during signup");
      }

      const { data: signupResult, error: signupError } =
        await supabase.auth.signUp(signupData);

      if (signupError) {
        setError(signupError.message);
      } else {
        // Track the conversion with Rewardful
        trackConversion(email);

        // Save referral ID to database if user was referred and we have a user ID
        if (finalReferralId && signupResult.user?.id) {
          console.log(
            "Saving referral ID to database for user:",
            signupResult.user.id
          );
          const saved = await RewardfulService.saveReferralToDatabase(
            signupResult.user.id,
            finalReferralId
          );

          if (saved) {
            console.log("✅ Referral ID successfully saved to database");
          } else {
            console.warn("⚠️ Failed to save referral ID to database");
          }
        }

        setMessage("Check your email to confirm your account, then log in.");
        setTimeout(() => router.replace("/login"), 2500);
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20">
              <img
                src={logoSrc}
                alt="CMAi logo"
                className="h-16 w-16 mx-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-white/60 text-lg">Sign up to start using CMAi</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl text-center text-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl text-center text-emerald-200">
                {message}
              </div>
            )}

            {/* The data-rewardful attribute tells Rewardful to automatically add the hidden referral input */}
            <form
              ref={formRef}
              className="space-y-6"
              onSubmit={handleSignup}
              data-rewardful
            >
              <div>
                <label className="block text-white/80 font-medium mb-3 text-sm uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-white/80 font-medium mb-3 text-sm uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              {/* Terms of Service Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-white/20 text-cyan-500 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                />
                <label htmlFor="terms" className="text-white/80 text-sm leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isLoaded || !agreedToTerms}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Creating..."
                  : !isLoaded
                  ? "Loading..."
                  : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-2xl border border-white/20 transition"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
