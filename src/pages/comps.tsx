import { apiUrl } from '@/lib/api';
import { useState } from 'react';

interface Comp {
  id: string;
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

  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [n, setN] = useState(5);

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
          const res = await fetch(`https://casae-api.onrender.com/comps/suggest?${params.toString()}`, { method: 'GET' });
const data = await res.json();
      setComps(data.results || []);
   

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

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
        <table className="min-w-full">
          <thead>
            <tr>
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
              <tr key={comp.id}>
                <td className="border-t px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(comp.id)}
                    onChange={() => handleToggle(comp.id)}
                  />
                </td>
                <td className="border-t px-2 py-1">{`$${comp.raw_price.toLocaleString()}`}</td>
                <td className="border-t px-2 py-1">{comp.beds}</td>
                <td className="border-t px-2 py-1">{comp.baths}</td>
                <td className="border-t px-2 py-1">{comp.living_sqft}</td>
                <td className="border-t px-2 py-1">{comp.year_built}</td>
                <td className="border-t px-2 py-1">{comp.similarity.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Comps;
