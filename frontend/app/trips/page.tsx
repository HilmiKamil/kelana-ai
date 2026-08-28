import Link from "next/link";
import { getTrips } from "@/services/tripService";
import TripExplorer from "@/components/TripExplorer";

// ---------------------------------------------------------------------------
// ASCII divider — reused from main theme
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Trip History Page — async Server Component
// ---------------------------------------------------------------------------

export default async function TripsPage() {
  const trips = await getTrips();

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
          // Pass all trips to the client component for live search + sort
          <TripExplorer initialTrips={trips} />
        ) : (
          /* Empty state — no trips in DB at all */
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

        {/* ── Back button — only shown when there is data ── */}
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
