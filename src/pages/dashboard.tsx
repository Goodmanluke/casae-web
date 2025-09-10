import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Navigation from "../components/Navigation";
import { useSubscription } from "../hooks/useSubscription";

/**
 * Enhanced dashboard page with stunning modern design.
 *
 * The dashboard checks the user's session using Supabase Auth. If the user
 * is not logged in, they are redirected to the login page. When logged in,
 * it displays a welcome message, a list of saved searches fetched from the
 * backend, and a button to start a Stripe subscription checkout. A logout
 * button is also provided.
 */
const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState<"single" | "multiple">("single");

  // Get user ID for subscription
  const [userId, setUserId] = useState<string | undefined>();

  // Get subscription status
  const {
    subscription,
    loading: subLoading,
    isPremium,
    hasProAccess,
    isTrialing,
    isPastDue,
  } = useSubscription(userId);

  useEffect(() => {
    // Check for an active session. If there is no session, redirect to login.
    const fetchSession = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) {
        router.replace("/login");
        return;
      }
      setUserEmail(session.user?.email ?? null);
      setUserId(session.user?.id);
      // After verifying the session, load saved properties
      await fetchSavedProperties(session.user?.id ?? "");
      setLoading(false);
    };
    fetchSession();
  }, [router]);

  // Fetch saved properties for the current user
  const fetchSavedProperties = async (userId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved properties:", error);
        setSavedProperties([]);
      } else {
        setSavedProperties(data || []);
      }
    } catch (error) {
      console.error("Error fetching saved properties:", error);
      setSavedProperties([]);
    }
  };

  // Handle View button - go to CMA page with address
  const handleViewProperty = (property: any) => {
    if (property.address) {
      router.push(`/cma?address=${encodeURIComponent(property.address)}`);
    }
  };

  // Handle Edit button - go to CMA page with address and adjustments tab
  const handleEditProperty = (property: any) => {
    if (property.address) {
      router.push(
        `/cma?address=${encodeURIComponent(property.address)}&tab=adjustments`
      );
    }
  };

  // Handle Delete button - show confirmation modal
  const handleDeleteProperty = (property: any) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  // Handle multiple delete
  const handleMultipleDelete = () => {
    if (selectedProperties.length === 0) return;
    setDeleteMode("multiple");
    setShowDeleteModal(true);
  };

  // Toggle property selection
  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  // Select all properties
  const selectAllProperties = () => {
    const allIds = savedProperties.map((prop) => prop.id);
    setSelectedProperties(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedProperties([]);
  };

  // Confirm delete property
  const confirmDeleteProperty = async () => {
    if (!supabase) return;

    try {
      if (deleteMode === "single" && propertyToDelete) {
        const { error } = await supabase
          .from("properties")
          .delete()
          .eq("id", propertyToDelete.id);

        if (error) {
          console.error("Error deleting property:", error);
          alert("Failed to delete property");
        } else {
          // Refresh the properties list
          await fetchSavedProperties(propertyToDelete.user_id);
          setShowDeleteModal(false);
          setPropertyToDelete(null);
        }
      } else if (deleteMode === "multiple" && selectedProperties.length > 0) {
        const { error } = await supabase
          .from("properties")
          .delete()
          .in("id", selectedProperties);

        if (error) {
          console.error("Error deleting properties:", error);
          alert("Failed to delete properties");
        } else {
          // Refresh the properties list
          const { data: sessionData } = await supabase.auth.getSession();
          const uid = sessionData.session?.user?.id;
          if (uid) {
            await fetchSavedProperties(uid);
          }
          setSelectedProperties([]);
          setShowDeleteModal(false);
        }
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property");
    }
  };

  // Log out the user
  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // Redirect to plans page
  const handleSubscribe = () => {
    router.push("/plans");
  };

  const calculateDaysRemaining = (endDate: string) => {
    console.log("Calculating days remaining for:", endDate);

    const end = new Date(endDate);
    const now = new Date();

    console.log("End date:", end);
    console.log("Current date:", now);
    console.log("End date timestamp:", end.getTime());
    console.log("Current timestamp:", now.getTime());

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log("Time difference (ms):", diffTime);
    console.log("Days difference:", diffDays);

    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mb-4"></div>
          <p className="text-white/60 text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <Navigation />

        {/* Premium Badge - Top Right Corner */}
        {hasProAccess && (
          <div className="max-w-7xl mx-auto px-6 py-4 w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/30 backdrop-blur-sm inline-flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold text-lg">PRO ACTIVE</span>
              <div className="w-px h-6 bg-white/30"></div>
              <span className="text-emerald-100 text-sm">
                {subscription?.current_period_end
                  ? `${calculateDaysRemaining(
                      subscription.current_period_end
                    )} days remaining`
                  : "Active subscription"}
              </span>
            </div>
          </div>
        )}
        {isPremium && (
          <div className="max-w-7xl mx-auto px-6 py-4 w-full">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/30 backdrop-blur-sm inline-flex items-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-bold text-lg">PREMIUM ACTIVE</span>
              <div className="w-px h-6 bg-white/30"></div>
              <span className="text-emerald-100 text-sm">
                {subscription?.current_period_end
                  ? `${calculateDaysRemaining(
                      subscription.current_period_end
                    )} days remaining`
                  : "Active subscription"}
              </span>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-2 mb-12">
            {/* Left Side - Dashboard Title */}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                Dashboard
              </h1>
              {userEmail && (
                <p className="text-white/60 text-lg">
                  Welcome back,{" "}
                  <span className="text-white font-medium">{userEmail}</span>
                </p>
              )}
            </div>

            {/* Right Side - Subscribe Button */}
            <div className="flex flex-col items-end">
              {!isPremium ||
                (!hasProAccess && (
                  <button
                    onClick={handleSubscribe}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg mb-2"
                  >
                    Subscribe
                  </button>
                ))}
              {(isPremium || hasProAccess) &&
                subscription?.current_period_end && (
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold text-lg">
                      {calculateDaysRemaining(subscription.current_period_end)}{" "}
                      days left
                    </p>
                    <p className="text-white/60 text-sm">
                      Premium subscription
                    </p>
                    {/* Debug info - remove in production */}
                    <p className="text-white/40 text-xs mt-1">
                      Ends:{" "}
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Saved Properties */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Saved Properties
                </h2>
              </div>

              {savedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-white/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <p className="text-white/60 text-lg mb-4">
                    You don't have any saved properties yet
                  </p>
                  <p className="text-white/40 text-sm">
                    Run a CMA and click "Save Property" to store it here
                  </p>
                </div>
              ) : (
                <div>
                  {/* Selection Controls */}
                  {selectedProperties.length > 0 && (
                    <div className="mb-4 flex gap-3">
                      <button
                        onClick={handleMultipleDelete}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-xl transition-all duration-300 border border-red-400/30"
                      >
                        Delete Selected ({selectedProperties.length})
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 border border-white/20"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/10 backdrop-blur-sm">
                          <tr>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              <input
                                type="checkbox"
                                checked={
                                  selectedProperties.length ===
                                    savedProperties.length &&
                                  savedProperties.length > 0
                                }
                                onChange={(e) =>
                                  e.target.checked
                                    ? selectAllProperties()
                                    : clearSelection()
                                }
                                className="w-4 h-4 text-emerald-600 bg-white/20 border-white/30 rounded focus:ring-emerald-500 focus:ring-2"
                              />
                            </th>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              No
                            </th>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              Address
                            </th>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              Price
                            </th>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              Beds
                            </th>
                            <th className="px-6 py-4 text-left text-white font-semibold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {savedProperties.map((property: any, idx: number) => (
                            <tr
                              key={property.id || idx}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedProperties.includes(
                                    property.id
                                  )}
                                  onChange={() =>
                                    togglePropertySelection(property.id)
                                  }
                                  className="w-4 h-4 text-emerald-600 bg-white/20 border-white/30 rounded focus:ring-emerald-500 focus:ring-2"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-white/60 font-medium">
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-white font-medium">
                                  {property.address || "N/A"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-emerald-400 font-semibold">
                                  ${(property.raw_price || 0).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-white">
                                  {property.beds || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewProperty(property)}
                                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm rounded-lg transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleEditProperty(property)}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProperty(property)
                                    }
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Market Insights */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Market Insights
                </h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Future enhancements will display interactive charts and
                    real-time statistics about your local market, including
                    median price per square foot, inventory trends, and market
                    velocity indicators.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold text-cyan-400">
                      24.5%
                    </div>
                    <div className="text-white/60 text-sm">
                      Avg. Price Increase
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold text-green-400">12</div>
                    <div className="text-white/60 text-sm">Days on Market</div>
                  </div>
                </div>

                <div className="text-center">
                  <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="mt-12">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                Subscription Status
              </h2>

              {subLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
                  <p className="text-white/60">Loading subscription...</p>
                </div>
              ) : isPremium ? (
                <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-emerald-400">
                      Premium Active
                    </h3>
                  </div>
                  <p className="text-emerald-200 mb-3">
                    You have access to all premium features!
                  </p>
                  {subscription && subscription.current_period_end && (
                    <div className="text-sm text-emerald-300">
                      <p>
                        Next billing:{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : hasProAccess ? (
                <div className="bg-emerald-900/20 border border-emerald-400/30 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-emerald-400">
                      Pro Active
                    </h3>
                  </div>
                  <p className="text-emerald-200 mb-3">
                    You have access to all pro features!
                  </p>
                  {subscription && subscription.current_period_end && (
                    <div className="text-sm text-emerald-300">
                      <p>
                        Next billing:{" "}
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : isTrialing ? (
                <div className="bg-blue-900/20 border border-blue-400/30 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-blue-400 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-blue-400">
                      Trial Active
                    </h3>
                  </div>
                  <p className="text-blue-200">
                    You're currently in a trial period.
                  </p>
                </div>
              ) : isPastDue ? (
                <div className="bg-red-900/20 border border-red-400/30 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-red-400">
                      Payment Past Due
                    </h3>
                  </div>
                  <p className="text-red-200">
                    Please update your payment method to continue.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-700/20 border border-slate-400/30 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-4 h-4 bg-slate-400 rounded-full mr-3"></div>
                    <h3 className="text-xl font-semibold text-slate-400">
                      Free Plan
                    </h3>
                  </div>
                  <p className="text-slate-200 mb-4">
                    Upgrade to Premium for full access to all features.
                  </p>
                  <button
                    onClick={handleSubscribe}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-12">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                Quick Actions
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <button
                  onClick={() => router.push("/cma")}
                  className="group bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Start New CMA
                  </h3>
                  <p className="text-white/60 text-sm">
                    Create a comprehensive market analysis
                  </p>
                </button>

                <button
                  onClick={() => router.push("/properties")}
                  className="group bg-gradient-to-r from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Browse Properties
                  </h3>
                  <p className="text-white/60 text-sm">
                    View your property database
                  </p>
                </button>

                {/* Upgrade Plan Button - Always functional */}
                <button
                  onClick={handleSubscribe}
                  className="group bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Upgrade Plan
                  </h3>
                  <p className="text-white/60 text-sm">
                    Unlock premium features
                  </p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                {deleteMode === "single"
                  ? "Delete Property"
                  : "Delete Properties"}
              </h3>
              <p className="text-white/60 mb-6">
                {deleteMode === "single"
                  ? `Are you sure you want to delete "${propertyToDelete?.address}"? This action cannot be undone.`
                  : `Are you sure you want to delete ${selectedProperties.length} selected properties? This action cannot be undone.`}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProperty}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
