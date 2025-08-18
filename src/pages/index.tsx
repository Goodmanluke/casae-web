import { useRouter } from "next/router";
import { useState } from "react";
import { logoSrc } from "../lib/logo";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  async function geocodeAddress(addr: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      addr
    )}.json?access_token=${token}&limit=1&country=US`;
    const r = await fetch(url);
    const j = await r.json();
    const f = j.features?.[0];
    if (!f) return null;
    const [lng, lat] = f.center;
    return { lat, lng, place_name: f.place_name as string };
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!q.trim()) return;

    const result = await geocodeAddress(q.trim());
    if (!result) return;

    const { lat, lng, place_name } = result;

    router.push({
      pathname: "/cma",
      query: {
        address: place_name,
        lat: String(lat),
        lng: String(lng),
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
