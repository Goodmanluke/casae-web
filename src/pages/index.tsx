import { useRouter } from "next/router";
import { useState } from "react";
import { logoSrc } from "../lib/logo";

/**
 * Home page for CMAi. This version removes any dependency on Mapbox
 * for geocoding. Instead of looking up latitude/longitude via the
 * Mapbox API, it simply forwards the user‑entered address directly
 * to the `/cma` route with dummy lat/lng values of "0". The backend
 * will perform its own location matching using RentCast or other
 * heuristics. This avoids failures when a Mapbox token is invalid
 * or missing.
 */
export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  /**
   * Handles form submission. Immediately navigates to the CMA wizard
   * without attempting to geocode the address. Lat/lng default to
   * "0" which is treated as a placeholder by the backend.
   */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push({
      pathname: "/cma",
      query: {
        address: q.trim(),
        lat: "0",
        lng: "0",
        beds: "0",
        baths: "0",
        sqft: "0",
      },
    });
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <img src={logoSrc} alt="CMAi logo" className="mx-auto h-20 mb-4" />
      <h1 className="text-xl font-semibold mb-4">Start a CMA</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter subject property address"
          className="flex-1 border rounded-xl px-4 py-3"
        />
        <button type="submit" className="px-4 py-3 rounded-xl border">
          Go
        </button>
      </form>
    </main>
  );
}