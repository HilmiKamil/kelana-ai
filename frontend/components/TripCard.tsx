import Link from "next/link";
import { Trip } from "@/services/tripService";

// ---------------------------------------------------------------------------
// getDestinationIcon
// Returns a landmark emoji based on the destination name.
// ---------------------------------------------------------------------------

const DESTINATION_ICON_MAP: [string[], string][] = [
  [["japan", "tokyo", "osaka", "kyoto"],          "🌸"],
  [["paris", "france", "eiffel"],                  "🗼"],
  [["new york", "usa", "america", "nyc"],           "🗽"],
  [["bali", "indonesia", "lombok"],                 "🏝️"],
  [["egypt", "cairo", "pyramid"],                   "🔺"],
  [["rome", "italy", "milan", "venice"],            "🏛️"],
  [["singapore"],                                   "🦁"],
  [["thailand", "bangkok", "phuket", "chiangmai"],  "🐘"],
  [["korea", "seoul", "busan"],                     "🎎"],
  [["australia", "sydney", "melbourne"],            "🦘"],
  [["uk", "london", "england", "britain"],          "☂️"],
  [["malaysia", "kuala lumpur", "kl"],              "🌴"],
  [["vietnam", "hanoi", "ho chi minh"],             "🍜"],
  [["india", "mumbai", "delhi", "bangalore"],       "🕌"],
  [["germany", "berlin", "munich"],                 "🍺"],
  [["spain", "madrid", "barcelona"],                "💃"],
  [["canada", "toronto", "vancouver"],              "🍁"],
  [["maldives"],                                    "🐠"],
  [["dubai", "uae", "abu dhabi"],                   "🏙️"],
  [["new zealand", "auckland"],                     "🥝"],
];

function getDestinationIcon(destination: string): string {
  const key = destination.toLowerCase();
  for (const [keywords, icon] of DESTINATION_ICON_MAP) {
    if (keywords.some((kw) => key.includes(kw))) return icon;
  }
  return "📍"; // fallback
}

// ---------------------------------------------------------------------------
// getCategoryColour
// Returns bg + border + text classes for the Category badge.
// Deliberately bold/bright — this is the primary budget-class indicator.
// ---------------------------------------------------------------------------

function getCategoryColour(category: string): string {
  switch (category.toUpperCase()) {
    case "LUXURY":     return "bg-black border-2 border-purple-400 text-purple-400";
    case "BACKPACKER": return "bg-black border-2 border-green-400  text-green-400";
    case "STANDARD":   return "bg-black border-2 border-yellow-400 text-yellow-400";
    case "FAMILY":     return "bg-black border-2 border-blue-300   text-blue-300";
    default:           return "bg-black border-2 border-slate-400  text-slate-400";
  }
}

// ---------------------------------------------------------------------------
// getCategoryIcon — budget-class icon shown inside CategoryBadge
// ---------------------------------------------------------------------------

function getCategoryIcon(category: string): string {
  switch (category.toUpperCase()) {
    case "LUXURY":     return "✨";
    case "BACKPACKER": return "🎒";
    case "STANDARD":   return "🎫";
    case "FAMILY":     return "🏠";
    default:           return "🏷️";
  }
}

// ---------------------------------------------------------------------------
// getStyleIcon — maps travel_style string to emoji
// ---------------------------------------------------------------------------

function getStyleIcon(travelStyle: string | null): string {
  if (!travelStyle) return "✈️";
  switch (travelStyle.toLowerCase()) {
    case "solo":      return "👤";
    case "couple":    return "👫";
    case "family":    return "👨‍👩‍👧‍👦";
    default:          return "✈️";
  }
}

function getStyleLabel(travelStyle: string | null): string {
  if (!travelStyle) return "OPEN";
  return travelStyle.toUpperCase();
}

// ---------------------------------------------------------------------------
// CategoryBadge
// Bold, coloured neon border — signals budget class at a glance.
// ---------------------------------------------------------------------------

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest px-2 py-0.5 ${getCategoryColour(label)}`}
    >
      {getCategoryIcon(label)} {label.toUpperCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StyleBadge — muted, neutral; secondary info next to CategoryBadge
// ---------------------------------------------------------------------------

function StyleBadge({ travelStyle }: { travelStyle: string | null }) {
  if (!travelStyle) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-500 px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-slate-300">
      {getStyleIcon(travelStyle)} {getStyleLabel(travelStyle)}
    </span>
  );
}
// ---------------------------------------------------------------------------
// TripCard
// ---------------------------------------------------------------------------

export default function TripCard({ trip }: { trip: Trip }) {
  const destIcon      = getDestinationIcon(trip.destination);
  const formattedBudget = `USD ${trip.budget.toLocaleString("en-US")}`;
  const formattedDate   = new Date(trip.created_at)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="bg-blue-900 border-4 border-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      {/* Left — icon box + info */}
      <div className="flex items-start gap-4">

        {/* Destination landmark icon box */}
        <div className="w-12 h-12 bg-black border-2 border-white flex items-center justify-center shrink-0 text-2xl select-none">
          {destIcon}
        </div>

        {/* Text info */}
        <div className="flex flex-col gap-2">

          {/* Destination name + landmark icon inline */}
          <h2 className="font-mono font-bold text-white uppercase tracking-wide text-base leading-none">
            {destIcon} {trip.destination}
          </h2>

          {/* Badges row — category (budget class) + travel style side by side */}
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge label={trip.category} />
            <StyleBadge travelStyle={trip.travel_style} />
          </div>

          {/* Stats row */}
          <p className="font-mono text-xs uppercase tracking-wide">
            <span className="text-green-400">{trip.days} DAYS</span>
            {" · "}
            <span className="text-yellow-400">{formattedBudget}</span>
            {" · "}
            <span className="text-slate-400">{formattedDate}</span>
          </p>

        </div>
      </div>

      {/* Right — View Details button */}
      <Link
        href={`/trips/${trip.id}`}
        className="shrink-0 bg-yellow-400 border-2 border-black text-black font-mono font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-black hover:text-yellow-400 hover:border-yellow-400 text-center"
      >
        VIEW DETAILS →
      </Link>

    </div>
  );
}
