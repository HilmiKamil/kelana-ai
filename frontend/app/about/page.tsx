import Link from "next/link";

// ---------------------------------------------------------------------------
// About Page — /about
// Static Server Component — no client-side JS needed.
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

const FEATURES = [
  { icon: "🗺",  label: "AI Trip Planner",       desc: "Generate full multi-day itineraries with Amazon Bedrock Nova." },
  { icon: "💬",  label: "Travel Chat",            desc: "Conversational AI assistant with persistent memory per session." },
  { icon: "📚",  label: "Knowledge Base (RAG)",   desc: "Answers grounded in your uploaded travel documents via Bedrock KB." },
  { icon: "📜",  label: "Trip History",           desc: "Save, browse, filter, and revisit past itineraries." },
  { icon: "🔐",  label: "Secure Auth",            desc: "JWT-based stateless authentication with bcrypt password hashing." },
];

const TECH_STACK = [
  { layer: "FRONTEND",  items: "Next.js 15, TypeScript, Tailwind CSS v4, React" },
  { layer: "BACKEND",   items: "FastAPI, Python 3.12, SQLAlchemy, PostgreSQL" },
  { layer: "AI / AWS",  items: "Amazon Bedrock (Nova Lite), Bedrock Knowledge Base" },
  { layer: "AUTH",      items: "JWT (python-jose), bcrypt, HTTP Bearer tokens" },
  { layer: "DEPLOY",    items: "Render (backend) · Vercel (frontend) · Neon (DB)" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900 font-mono">
      <div className="max-w-3xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col gap-10">

        {/* ── Hero header ── */}
        <div>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-2">
            ✦ ABOUT THIS PROJECT ✦
          </p>
          <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-3xl drop-shadow-md">
            KelanaAI
          </h1>
          <p className="font-mono text-slate-400 text-sm mt-2 leading-relaxed">
            AN AI-POWERED TRAVEL PLANNING APPLICATION BUILT WITH AMAZON BEDROCK,
            NEXT.JS, AND FASTAPI.
          </p>
          <div className="mt-4">
            <AsciiDivider />
          </div>
        </div>

        {/* ── What is KelanaAI ── */}
        <div className="bg-blue-900 border-4 border-white p-5">
          <SectionLabel icon="📖" title="WHAT IS KELANAAI?" />
          <p className="font-mono text-sm text-white leading-loose">
            KelanaAI is a full-stack AI travel assistant that helps you plan trips,
            chat with a travel-savvy AI, and explore destination-specific recommendations
            — all powered by AWS Bedrock foundation models.
          </p>
          <p className="font-mono text-sm text-white leading-loose mt-3">
            The name <span className="text-yellow-300 font-bold">Kelana</span> comes
            from Bahasa Indonesia, meaning <span className="text-yellow-300 font-bold">
            "wanderer"</span> or <span className="text-yellow-300 font-bold">"traveller"
            </span> — someone who journeys freely and with purpose.
          </p>
        </div>

        {/* ── Features ── */}
        <div>
          <SectionLabel icon="⚔" title="FEATURES" />
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="bg-blue-900 border-4 border-white p-4">
                <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold mb-1">
                  {icon} {label}
                </p>
                <p className="font-mono text-sm text-white leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech stack ── */}
        <div>
          <SectionLabel icon="🛠" title="TECH STACK" />
          <div className="bg-blue-900 border-4 border-white p-4">
            <div className="flex flex-col gap-3">
              {TECH_STACK.map(({ layer, items }) => (
                <div key={layer} className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-1 sm:gap-3">
                  <span className="font-mono text-xs text-yellow-400 uppercase tracking-widest font-bold pt-0.5">
                    {layer}
                  </span>
                  <span className="font-mono text-sm text-white leading-relaxed">
                    {items}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-white hover:text-red-600"
          >
            ⚔ START PLANNING
          </Link>
          <Link
            href="/register"
            className="flex-1 bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-yellow-400 hover:text-black"
          >
            📝 CREATE ACCOUNT
          </Link>
        </div>

      </div>
    </main>
  );
}
