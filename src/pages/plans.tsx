import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useSubscription } from '../hooks/useSubscription';

const PlansPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [planData, setPlanData] = useState<any>(null);
  const [userId, setUserId] = useState<string | undefined>();

  // Get subscription status
  const { subscription, loading: subLoading, isPremium, isTrialing, isPastDue } = useSubscription(userId);

  // Check for user session
  useEffect(() => {
    const fetchSession = async () => {
      if (!supabase) {
        router.replace('/login');
        return;
      }
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        router.replace('/login');
        return;
      }
      setUserId(session.user?.id);
    };
    fetchSession();
  }, [router]);

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
    // Don't proceed if user already has premium
    if (isPremium) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to subscribe');
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          planId: planData?.id || 'premium-monthly',
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/plans?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Checkout failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining for active subscription
  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
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

        {planFeatures && planFeatures.length > 0 && (
          <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex justify-center">
              <div className="relative group">
                {/* Eye-catching "Your Current Plan" Badge - Only show if user has premium */}
                {isPremium && (
                  <div className="absolute -top-6 -left-6 z-20">
                    <div className="relative">
                      {/* Main badge */}
                      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="font-bold text-sm tracking-wide">YOUR CURRENT PLAN</span>
                        </div>
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>

                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-50 -z-10"></div>
                    </div>
                  </div>
                )}

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl px-16 py-8 border border-white/20 shadow-2xl max-w-md w-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
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

                  {/* Show subscription status if user has premium */}
                  {isPremium && subscription?.current_period_end && (
                    <div className="text-center mb-6 p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
                      <p className="text-emerald-300 font-semibold">
                        {calculateDaysRemaining(subscription.current_period_end)} days remaining
                      </p>
                      <p className="text-emerald-200 text-sm">Your subscription is active</p>
                      {/* Debug info - remove in production */}
                      <p className="text-emerald-200/60 text-xs mt-1">
                        Ends: {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    {planFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={loading || isPremium}
                    className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 ${isPremium
                        ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed border border-gray-400/30'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : isPremium ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Already Subscribed
                      </div>
                    ) : (
                      'Start Premium Plan'
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl">
                      <p className="text-red-300 text-sm text-center">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default PlansPage;