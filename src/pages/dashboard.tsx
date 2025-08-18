import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../lib/supabaseClient';

/**
 * Enhanced dashboard page.
 *
 * The dashboard checks the user's session using Supabase Auth.  If the user
 * is not logged in, they are redirected to the login page.  When logged in,
 * it displays a welcome message, a list of saved searches fetched from the
 * backend, and a button to start a Stripe subscription checkout.  A logout
 * button is also provided.
 */
const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);

  useEffect(() => {
    // Check for an active session.  If there is no session, redirect to login.
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
      setUserEmail(session.user?.email ?? null);
      // After verifying the session, load saved searches
      await fetchSavedSearches(session.user?.id ?? '');
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  // Fetch saved searches for the current user
  const fetchSavedSearches = async (userId: string) => {
    if (!userId) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.cmai.app';
      const res = await fetch(`${API_BASE}/searches/list?user_id=${userId}`);
      const data = await res.json();
      let results: any[] = [];
      if (Array.isArray(data?.results)) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }
      setSavedSearches(results);
    } catch (error) {
      console.error(error);
      setSavedSearches([]);
    }
  };

  // Log out the user
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Start Stripe checkout for subscription
  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Subscription checkout failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Subscription checkout failed.');
    }
  };

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {userEmail && <p className="mb-4">Welcome, {userEmail}!</p>}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-1 px-3 rounded"
        >
          Log out
        </button>
        <button
          onClick={handleSubscribe}
          className="bg-green-600 text-white py-1 px-3 rounded"
        >
          Subscribe
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Saved Searches</h2>
          {savedSearches.length === 0 ? (
            <p className="text-sm text-gray-600">
              You don't have any saved searches yet.  Perform a search on the comps
              page and click "Save Search" to store it here.
            </p>
          ) : (
            <ul className="space-y-2 text-sm break-words">
              {savedSearches.map((item: any, idx: number) => (
                <li key={idx} className="border-b pb-1 last:border-b-0">
                  {/* Display the params as a JSON string or format as desired */}
                  {JSON.stringify(item.params || item)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Market Insights</h2>
          <p className="text-sm text-gray-600">
            Future enhancements will display charts and statistics about your local
            market, such as median price per square foot and inventory trends.
            Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
