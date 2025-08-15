https://github.com/Goodmanluke/casae-web/new/main/src/pages
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

/**
 * Simple dashboard page.
 *
 * The dashboard checks the user's session using Supabase Auth.  If the user is
 * not logged in, they are redirected to the login page.  When logged in,
 * it displays a welcome message along with a placeholder for future
 * analytics and saved searches.  This page demonstrates how to protect
 * routes and fetch user data once authenticated.
 */
const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check for an active session.  If there is no session, redirect to login.
    const fetchSession = async () => {
      if (!supabase) {
        // If supabase is not configured, redirect to login.
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
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  // Optionally sign out the user
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {userEmail && <p className="mb-4">Welcome, {userEmail}!</p>}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white py-1 px-3 rounded mb-4"
      >
        Log out
      </button>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Saved Searches</h2>
          <p className="text-sm text-gray-600">
            You don't have any saved searches yet.  When you select comparable properties on
            the comps page, they'll show up here so you can revisit them later.
          </p>
        </div>
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Market Insights</h2>
          <p className="text-sm text-gray-600">
            Future enhancements will display charts and statistics about your local market,
            such as median price per square foot and inventory trends.  Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
