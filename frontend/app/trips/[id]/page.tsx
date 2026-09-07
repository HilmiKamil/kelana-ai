"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTrip } from "@/services/tripService";
import { Trip } from "@/services/tripService";

// ---------------------------------------------------------------------------
// Shared retro UI primitives (local — no extra import needed)
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

// ---------------------------------------------------------------------------
// Stat box — one metric tile in the overview grid
// ---------------------------------------------------------------------------

function StatBox({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black border-2 border-white px-4 py-3 flex flex-col gap-1">
      <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
        {icon} {label}
      </p>
      <div className="font-mono text-green-400 text-sm font-bold uppercase">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category badge — colour shifts per travel class
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  const upper = category.toUpperCase();
  const colour =
    upper === "LUXURY"
      ? "border-yellow-400 text-yellow-400"
      : upper === "BACKPACKER"
      ? "border-green-400 text-green-400"
      : upper === "FAMILY"
      ? "border-blue-300 text-blue-300"
      : "border-slate-400 text-slate-400";

  return (
    <span className={`font-mono text-xs uppercase tracking-widest border-2 px-2 py-0.5 ${colour}`}>
      {upper}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Hero image — single cinematic travel banner used for all destinations.
// Photo: night travel / bokeh city lights (Unsplash, free to use).
// Stored locally in public/images/ so it works offline and loads fast.
// ---------------------------------------------------------------------------

const HERO_IMAGE = "/images/travel-hero.jpg";

function HeroImage({ destination }: { destination: string }) {
  return (
    <div className="relative w-full h-48 sm:h-64 mb-6 border-4 border-white overflow-hidden">
      <img
        src={HERO_IMAGE}
        alt="Travel destination hero"
        className="w-full h-full object-cover"
      />
      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      {/* Destination label — retro terminal style, bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
        <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
          📍 CURRENT QUEST
        </p>
        <p className="font-mono text-yellow-400 font-bold uppercase tracking-wide text-lg leading-tight drop-shadow-md">
          {destination.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
// Parses the JSON string from Bedrock and renders structured Day cards.
// Falls back to plain text if JSON.parse fails.
// ---------------------------------------------------------------------------

interface ItineraryDay  { day: string; activities: string }
interface BudgetBreakdown { accommodation: number; food: number; transport: number; total: number }
interface ParsedItinerary {
  itinerary:        ItineraryDay[];
  travel_tips:      string[];
  local_food:       string[];
  budget_breakdown: BudgetBreakdown;
}

// Bold-text renderer: **text** → <strong>
function formatBoldText(text: string): React.ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-yellow-300">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function AiRecommendationSection({ raw }: { raw: string }) {
  // Try to parse as structured JSON first
  let parsed: ParsedItinerary | null = null;
  try { parsed = JSON.parse(raw); } catch { /* fall through */ }

  if (parsed) {
    return (
      <div className="flex flex-col gap-8">

        {/* ── Itinerary stages ── */}
        <div>
          <SectionLabel icon="🗓" title="MISSION STAGES" />
          <div className="flex flex-col gap-3">
            {parsed.itinerary.map((day, i) => (
              <div key={i} className="bg-blue-900 border-4 border-white p-4">
                <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest mb-1">
                  ▶ STAGE {i + 1}
                </p>
                <h3 className="font-mono text-white text-sm font-bold uppercase mb-2">
                  {day.day.toUpperCase()}
                </h3>
                <AsciiDivider />
                <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap mt-2">
                  {formatBoldText(day.activities)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Travel tips ── */}
        <div>
          <SectionLabel icon="💡" title="ADVENTURER'S TIPS" />
          <div className="flex flex-col gap-2">
            {parsed.travel_tips.map((tip, i) => (
              <div key={i} className="bg-blue-900 border-2 border-slate-400 px-4 py-3">
                <p className="font-mono text-slate-500 text-xs mb-1">
                  ITEM [{String(i + 1).padStart(2, "0")}]
                </p>
                <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
                  {formatBoldText(tip)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Local food ── */}
        <div>
          <SectionLabel icon="🍜" title="TAVERN MENU — LOCAL FOOD" />
          <div className="flex flex-col gap-2">
            {parsed.local_food.map((item, i) => (
              <div key={i} className="bg-blue-900 border-2 border-slate-400 px-4 py-3">
                <p className="font-mono text-slate-500 text-xs mb-1">
                  ITEM [{String(i + 1).padStart(2, "0")}]
                </p>
                <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
                  {formatBoldText(item)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Budget breakdown ── */}
        <div>
          <SectionLabel icon="💰" title="GOLD LEDGER — BUDGET BREAKDOWN" />
          <div className="bg-blue-900 border-4 border-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {[
                { label: "ACCOMMODATION", value: parsed.budget_breakdown.accommodation, icon: "🏨" },
                { label: "FOOD",          value: parsed.budget_breakdown.food,          icon: "🍱" },
                { label: "TRANSPORT",     value: parsed.budget_breakdown.transport,     icon: "🚃" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-black border-2 border-slate-600 px-3 py-2">
                  <p className="font-mono text-slate-400 text-xs uppercase">{icon} {label}</p>
                  <p className="font-mono text-green-400 text-sm font-bold">
                    $ {value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <AsciiDivider />
            <div className="flex justify-between items-center mt-3">
              <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold">
                TOTAL GOLD
              </p>
              <p className="font-mono text-yellow-400 text-lg font-bold">
                $ {parsed.budget_breakdown.total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Fallback — raw Markdown text in a retro dialog box
  return (
    <div className="bg-blue-900 border-4 border-white p-4">
      <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
        {formatBoldText(raw)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — Client Component
// Unwraps params with React.use(), reads token from localStorage in
// useEffect (client-only), then fetches the trip with the Bearer token.
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripDetailPage({ params }: PageProps) {
  // Unwrap the params Promise with React.use() — required in Next.js 15
  const { id } = use(params);

  const router = useRouter();

  const [trip,      setTrip]      = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    // Safe to access localStorage here — useEffect runs only on the client
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    getTrip(Number(id), token)
      .then((data) => setTrip(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load trip.";
        // Token expired or invalid — clear and redirect
        if (message.includes("401") || message.includes("403")) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setError(message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-4 animate-pulse">[ ▓▓▓░░░ ]</div>
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            LOADING QUEST DETAIL...
          </p>
        </div>
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center font-mono px-4">
        <div className="w-full max-w-md bg-red-900 border-4 border-red-400 p-6 text-center">
          <p className="font-mono text-red-300 text-xs uppercase tracking-widest mb-2">
            ⚠ ERROR
          </p>
          <p className="font-mono text-red-200 text-sm mb-4">{error}</p>
          <Link
            href="/trips"
            className="bg-red-600 border-2 border-white text-white font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-white hover:text-red-600"
          >
            ◀ BACK TO TRIPS
          </Link>
        </div>
      </main>
    );
  }

  // ── No data (should not normally happen after loading) ─────────────────
  if (!trip) return null;

  return (
    <main className="min-h-screen bg-slate-900 font-mono">
      <div className="max-w-3xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col">

        {/* ── Back navigation ── */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-yellow-400 mb-6 w-fit"
        >
          ◀ BACK TO TRIPS
        </Link>

        {/* ── Hero image ── */}
        <HeroImage destination={trip.destination} />

        {/* ── Page heading ── */}
        <div className="mb-2">
          <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-3xl drop-shadow-md">
            {trip.destination.toUpperCase()}
          </h1>
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mt-1">
            — QUEST DETAIL #{trip.id} —
          </p>
        </div>

        <AsciiDivider />

        {/* ── Overview grid ── */}
        <div className="grid grid-cols-2 gap-3 mt-6 mb-8">
          <StatBox icon="📍" label="Destination">
            {trip.destination}
          </StatBox>
          <StatBox icon="💰" label="Budget">
            USD {trip.budget.toLocaleString()}
          </StatBox>
          <StatBox icon="🎒" label="Category">
            <CategoryBadge category={trip.category} />
          </StatBox>
          <StatBox icon="📅" label="Days">
            {trip.days} DAYS
          </StatBox>
        </div>

        {/* ── AI Recommendation ── */}
        <SectionLabel icon="🤖" title="AI RECOMMENDATION" />

        {trip.ai_recommendation ? (
          <AiRecommendationSection raw={trip.ai_recommendation} />
        ) : (
          <div className="bg-blue-900 border-4 border-white p-6 text-center">
            <p className="font-mono text-slate-400 text-xs uppercase tracking-widest">
              NO AI RECOMMENDATION AVAILABLE FOR THIS QUEST.
            </p>
          </div>
        )}

        {/* ── Back button ── */}
        <Link
          href="/trips"
          className="mt-10 w-full bg-red-600 border-4 border-white text-white font-mono font-bold text-sm py-3 uppercase tracking-widest text-center hover:bg-white hover:text-red-600"
        >
          ◀ BACK TO TRIP HISTORY
        </Link>

      </div>
    </main>
  );
}
