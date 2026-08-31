"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTrips, Trip } from "@/services/tripService";
import TripExplorer from "@/components/TripExplorer";

// ---------------------------------------------------------------------------
// Shared retro primitive
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Trip History Page — Client Component
// Reads the JWT from localStorage only inside useEffect (client-side only).
// ---------------------------------------------------------------------------

export default function TripsPage() {
  const router = useRouter();

  const [trips,   setTrips]   = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    // Safe to access localStorage here — useEffect only runs on the client
    const token = localStorage.getItem("token");

    // No token → redirect to login immediately
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch trips using the token as an explicit argument
    getTrips(token)
      .then((data) => setTrips(data))
      .catch((err) => {
        // 401 from the service means the token is expired or invalid
        if (err.message.includes("401") || err.message.includes("403")) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load trips.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-4 animate-pulse">[ ▓▓▓░░░ ]</div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            LOADING QUEST LOG...
          </p>
        </div>
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono px-4">
        <div className="w-full max-w-md bg-red-900 border-4 border-red-400 p-6 text-center">
          <p className="font-mono text-red-300 text-xs uppercase tracking-widest mb-2">
            ⚠ ERROR
          </p>
          <p className="font-mono text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 border-2 border-white text-white font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-white hover:text-red-600 cursor-pointer"
          >
            RETRY
          </button>
        </div>
      </main>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-900 font-mono">
      <div className="max-w-3xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col">

        {/* ── Top nav ── */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-yellow-400 font-mono font-bold text-xl uppercase tracking-widest hover:text-white"
          >
            KelanaAI
          </Link>
          <span className="font-mono text-slate-400 text-xs uppercase tracking-widest">
            MY TRIPS
          </span>
        </div>

        {/* ── Page header ── */}
        <div className="mb-2">
          <h1 className="font-mono font-bold text-white uppercase tracking-widest text-2xl">
            ▶ TRIP HISTORY
          </h1>
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mt-1">
            {trips.length} SAVED {trips.length === 1 ? "ITINERARY" : "ITINERARIES"}
          </p>
        </div>

        <AsciiDivider />

        {/* ── Content ── */}
        {trips.length > 0 ? (
          <TripExplorer initialTrips={trips} />
        ) : (
          <div className="bg-blue-900 border-4 border-white p-8 mt-6 text-center">
            <p className="font-mono text-yellow-400 text-2xl mb-3">[ EMPTY ]</p>
            <p className="font-mono text-slate-300 text-sm uppercase tracking-wide mb-6">
              NO QUESTS RECORDED YET.
            </p>
            <Link
              href="/"
              className="bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-red-600"
            >
              START YOUR FIRST ADVENTURE →
            </Link>
          </div>
        )}

        {/* ── Back button ── */}
        {trips.length > 0 && (
          <Link
            href="/"
            className="mt-8 w-full bg-red-600 border-4 border-white text-white font-mono font-bold text-sm py-3 uppercase tracking-widest text-center hover:bg-white hover:text-red-600"
          >
            ◀ BACK TO TITLE SCREEN
          </Link>
        )}

      </div>
    </main>
  );
}
