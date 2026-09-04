"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getProfile, removeToken } from "@/services/authService";

// ---------------------------------------------------------------------------
// Nav links definition
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "/",          label: "NEW QUEST",    icon: "⚔"  },
  { href: "/trips",     label: "TRIP HISTORY", icon: "📜" },
  { href: "/chat",      label: "CHAT",         icon: "💬" },
  { href: "/profile",   label: "PROFILE",      icon: "🧑" },
];

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [userName, setUserName] = useState<string | null>(null);

  // Hide nav links and the welcome message on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Fetch the user's name once on mount (client-only — inside useEffect)
  useEffect(() => {
    if (isAuthPage) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    getProfile(token)
      .then((profile) => setUserName(profile.name))
      .catch(() => {
        // Token invalid / expired — clear silently; the page itself will
        // handle the redirect to /login if a protected fetch also fails.
        setUserName(null);
      });
  }, [isAuthPage]);

  function handleLogout() {
    removeToken();           // clears localStorage "token"
    setUserName(null);       // clears the welcome message immediately
    router.push("/login");
  }

  return (
    <nav className="w-full bg-black border-b-4 border-yellow-400 font-mono">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between h-14">

        {/* Logo */}
        <Link
          href="/"
          className="text-yellow-400 font-bold text-lg uppercase tracking-widest hover:text-white shrink-0"
        >
          KelanaAI
        </Link>

        {/* Right-hand side — hidden on auth pages */}
        {!isAuthPage && (
          <div className="flex items-center gap-1 overflow-hidden">

            {/* Welcome message — shown only when name is loaded */}
            {userName && (
              <span className="hidden md:inline font-mono text-xs text-slate-400 uppercase tracking-widest mr-2 truncate max-w-[180px]">
                Welcome back, {userName} 👋
              </span>
            )}

            {/* Nav links */}
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5
                    text-xs uppercase tracking-widest border-2 font-bold shrink-0
                    transition-colors
                    ${isActive
                      ? "bg-yellow-400 border-yellow-400 text-black"
                      : "bg-transparent border-slate-600 text-slate-400 hover:border-yellow-400 hover:text-yellow-400"
                    }
                  `}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Logout button — clears name state alongside token */}
            <button
              onClick={handleLogout}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 shrink-0
                bg-transparent border-2 border-red-500 text-red-400
                font-mono text-xs uppercase tracking-widest font-bold
                hover:bg-red-600 hover:border-red-600 hover:text-white
                cursor-pointer
              "
            >
              ⏻ <span className="hidden sm:inline">LOGOUT</span>
            </button>

          </div>
        )}

      </div>
    </nav>
  );
}
