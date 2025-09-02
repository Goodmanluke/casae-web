import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';

export default function Properties() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("raw_price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "multiple">("single");
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      if (!supabase) {
        setError("Supabase client is not configured");
        setLoading(false);
        return;
      }
      // Get session user id
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id || null;
      setUserId(uid);
      if (!uid) {
        setError("Not authenticated");
        setLoading(false);
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', uid)
        .limit(50);
      if (error) {
        setError(error.message);
      } else {
        setProperties(data || []);
      }
      setLoading(false);
    }
    fetchProperties();
  }, [router]);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white/60 text-xl">Supabase is not configured</p>
          <p className="text-white/40 text-sm mt-2">Please set environment variables</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mb-4"></div>
          <p className="text-white/60 text-xl">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white/60 text-xl">Error loading properties</p>
          <p className="text-red-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleViewProperty = (property: any) => {
    if (property.address) {
      router.push(`/cma?address=${encodeURIComponent(property.address)}`);
    }
  };

  const handleEditProperty = (property: any) => {
    if (property.address) {
      router.push(`/cma?address=${encodeURIComponent(property.address)}&tab=adjustments`);
    }
  };

  const handleDeleteProperty = (property: any) => {
    setPropertyToDelete(property);
    setDeleteMode("single");
    setShowDeleteModal(true);
  };

  const handleMultipleDelete = () => {
    if (selectedProperties.length === 0) return;
    setDeleteMode("multiple");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!supabase) return;
    
    try {
      if (deleteMode === "single" && propertyToDelete) {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', propertyToDelete.id);
        
        if (error) throw error;
        
        // Refresh properties list
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (uid) {
          const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', uid)
            .limit(50);
          setProperties(data || []);
        }
      } else if (deleteMode === "multiple" && selectedProperties.length > 0) {
        const { error } = await supabase
          .from('properties')
          .delete()
          .in('id', selectedProperties);
        
        if (error) throw error;
        
        // Refresh properties list
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (uid) {
          const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('user_id', uid)
            .limit(50);
          setProperties(data || []);
        }
        
        // Clear selection
        setSelectedProperties([]);
      }
      
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const selectAllProperties = () => {
    const allIds = filteredProperties.map(prop => prop.id);
    setSelectedProperties(allIds);
  };

  const clearSelection = () => {
    setSelectedProperties([]);
  };

  // Filter and sort properties
  const filteredProperties = properties
    .filter(prop => 
      prop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.beds?.toString().includes(searchTerm) ||
      prop.baths?.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <Navigation />
        
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Saved Properties
              </h1>
              <p className="text-white/60 mt-2 text-lg">
                Your saved property database
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{properties.length}</div>
                <div className="text-white/60 text-sm">Total Properties</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Controls */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-white/20 shadow-2xl">
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <label className="block text-white/80 font-medium mb-3 text-sm uppercase tracking-wide">
                  Search Properties
                </label>
                <input
                  type="text"
                  placeholder="Search by address, beds, baths..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-3 text-sm uppercase tracking-wide">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-slate-800/80 border border-white/40 text-white px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                  >
                  <option value="raw_price">Price</option>
                  <option value="beds">Bedrooms</option>
                  <option value="baths">Bathrooms</option>
                  <option value="living_sqft">Square Feet</option>
                  <option value="year_built">Year Built</option>
                  <option value="created_at">Date Saved</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-white/70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-3 text-sm uppercase tracking-wide">
                  Order
                </label>
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="w-full appearance-none bg-slate-800/80 border border-white/40 text-white px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-white/70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-3">
                {selectedProperties.length > 0 && (
                  <>
                    <button
                      onClick={handleMultipleDelete}
                      className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-xl transition-all duration-300 border border-red-400/30"
                    >
                      Delete Selected ({selectedProperties.length})
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300 border border-white/20"
                    >
                      Clear
                    </button>
                  </>
                )}
                <button
                  onClick={selectAllProperties}
                  className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium rounded-xl transition-all duration-300 border border-emerald-400/30"
                >
                  Select All
                </button>
              </div>
            </div>
          </div>

          {/* Properties table */}
          {filteredProperties.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Properties Found</h3>
              <p className="text-white/60 text-lg">
                {searchTerm ? `No properties match "${searchTerm}"` : "No properties in your database yet"}
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => router.push('/cma')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Run Your First CMA
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                                <table className="w-full">
                  <thead className="bg-white/10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">
                        <input
                          type="checkbox"
                          checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                          onChange={(e) => e.target.checked ? selectAllProperties() : clearSelection()}
                          className="w-4 h-4 text-emerald-600 bg-white/20 border-white/30 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Address</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Price</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Beds</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Baths</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Sqft</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Year Built</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Lot Size</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Saved Date</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
          </tr>
        </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredProperties.map((prop, idx) => (
                      <tr key={prop.id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(prop.id)}
                            onChange={() => togglePropertySelection(prop.id)}
                            className="w-4 h-4 text-emerald-600 bg-white/20 border-white/30 rounded focus:ring-emerald-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{prop.address || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-emerald-400 font-semibold">
                            ${(prop.raw_price || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{prop.beds || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{prop.baths || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{prop.living_sqft || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{prop.year_built || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{prop.lot_size ? `${prop.lot_size} sqft` : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white/60 text-sm">
                            {prop.created_at ? new Date(prop.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewProperty(prop)}
                              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm rounded-lg transition-colors"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleEditProperty(prop)}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteProperty(prop)}
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
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                {deleteMode === "single" ? "Delete Property" : "Delete Properties"}
              </h3>
              <p className="text-white/60 mb-6">
                {deleteMode === "single" 
                  ? `Are you sure you want to delete "${propertyToDelete?.address}"? This action cannot be undone.`
                  : `Are you sure you want to delete ${selectedProperties.length} selected properties? This action cannot be undone.`
                }
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
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
}
