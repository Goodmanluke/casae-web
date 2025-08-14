import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      if (!supabase) {
        setError("Supabase client is not configured");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(50);
      if (error) {
        setError(error.message);
      } else {
        setProperties(data || []);
      }
      setLoading(false);
    }
    fetchProperties();
  }, []);

  if (!supabase) {
    return <div className="p-4">Supabase is not configured. Please set environment variables.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading properties...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Properties</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr>
            <th className="border px-2 py-1">Price</th>
            <th className="border px-2 py-1">Beds</th>
            <th className="border px-2 py-1">Baths</th>
            <th className="border px-2 py-1">Sqft</th>
            <th className="border px-2 py-1">Lot Size</th>
            <th className="border px-2 py-1">Year</th>
            <th className="border px-2 py-1">Condition</th>
            <th className="border px-2 py-1">Sale Date</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-2 py-1">{p.raw_price}</td>
              <td className="px-2 py-1">{p.beds}</td>
              <td className="px-2 py-1">{p.baths}</td>
              <td className="px-2 py-1">{p.living_sqft}</td>
              <td className="px-2 py-1">{p.lot_size}</td>
              <td className="px-2 py-1">{p.year_built}</td>
              <td className="px-2 py-1">{p.condition_rating}</td>
              <td className="px-2 py-1">{p.sale_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
