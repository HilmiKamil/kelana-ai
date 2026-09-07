"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/services/authService";

// ---------------------------------------------------------------------------
// Shared retro primitives (local)
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Register Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Shared input class — identical to login page and main form
  const inputClass =
    "w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(name, email, password);
      // 201 Created — redirect to login so the user can authenticate
      router.push("/login");
    } catch (err: any) {
      setError(err.message ?? "Could not connect to the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-start py-12 px-4 font-mono">

      {/* Title block */}
      <div className="text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
          ✦ CREATE YOUR ACCOUNT ✦
        </p>
        <h1 className="text-4xl font-mono font-bold text-yellow-400 uppercase tracking-widest drop-shadow-md">
          KelanaAI
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">
          REGISTER TO BEGIN YOUR ADVENTURE
        </p>
      </div>

      <AsciiDivider />

      {/* Register dialog box */}
      <div className="w-full max-w-md bg-blue-900 border-4 border-white p-6 mt-6">

        <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">
          ▶ NEW PLAYER REGISTRATION
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name */}
          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              🧑 PLAYER NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="YOUR NAME"
              required
              autoComplete="name"
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              📧 EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="PLAYER@EMAIL.COM"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
              🔑 PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="font-mono text-slate-600 text-xs mt-1 uppercase tracking-wide">
              MIN. 8 CHARACTERS
            </p>
          </div>

          {/* Error box */}
          {error && (
            <div className="bg-red-900 border-2 border-red-400 text-red-300 font-mono text-xs px-4 py-3 uppercase tracking-wide">
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-red-600 border-4 border-white text-white font-mono font-bold text-base py-3 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-red-600 disabled:opacity-50"
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT →"}
          </button>

        </form>
      </div>

      {/* Login link */}
      <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-6">
        ALREADY HAVE AN ACCOUNT?{" "}
        <Link
          href="/login"
          className="text-yellow-400 hover:text-white underline underline-offset-2"
        >
          LOGIN HERE
        </Link>
      </p>

    </main>
  );
}
