import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';

const PlansPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [planData, setPlanData] = useState<any>(null);

  // Fetch plan data on component mount
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        if (response.ok) {
          const plans = await response.json();
          if (plans.length > 0) {
            const premiumPlan = plans.find((p: any) => p.name === 'Premium Plan');
            if (premiumPlan) {
              setPlanData(premiumPlan);
              // Convert features object to array of strings
              const features = Object.entries(premiumPlan.features || {}).map(([key, value]) => {
                if (typeof value === 'boolean' && value) {
                  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                } else if (typeof value === 'string') {
                  return `${value} ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
                }
                return `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
              });
              setPlanFeatures(features);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching plan data:', err);
      }
    };

    fetchPlanData();
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          planId: planData?.id || 'premium-monthly',
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/plans?canceled=true`,
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(`Checkout failed: ${errorData.details || errorData.error || 'Unknown error'}`);
      }

      const { url } = await checkoutResponse.json();
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Unlock the full potential of your real estate analysis
            </p>
          </div>
        </div>
        {planFeatures && planFeatures.length > 0 &&
          <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  {/* <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Most Popular
                  </div> */}
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md w-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Premium Plan</h3>
                    <p className="text-white/60">Perfect for real estate professionals</p>
                  </div>

                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-white mb-2">$49.99</div>
                    <div className="text-white/60">per month</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Processing...
                      </div>
                    ) : (
                      'Start Premium Plan'
                    )}
                  </button>

                  <div className="text-center mt-6">
                    <p className="text-white/40 text-sm">
                      Cancel anytime • No setup fees • Secure payment
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                ← Back to Dashboard
              </button>
            </div>
          </main>
        }
      </div>
    </div>
  );
};

export default PlansPage; 