"use client";

import { useState } from "react";
import { Trip } from "@/services/tripService";
import TripCard from "@/components/TripCard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type SortMode = "latest" | "oldest" | "highest_budget";

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// TripExplorer
// Client component — live search, sort, and client-side pagination.
// ---------------------------------------------------------------------------

export default function TripExplorer({ initialTrips }: { initialTrips: Trip[] }) {
  const [keyword,  setKeyword]  = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [page,     setPage]     = useState(1);

  // ── 1. Filter ─────────────────────────────────────────────────────────────
  const filtered = keyword.trim()
    ? initialTrips.filter((trip) => {
        const q = keyword.toLowerCase();
        return (
          trip.destination.toLowerCase().includes(q) ||
          trip.category.toLowerCase().includes(q)
        );
      })
    : initialTrips;

  // ── 2. Sort ───────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "latest")         return b.id - a.id;
    if (sortMode === "oldest")         return a.id - b.id;
    if (sortMode === "highest_budget") return b.budget - a.budget;
    return 0;
  });

  // ── 3. Paginate ───────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);         // guard against stale page
  const pageStart   = (safePage - 1) * PAGE_SIZE;
  const paginated   = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  // ── Helpers: reset page whenever filter/sort changes ─────────────────────
  function handleKeyword(value: string) {
    setKeyword(value);
    setPage(1);
  }

  function handleSort(value: SortMode) {
    setSortMode(value);
    setPage(1);
  }

  // ── Shared field class (retro-hacker theme) ───────────────────────────────
  const fieldClass =
    "bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none focus:border-yellow-400 uppercase";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 mt-6">

      {/* ── Search + sort controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => handleKeyword(e.target.value)}
          placeholder="SEARCH DESTINATION OR CATEGORY..."
          className={`flex-1 placeholder-slate-600 ${fieldClass}`}
        />
        <select
          value={sortMode}
          onChange={(e) => handleSort(e.target.value as SortMode)}
          className={`sm:w-52 cursor-pointer ${fieldClass}`}
        >
          <option value="latest">SORT: LATEST</option>
          <option value="oldest">SORT: OLDEST</option>
          <option value="highest_budget">SORT: HIGHEST BUDGET</option>
        </select>
      </div>

      {/* ── Results + page info ── */}
      <div className="flex items-center justify-between -mt-3">
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
          {sorted.length} {sorted.length === 1 ? "RESULT" : "RESULTS"}
          {keyword && ` FOR "${keyword.toUpperCase()}"`}
        </p>
        {sorted.length > 0 && (
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
            PAGE {safePage} / {totalPages}
          </p>
        )}
      </div>

      {/* ── Trip cards ── */}
      {paginated.length > 0 ? (
        <div className="flex flex-col gap-4">
          {paginated.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="bg-blue-900 border-4 border-white p-8 text-center">
          <p className="font-mono text-yellow-400 text-2xl mb-3">[ NO RESULTS ]</p>
          <p className="font-mono text-slate-300 text-sm uppercase tracking-wide">
            NO QUESTS MATCH{" "}
            <span className="text-green-400">"{keyword.toUpperCase()}"</span>.
            TRY A DIFFERENT KEYWORD.
          </p>
        </div>
      )}

      {/* ── Pagination controls — only shown when there is more than one page ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 mt-2">

          {/* PREV */}
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={safePage === 1}
            className="bg-black border-2 border-slate-500 text-yellow-400 font-mono text-xs uppercase tracking-widest px-4 py-2 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ◀ PREV
          </button>

          {/* Page indicator */}
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
            PAGE {safePage} OF {totalPages}
          </p>

          {/* NEXT */}
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={safePage === totalPages}
            className="bg-black border-2 border-slate-500 text-yellow-400 font-mono text-xs uppercase tracking-widest px-4 py-2 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT ▶
          </button>

        </div>
      )}

    </div>
  );
}
