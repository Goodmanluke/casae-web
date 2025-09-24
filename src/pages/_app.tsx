import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { supabase } from "../lib/supabase";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const redirectingRef = useRef(false);

  // Prefetch login to reduce route aborts
  useEffect(() => {
    router.prefetch("/login").catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;

    const protect = async () => {
      const publicRoutes = ["/", "/login", "/signup"];
      if (publicRoutes.includes(router.pathname)) {
        setCheckingAuth(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session);

      if (!hasSession) {
        if (redirectingRef.current) return;
        redirectingRef.current = true;
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(false);
    };

    protect();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Debounce protect to avoid double redirects
      setTimeout(() => {
        redirectingRef.current = false;
        protect();
      }, 50);
    });

    return () => {
      sub.subscription?.unsubscribe();
    };
  }, [router.isReady, router.pathname, router]);

  // Page transition effects
  useEffect(() => {
    const handleStart = () => setPageLoading(true);
    const handleComplete = () => setPageLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (checkingAuth) return null;

  return (
    <>
      <Script
        id="rewardful-queue"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`,
        }}
      />
      <Script
        src="https://r.wdfl.co/rw.js"
        data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_API_KEY}
        strategy="beforeInteractive"
      />

      {pageLoading && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
            <p className="text-white text-xl font-medium">Loading...</p>
          </div>
        </div>
      )}
      <div
        className={`transition-opacity duration-300 ${
          pageLoading ? "opacity-50" : "opacity-100"
        }`}
      >
        <Component {...pageProps} />
      </div>
    </>
  );
}
