"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AskResponse {
  question:  string;
  answer:    string;
  documents: string[];
}

// ---------------------------------------------------------------------------
// Shared retro primitives (local — consistent with the rest of the project)
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
// Assistant Page
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export default function AssistantPage() {
  const [question,   setQuestion]   = useState("");
  const [result,     setResult]     = useState<AskResponse | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail ?? `Server responded with status ${res.status}`;
        throw new Error(detail);
      }

      const data: AskResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 font-mono">
      <div className="max-w-3xl w-full mx-auto px-4 lg:px-8 py-10 flex flex-col gap-8">

        {/* ── Page header ── */}
        <div>
          <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-2xl drop-shadow-md">
            🤖 TRAVEL ASSISTANT
          </h1>
          <p className="font-mono text-slate-400 text-xs uppercase tracking-widest mt-1">
            Powered by your trusted travel documents
          </p>
          <div className="mt-3">
            <AsciiDivider />
          </div>
        </div>

        {/* ── Input form ── */}
        <div className="bg-blue-900 border-4 border-white p-5">
          <SectionLabel icon="❓" title="ASK A QUESTION" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-mono text-xs text-slate-300 uppercase tracking-wide mb-1">
                YOUR QUESTION
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Can I bring medication into Japan?"
                rows={3}
                required
                className="w-full bg-black border-2 border-slate-500 text-green-400 font-mono text-sm px-3 py-2 outline-none placeholder-slate-600 focus:border-yellow-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="bg-red-600 border-4 border-white text-white font-mono font-bold text-sm py-3 uppercase tracking-widest cursor-pointer hover:bg-white hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">▓▓░░</span> ASKING...
                </span>
              ) : (
                "ASK →"
              )}
            </button>
          </form>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-900 border-2 border-red-400 text-red-300 font-mono text-xs px-4 py-3 uppercase tracking-wide">
            ⚠ ERROR: {error}
          </div>
        )}

        {/* ── Result card ── */}
        {result && (
          <div className="flex flex-col gap-4">

            {/* Question echo */}
            <div className="bg-black border-2 border-slate-600 px-4 py-3">
              <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-1">
                🔍 YOUR QUESTION
              </p>
              <p className="font-mono text-slate-300 text-sm leading-relaxed">
                {result.question}
              </p>
            </div>

            {/* AI Answer */}
            <div className="bg-blue-900 border-4 border-white p-5">
              <SectionLabel icon="💬" title="AI ANSWER" />
              <div className="font-mono text-sm text-white leading-loose whitespace-pre-wrap">
                {result.answer}
              </div>
            </div>

            {/* Source documents */}
            {result.documents.length > 0 && (
              <div className="bg-black border-2 border-slate-600 px-4 py-3">
                <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-3">
                  📄 SOURCE DOCUMENTS
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.documents.map((doc, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-slate-800 border border-slate-600 text-slate-300 font-mono text-xs px-2 py-1 uppercase tracking-wide"
                    >
                      📁 {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ask another question */}
            <button
              onClick={() => { setResult(null); setQuestion(""); }}
              className="w-full bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs py-3 uppercase tracking-widest hover:bg-yellow-400 hover:text-black cursor-pointer"
            >
              ◀ ASK ANOTHER QUESTION
            </button>

          </div>
        )}

      </div>
    </main>
  );
}
