import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Mapbox components to avoid server-side rendering issues in Next.js.
const Map = dynamic(() => import('react-map-gl'), { ssr: false });
const Marker = dynamic(() => import('react-map-gl').then(mod => mod.Marker), { ssr: false });

// Import Recharts components for simple bar chart visualization. These will be tree‑shaken
// and only included when used.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// Define the shape of a comparable property returned from the API.  Additional fields
// (lat/lng) are included for map display.
interface Comp {
  id: string;
  lat: number;
  lng: number;
  raw_price: number;
  living_sqft: number;
  beds: number;
  baths: number;
  year_built: number;
  similarity: number;
}

const Comps = () => {
  const [comps, setComps] = useState<Comp[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Search form state
  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [n, setN] = useState(5);

  // Build the query and fetch comps from the backend API
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (price) params.append('price', price);
      if (beds) params.append('beds', beds);
      if (baths) params.append('baths', baths);
      if (sqft) params.append('sqft', sqft);
      if (yearBuilt) params.append('year_built', yearBuilt);
      if (lotSize) params.append('lot_size', lotSize);
      params.append('n', n.toString());
      // Determine the API base URL from env or fallback.  In production, NEXT_PUBLIC_API_BASE
      // will be injected by Next.js during the build.  Fallback to the custom domain.
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.casae.app';
      const res = await fetch(`${API_BASE}/comps/search?${params.toString()}`, {
        method: 'GET',
      });
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();
      // Handle different response shapes: either an array or an object with a `results` array
      const compsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setComps(compsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection of comps for potential later use (e.g. saving comps)
  const handleToggle = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  // Prepare data for the bar chart.  Each bar will represent the price of a comp.
  const priceData = useMemo(() => {
    return comps.map(comp => ({ name: comp.id, price: comp.raw_price }));
  }, [comps]);

  // Determine map center based on the first comparable property or a default location.
  const mapViewState = useMemo(() => {
    if (comps.length > 0) {
      const first = comps[0];
      return { longitude: first.lng || 0, latitude: first.lat || 0, zoom: 12 };
    }
    // Default center of the US
    return { longitude: -95, latitude: 37, zoom: 4 };
  }, [comps]);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Search Comparables</h1>
      <form onSubmit={handleSearch} className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Price"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={beds}
          onChange={e => setBeds(e.target.value)}
          placeholder="Beds"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={baths}
          onChange={e => setBaths(e.target.value)}
          placeholder="Baths"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={sqft}
          onChange={e => setSqft(e.target.value)}
          placeholder="Sqft"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={yearBuilt}
          onChange={e => setYearBuilt(e.target.value)}
          placeholder="Year Built"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={lotSize}
          onChange={e => setLotSize(e.target.value)}
          placeholder="Lot Size"
          className="border p-2 rounded"
        />
        <button type="submit" className="col-span-full bg-blue-600 text-white py-2 px-4 rounded">
          Search
        </button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {comps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1">Select</th>
                    <th className="px-2 py-1">Price</th>
                    <th className="px-2 py-1">Beds</th>
                    <th className="px-2 py-1">Baths</th>
                    <th className="px-2 py-1">Sqft</th>
                    <th className="px-2 py-1">Year</th>
                    <th className="px-2 py-1">Similarity</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map(comp => (
                    <tr key={comp.id} className="border-t">
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(comp.id)}
                          onChange={() => handleToggle(comp.id)}
                        />
                      </td>
                      <td className="px-2 py-1">${'{'}`$${comp.raw_price.toLocaleString()}`{'}'}</td>
                      <td className="px-2 py-1">{comp.beds}</td>
                      <td className="px-2 py-1">{comp.baths}</td>
                      <td className="px-2 py-1">{comp.living_sqft}</td>
                      <td className="px-2 py-1">{comp.year_built}</td>
                      <td className="px-2 py-1">{comp.similarity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {comps.length > 0 && (
            <>
              <div className="my-8" style={{ height: 400 }}>
                {/* Map showing comp locations. Mapbox access token should be set in NEXT_PUBLIC_MAPBOX_TOKEN */}
                <Map {...mapViewState} mapStyle="mapbox://styles/mapbox/streets-v11" mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}>
                  {comps.map(comp => (
                    <Marker key={comp.id} latitude={comp.lat} longitude={comp.lng} anchor="center">
                      <div
                        className="rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: 'rgba(239, 68, 68, 0.8)' }}
                      />
                    </Marker>
                  ))}
                </Map>
              </div>
              <div className="my-8" style={{ height: 300 }}>
                {/* Bar chart of raw prices for the comps */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="price" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {comps.length === 0 && <p>No results found. Try adjusting your search criteria.</p>}
        </>
      )}
    </div>
  );
};

export default Comps;