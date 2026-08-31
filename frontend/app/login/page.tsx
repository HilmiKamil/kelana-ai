"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, saveToken } from "@/services/authService";

// ---------------------------------------------------------------------------
// Shared retro primitive
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const inputClass =
    "w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call the auth service — throws on non-200
      const result = await login(email, password);

      // Save the JWT exactly as specified
      saveToken(result.access_token);

      // Redirect to trip history
      router.push("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-start py-12 px-4 font-mono">

      {/* Title block */}
      <div className="text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
          ✦ WELCOME BACK ✦
        </p>
        <h1 className="text-4xl font-mono font-bold text-yellow-400 uppercase tracking-widest drop-shadow-md">
          KelanaAI
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-widest mt-2">
          AUTHENTICATE TO CONTINUE YOUR QUEST
        </p>
      </div>

      <AsciiDivider />

      {/* Login dialog box */}
      <div className="w-full max-w-md bg-blue-900 border-4 border-white p-6 mt-6">

        <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">
          ▶ PLAYER LOGIN
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

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
              autoComplete="current-password"
              className={inputClass}
            />
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
            disabled={isLoading}
            className="mt-2 bg-red-600 border-4 border-white text-white font-mono font-bold text-base py-3 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-red-600 disabled:opacity-50"
          >
            {isLoading ? "AUTHENTICATING..." : "LOGIN →"}
          </button>

        </form>
      </div>

      {/* Register link */}
      <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-6">
        NO ACCOUNT YET?{" "}
        <Link
          href="/register"
          className="text-yellow-400 hover:text-white underline underline-offset-2"
        >
          REGISTER HERE
        </Link>
      </p>

    </main>
  );
}
