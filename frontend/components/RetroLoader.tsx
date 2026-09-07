// ---------------------------------------------------------------------------
// RetroLoader
// Reusable full-screen loading indicator in the retro terminal style.
// Used by:
//   - app/loading.tsx   (Next.js global Suspense boundary)
//   - Any client page that needs a loading state
//
// Props:
//   label   — optional status text (default "LOADING...")
//   subtext — optional second line (e.g. destination name)
// ---------------------------------------------------------------------------

interface RetroLoaderProps {
  label?:   string;
  subtext?: string;
}

export default function RetroLoader({
  label   = "LOADING...",
  subtext,
}: RetroLoaderProps) {
  return (
    <main className="min-h-screen bg-slate-900 font-mono flex flex-col items-center justify-center px-4">

      {/* Pixel spinner */}
      <div className="text-yellow-400 text-4xl mb-6 animate-pulse select-none">
        [ ▓▓▓░░░ ]
      </div>

      {/* App name */}
      <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-2xl mb-1">
        KelanaAI
      </h1>

      {/* ASCII divider */}
      <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none mb-4">
        {"================================"}
      </p>

      {/* Status label */}
      <p className="font-mono text-white text-sm uppercase tracking-widest">
        {label}
      </p>

      {/* Optional subtext — e.g. destination name */}
      {subtext && (
        <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mt-1">
          {subtext}
        </p>
      )}

    </main>
  );
}
