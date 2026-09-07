"use client";

import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// LogoutButton
//
// Stateless logout — no API call needed because the backend uses JWTs.
// Removing the token from localStorage is sufficient to de-authenticate
// the client; the token will expire server-side on its own schedule.
// ---------------------------------------------------------------------------

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    // Remove the stored JWT — the user is now unauthenticated client-side
    localStorage.removeItem("token");

    // Redirect to login screen
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="
        inline-flex items-center gap-1.5 px-4 py-1.5
        bg-transparent border-2 border-red-500 text-red-400
        font-mono text-xs uppercase tracking-widest font-bold
        hover:bg-red-600 hover:border-red-600 hover:text-white
        cursor-pointer
      "
    >
      ⏻ LOGOUT
    </button>
  );
}
