"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProfile, UserProfile } from "@/services/authService";
import { getTrips } from "@/services/tripService";

// ---------------------------------------------------------------------------
// Retro UI primitives
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-3">
      <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold mb-1">
        {icon} {title}
      </p>
      <AsciiDivider />
    </div>
  );
}

// One stat tile in the profile grid
function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-black border-2 border-white px-4 py-3 flex flex-col gap-1">
      <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
        {icon} {label}
      </p>
      <p className="font-mono text-green-400 text-sm font-bold uppercase truncate">
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();

  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [tripCount,  setTripCount]  = useState<number | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    // Safe to access localStorage — this only runs on the client
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch profile and trip count in parallel for speed
    Promise.all([
      getProfile(token),
      getTrips(token),
    ])
      .then(([profileData, trips]) => {
        setProfile(profileData);
        setTripCount(trips.length);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load profile.";
        if (message.includes("401") || message.includes("403")) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setError(message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-4 animate-pulse">[ ▓▓▓░░░ ]</div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            LOADING PLAYER PROFILE...
          </p>
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono px-4">
        <div className="w-full max-w-md bg-red-900 border-4 border-red-400 p-6 text-center">
          <p className="font-mono text-red-300 text-xs uppercase tracking-widest mb-2">⚠ ERROR</p>
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

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-slate-900 font-mono">
      <div className="max-w-2xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col">

        {/* ── Back nav ── */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-yellow-400 mb-6 w-fit"
        >
          ◀ BACK TO TRIPS
        </Link>

        {/* ── Page heading ── */}
        <div className="mb-2">
          <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-3xl drop-shadow-md">
            PLAYER PROFILE
          </h1>
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mt-1">
            — ACCOUNT DETAILS —
          </p>
        </div>

        <AsciiDivider />

        {/* ── Avatar + name block ── */}
        <div className="bg-blue-900 border-4 border-white p-6 mt-6 flex items-center gap-5">
          {/* Pixel avatar placeholder */}
          <div className="w-16 h-16 bg-black border-4 border-yellow-400 flex items-center justify-center text-3xl shrink-0 select-none">
            🧑
          </div>
          <div>
            <p className="font-mono font-bold text-white uppercase tracking-widest text-lg leading-none">
              {profile.name}
            </p>
            <p className="font-mono text-slate-400 text-xs uppercase tracking-wide mt-1">
              {profile.email}
            </p>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="mt-6">
          <SectionLabel icon="📊" title="PLAYER STATS" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatBox icon="🧑" label="NAME"  value={profile.name} />
            <StatBox icon="📧" label="EMAIL" value={profile.email} />
            <StatBox
              icon="🗺"
              label="QUESTS COMPLETED"
              value={tripCount !== null ? String(tripCount) : "..."}
            />
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/"
            className="flex-1 bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-white hover:text-red-600"
          >
            ⚔ NEW QUEST
          </Link>
          <Link
            href="/trips"
            className="flex-1 bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-yellow-400 hover:text-black"
          >
            📜 TRIP HISTORY
          </Link>
        </div>

      </div>
    </main>
  );
}
