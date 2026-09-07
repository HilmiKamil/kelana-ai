"use client";

// ---------------------------------------------------------------------------
// 500 — Unexpected Runtime Error
// Next.js App Router renders this when an unhandled error is thrown
// inside a Server or Client Component in the same segment.
// Must be a Client Component ("use client") — it receives the Error object.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error:  Error & { digest?: string };
  reset: () => void;   // retries rendering the segment
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console in development; swap for a real error service in prod
    console.error("[KelanaAI] Unhandled error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-900 font-mono flex flex-col items-center justify-center px-4">

      <div className="w-full max-w-md text-center">

        <p className="font-mono text-red-400 text-xs uppercase tracking-widest mb-4 animate-pulse">
          ⚠ CRITICAL SYSTEM FAILURE
        </p>

        <div className="bg-red-900 border-4 border-red-400 p-8 mb-6">
          <p className="font-mono text-red-300 text-xs uppercase tracking-widest mb-2">
            ERROR CODE
          </p>
          <h1 className="font-mono font-bold text-red-400 text-7xl tracking-widest drop-shadow-md">
            500
          </h1>
          <p className="font-mono text-white text-sm uppercase tracking-widest mt-4">
            INTERNAL SERVER ERROR
          </p>
          <p className="font-mono text-red-300 text-xs mt-2 leading-relaxed">
            AN UNEXPECTED ERROR OCCURRED.
            <br />THE SYSTEM HAS LOGGED THE INCIDENT.
          </p>

          {/* Error digest — useful for correlating logs in production */}
          {error.digest && (
            <p className="font-mono text-slate-500 text-[10px] mt-4 uppercase tracking-widest">
              DIGEST: {error.digest}
            </p>
          )}
        </div>

        {/* ASCII divider */}
        <p className="font-mono text-blue-400 text-xs tracking-widest mb-6 overflow-hidden select-none">
          {"================================"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* retry — re-renders the failed segment */}
          <button
            onClick={reset}
            className="bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-red-600 cursor-pointer"
          >
            ↺ RETRY
          </button>
          <Link
            href="/"
            className="bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-yellow-400 hover:text-black"
          >
            ◀ RETURN TO TITLE
          </Link>
        </div>

      </div>

    </main>
  );
}
