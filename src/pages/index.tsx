import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { logoSrc } from "../lib/logo";

/**
 * Home page for CMAi. This version removes any dependency on Mapbox
 * for geocoding. Instead of looking up latitude/longitude via the
 * Mapbox API, it simply forwards the user-entered address directly
 * to the `/cma` route. The backend will perform its own location matching
 * using RentCast or other heuristics. This avoids failures when a Mapbox token
 * is invalid or missing.
 */
export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  /**
   * Handles form submission. Immediately navigates to the CMA wizard
   * without attempting to geocode the address.
   */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push({
      pathname: "/cma",
      query: { address: q.trim() },
    });
  };

  useEffect(() => {
    const finish = () => setIntroDone(true);
    timerRef.current = window.setTimeout(finish, 3000);
    const onAny = () => {
      if (!introDone) finish();
    };
    window.addEventListener("scroll", onAny, { once: true });
    window.addEventListener("click", onAny, { once: true });
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener("scroll", onAny);
      window.removeEventListener("click", onAny);
    };
  }, [introDone]);

  // When intro completes, play a longer enlarge + fade (4s) and go to login
  useEffect(() => {
    if (!introDone) return;
    setExiting(true);
    const t = window.setTimeout(() => {
      router.replace("/login");
    }, 4000);
    return () => window.clearTimeout(t);
  }, [introDone, router]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 transition-filter duration-700" style={{ filter: introDone ? "blur(0px)" : "blur(10px)" }}>
        <img src="/bg-dark.svg" className="w-full h-full object-cover" alt="background" />
      </div>

      {/* Centerpiece Logo + Motto */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`transition-all ease-out ${exiting ? "opacity-0" : introDone ? "opacity-100" : "opacity-100"}`}
          style={{ transformOrigin: "center", transitionDuration: exiting ? '4000ms' : '700ms', transform: exiting ? 'scale(1.6)' : (introDone ? 'scale(0.9)' : 'scale(1)') }}
        >
          <img src={logoSrc} alt="CMAi" className="h-40 mx-auto drop-shadow-xl" />
          <div className="text-cyan-200 text-center mt-4 text-xl font-semibold tracking-wide">CMAi</div>
        </div>
      </div>

      {/* No content layer here; we redirect to /login after the intro */}
    </main>
  );
}
