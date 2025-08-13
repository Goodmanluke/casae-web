import { useState, useEffect } from 'react';

interface Comp {
  id: number;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
}

const Comps = () => {
  const [comps, setComps] = useState<Comp[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComps = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://casae-api.onrender.com/comps/suggest');
        const data = await res.json();
        setComps(data.comps || []);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchComps();
  }, []);

  const handleToggle = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Suggested Comparables</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-2 py-1">Select</th>
              <th className="px-2 py-1">Address</th>
              <th className="px-2 py-1">Price</th>
              <th className="px-2 py-1">Beds</th>
              <th className="px-2 py-1">Baths</th>
              <th className="px-2 py-1">Sqft</th>
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
                <td className="px-2 py-1">{comp.address}</td>
                <td className="px-2 py-1">${comp.price.toLocaleString()}</td>
                <td className="px-2 py-1">{comp.beds}</td>
                <td className="px-2 py-1">{comp.baths}</td>
                <td className="px-2 py-1">{comp.sqft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Comps;
