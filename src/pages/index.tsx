import { useState } from 'react';

const Home = () => {
  const [address, setAddress] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://casae-api.onrender.com/health');
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: 'Error connecting to API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Casae API Demo</h1>
      <p className="text-lg text-gray-700 mb-4 text-center max-w-xl">
        Enter your address (for now, it won’t be sent anywhere). When you submit, we’ll call the backend API and display the response here.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {response && (
        <pre className="mt-4 p-2 bg-gray-100 border border-gray-200 rounded w-full max-w-md text-left">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Home;
