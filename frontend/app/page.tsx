"use client";

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types (UNCHANGED)
// ---------------------------------------------------------------------------

interface TripForm {
  destination: string;
  budget: string;
  days: string;
  travel_style: string;
}

interface TripResult {
  id?: number;
  destination: string;
  budget: number;
  ai_recommendation: string;
}

interface ItineraryDay {
  day: string;
  activities: string;
}

interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  total: number;
}

interface ParsedItinerary {
  itinerary: ItineraryDay[];
  travel_tips: string[];
  local_food: string[];
  budget_breakdown: BudgetBreakdown;
}

// ---------------------------------------------------------------------------
// Helper: formatBoldText (UNCHANGED)
// ---------------------------------------------------------------------------

function formatBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-yellow-300">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Helper: parseAiRecommendation (UNCHANGED)
// ---------------------------------------------------------------------------

function parseAiRecommendation(raw: string): ParsedItinerary | null {
  try {
    return JSON.parse(raw) as ParsedItinerary;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// Retro section label above a divider
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
// Loading screen (LOGIC UNCHANGED — only colors updated to match theme)
// ---------------------------------------------------------------------------

const LOADING_STEPS = [
  "CONSULTING YOUR TRAVEL AI...",
  "RESEARCHING TOP DESTINATIONS...",
  "PLANNING DAILY ACTIVITIES...",
  "CALCULATING YOUR BUDGET...",
  "ALMOST READY — FINALISING QUEST...",
];

function LoadingScreen({ destination }: { destination: string }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 font-mono">
      <div className="text-yellow-400 text-4xl mb-6 animate-pulse">[ ▓▓▓░░░ ]</div>
      <h1 className="text-2xl font-mono font-bold text-yellow-400 uppercase mb-1 tracking-widest">
        KelanaAI
      </h1>
      <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">
        LOADING QUEST FOR:{" "}
        <span className="text-green-400">{destination.toUpperCase()}</span>
      </p>
      <AsciiDivider />
      <p className="text-sm text-white text-center max-w-xs mt-3 uppercase tracking-wide">
        {LOADING_STEPS[stepIndex]}
      </p>
      <div className="flex gap-2 mt-5">
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 border-2 border-white ${
              i === stepIndex ? "bg-yellow-400" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="mt-auto pt-6 pb-4 text-center font-mono text-xs text-slate-500 border-t-2 border-slate-700 w-full uppercase tracking-widest">
      <p>© 2026 KelanaAI. ALL RIGHTS RESERVED.</p>
      <p className="mt-1">
        <a href="#" className="hover:text-yellow-400">ABOUT</a>
        {" :: "}
        <a href="#" className="hover:text-yellow-400">PRIVACY POLICY</a>
        {" :: "}
        <a href="#" className="hover:text-yellow-400">TERMS OF SERVICE</a>
      </p>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Result sub-components
// ---------------------------------------------------------------------------

// STAGE card — full-width, sits in the right column
function DayCard({ day, index }: { day: ItineraryDay; index: number }) {
  return (
    <div className="bg-blue-900 border-4 border-white p-4 w-full">
      <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest mb-1">
        ▶ STAGE {index + 1}
      </p>
      <h3 className="font-mono text-white text-sm font-bold uppercase mb-2">
        {day.day.toUpperCase()}
      </h3>
      <AsciiDivider />
      <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap mt-2">
        {formatBoldText(day.activities)}
      </div>
    </div>
  );
}

// Item list card (travel tips, local food) — sits in the left column
function ListSection({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <div className="bg-blue-900 border-4 border-white p-4">
      <SectionLabel icon={icon} title={title} />
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="bg-black border-2 border-slate-600 px-3 py-2">
            <p className="font-mono text-slate-500 text-xs mb-1">
              ITEM [{String(index + 1).padStart(2, "0")}]
            </p>
            <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
              {formatBoldText(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Budget breakdown — sits in the right column
function BudgetCard({ budget }: { budget: BudgetBreakdown }) {
  const rows = [
    { label: "ACCOMMODATION", value: budget.accommodation, icon: "🏨" },
    { label: "FOOD",          value: budget.food,          icon: "🍱" },
    { label: "TRANSPORT",     value: budget.transport,     icon: "🚃" },
  ];

  return (
    <div className="bg-blue-900 border-4 border-white p-4">
      <SectionLabel icon="💰" title="GOLD LEDGER — BUDGET BREAKDOWN" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {rows.map(({ label, value, icon }) => (
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
          $ {budget.total.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// Stat box used in the sidebar
function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-black border-2 border-white px-3 py-2">
      <p className="font-mono text-slate-400 text-xs uppercase">{icon} {label}</p>
      <p className="font-mono text-green-400 text-sm font-bold uppercase truncate">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const [form, setForm] = useState<TripForm>({
    destination: "",
    budget: "",
    days: "",
    travel_style: "",
  });

  const [result, setResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UNCHANGED
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // UNCHANGED
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          budget: Number(form.budget),
          days: Number(form.days),
          travel_style: form.travel_style,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: TripResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // UNCHANGED
  function handleReset() {
    setResult(null);
    setError(null);
  }

  // ── Conditional rendering ──────────────────────────────────────────────────

  // LOADING VIEW
  if (loading) {
    return <LoadingScreen destination={form.destination} />;
  }

  // ── RESULT VIEW — 2-column grid ──────────────────────────────────────────
  if (result) {
    const parsed = parseAiRecommendation(result.ai_recommendation);

    return (
      <main className="min-h-screen bg-slate-900 font-mono">
        <div className="max-w-6xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col">

          {/* ── Page header ── */}
          <div className="mb-2">
            <h1 className="text-3xl font-mono font-bold text-yellow-400 uppercase tracking-widest drop-shadow-md">
              KelanaAI
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
              — QUEST LOG —
            </p>
          </div>

          {/* ── Hero image ── */}
          <div className="relative mb-6 mt-4">
            <img
              src="https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1200&auto=format&fit=crop"
              alt="Travel destination"
              className="w-full h-48 sm:h-64 object-cover border-4 border-white"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 px-4 py-2">
              <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">
                CURRENT QUEST
              </p>
              <p className="font-mono text-yellow-400 font-bold uppercase tracking-wide text-sm">
                {result.destination}
              </p>
            </div>
          </div>

          <AsciiDivider />

          {/* ── 2-column grid ── */}
          {parsed ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

              {/* ════ LEFT SIDEBAR — col-span-4 ════ */}
              <aside className="lg:col-span-4 flex flex-col gap-6">

                {/* Character stats */}
                <div className="bg-blue-900 border-4 border-white p-4">
                  <SectionLabel icon="⚔" title="PLAYER STATS" />
                  <div className="flex flex-col gap-2">
                    <StatBox icon="📍" label="DESTINATION" value={result.destination} />
                    <StatBox
                      icon="💰"
                      label="GOLD (BUDGET)"
                      value={`USD ${result.budget.toLocaleString("id-ID")}`}
                    />
                    <StatBox
                      icon="📅"
                      label="DAYS"
                      value={`${parsed.itinerary.length} DAYS`}
                    />
                    <StatBox icon="✅" label="STATUS" value="ACTIVE" />
                  </div>
                </div>

                {/* Travel tips */}
                <ListSection
                  icon="💡"
                  title="ADVENTURER'S TIPS"
                  items={parsed.travel_tips}
                />

                {/* Local food */}
                <ListSection
                  icon="🍜"
                  title="TAVERN MENU"
                  items={parsed.local_food}
                />

              </aside>

              {/* ════ RIGHT MAIN — col-span-8 ════ */}
              <section className="lg:col-span-8 flex flex-col gap-6">

                {/* Section label above itinerary */}
                <SectionLabel icon="�" title="MISSION STAGES — AI RECOMMENDATION" />

                {/* Day cards */}
                {parsed.itinerary.map((day, index) => (
                  <DayCard key={index} day={day} index={index} />
                ))}

                {/* Budget breakdown */}
                <BudgetCard budget={parsed.budget_breakdown} />

              </section>

            </div>
          ) : (
            // Fallback — raw text
            <div className="bg-blue-900 border-4 border-white p-4 mt-6">
              <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
                {formatBoldText(result.ai_recommendation)}
              </div>
            </div>
          )}

          {/* ── Reset button ── */}
          <button
            onClick={handleReset}
            className="mt-8 w-full bg-red-600 border-4 border-white text-white font-mono font-bold text-sm py-3 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-red-600"
          >
            ◀ PLAN ANOTHER TRIP
          </button>

          <Footer />

        </div>
      </main>
    );
  }

  // ── FORM VIEW — START MENU ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-start py-12 px-4 font-mono">

      {/* Title */}
      <div className="text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">✦ PRESS START ✦</p>
        <h1 className="text-4xl font-mono font-bold text-yellow-400 uppercase tracking-widest drop-shadow-md">
          KelanaAI
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">
          AN AI-POWERED TRAVEL ADVENTURE
        </p>
      </div>

      <AsciiDivider />

      {/* Form container */}
      <div className="w-full max-w-md bg-blue-900 border-4 border-white p-6 mt-6">
        <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">
          ▶ CONFIGURE YOUR QUEST
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              📍 DESTINATION
            </label>
            <input
              type="text"
              name="destination"
              placeholder="e.g. JAPAN"
              value={form.destination}
              onChange={handleChange}
              required
              className="w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              💰 GOLD (BUDGET USD)
            </label>
            <input
              type="number"
              name="budget"
              placeholder="e.g. 10000000"
              value={form.budget}
              onChange={handleChange}
              required
              min={0}
              className="w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              📅 DAYS (LVL COUNT)
            </label>
            <input
              type="number"
              name="days"
              placeholder="e.g. 5"
              value={form.days}
              onChange={handleChange}
              required
              min={1}
              className="w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              ⚔ TRAVEL STYLE (CLASS)
            </label>
            <input
              type="text"
              name="travel_style"
              placeholder="e.g. FAMILY, ADVENTURE, LUXURY"
              value={form.travel_style}
              onChange={handleChange}
              required
              className="w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-red-600 border-4 border-white text-white font-mono font-bold text-base py-3 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "LOADING..." : "START ADVENTURE →"}
          </button>

        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-md mt-4 bg-red-900 border-2 border-red-400 text-red-300 font-mono text-xs px-4 py-3 uppercase tracking-wide">
          ⚠ ERROR: {error}
        </div>
      )}

      <div className="w-full max-w-md">
        <Footer />
      </div>

    </main>
  );
}
