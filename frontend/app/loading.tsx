// ---------------------------------------------------------------------------
// Global loading.tsx
// Next.js App Router shows this automatically while a page segment is
// streaming / suspending (e.g. during Server Component data fetching).
// Uses the shared RetroLoader component so the look is consistent.
// ---------------------------------------------------------------------------

import RetroLoader from "@/components/RetroLoader";

export default function GlobalLoading() {
  return <RetroLoader label="LOADING..." />;
}
