import Link from "next/link";

// ---------------------------------------------------------------------------
// 404 — Page Not Found
// Rendered automatically by Next.js App Router for unknown routes.
// ---------------------------------------------------------------------------

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-900 font-mono flex flex-col items-center justify-center px-4">

      <div className="w-full max-w-md text-center">

        {/* Glitch header */}
        <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest mb-4 animate-pulse">
          ⚠ SYSTEM ERROR
        </p>

        <div className="bg-blue-900 border-4 border-white p-8 mb-6">
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mb-2">
            ERROR CODE
          </p>
          <h1 className="font-mono font-bold text-yellow-400 text-7xl tracking-widest drop-shadow-md">
            404
          </h1>
          <p className="font-mono text-white text-sm uppercase tracking-widest mt-4">
            QUEST NOT FOUND
          </p>
          <p className="font-mono text-slate-400 text-xs mt-2">
            THE PAGE YOU ARE LOOKING FOR DOES NOT EXIST
            <br />OR HAS BEEN MOVED TO ANOTHER REALM.
          </p>
        </div>

        {/* ASCII art divider */}
        <p className="font-mono text-blue-400 text-xs tracking-widest mb-6 overflow-hidden select-none">
          {"================================"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-red-600"
          >
            ◀ RETURN TO TITLE
          </Link>
          <Link
            href="/trips"
            className="bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-yellow-400 hover:text-black"
          >
            📜 MY TRIPS
          </Link>
        </div>

      </div>

    </main>
  );
}
