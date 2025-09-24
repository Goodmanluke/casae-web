import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { logoSrc } from "../lib/logo";
import { useRewardful } from "../hooks/useRewardful";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { trackConversion, isReferred, referralId } = useRewardful();

  useEffect(() => {
    if (isReferred && referralId) {
      setMessage("You were referred to CMAi! Sign up to get started.");
    }
  }, [isReferred, referralId]);

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

    try {
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

      if (referralId) {
        signupData.options.data.referral_id = referralId;
        signupData.options.data.referred = true;
      }

      const { error } = await supabase.auth.signUp(signupData);

      if (error) {
        setError(error.message);
      } else {
        trackConversion(email);

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

            <form className="space-y-6" onSubmit={handleSignup} data-rewardful>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
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
