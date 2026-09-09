"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getProfile, removeToken } from "@/services/authService";

// ---------------------------------------------------------------------------
// Nav links definition
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "/",       label: "NEW QUEST",    icon: "⚔"  },
  { href: "/trips",  label: "TRIP HISTORY", icon: "📜" },
  { href: "/chat",   label: "CHAT",         icon: "💬" },
  { href: "/profile",label: "PROFILE",      icon: "🧑" },
  { href: "/about",  label: "ABOUT",        icon: "ℹ"  },
];

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [userName,   setUserName]   = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hide everything except the logo on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // On mount: check token and fetch name (client-only — inside useEffect)
  useEffect(() => {
    if (isAuthPage) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setUserName(null);
      return;
    }

    setIsLoggedIn(true);

    getProfile(token)
      .then((profile) => setUserName(profile.name))
      .catch(() => setUserName(null));
  }, [isAuthPage, pathname]); // re-run on route change to catch post-login state

  function handleLogout() {
    removeToken();
    setUserName(null);
    setIsLoggedIn(false);
    router.push("/login");
  }

  return (
    <nav className="w-full bg-black border-b-4 border-yellow-400 font-mono">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between h-14">

        {/* Logo — always visible */}
        <Link
          href="/"
          className="text-yellow-400 font-bold text-lg uppercase tracking-widest hover:text-white shrink-0"
        >
          KelanaAI
        </Link>

        {/* ── Auth pages: show Login + Register links only ── */}
        {isAuthPage && (
          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs uppercase tracking-widest border-2 font-bold shrink-0
                ${pathname === "/login"
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : "bg-transparent border-slate-600 text-slate-400 hover:border-yellow-400 hover:text-yellow-400"
                }
              `}
            >
              🔑 <span className="hidden sm:inline">LOGIN</span>
            </Link>
            <Link
              href="/register"
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs uppercase tracking-widest border-2 font-bold shrink-0
                ${pathname === "/register"
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : "bg-transparent border-slate-600 text-slate-400 hover:border-yellow-400 hover:text-yellow-400"
                }
              `}
            >
              📝 <span className="hidden sm:inline">REGISTER</span>
            </Link>
          </div>
        )}

        {/* ── Non-auth pages, NOT logged in: show Login + About links ── */}
        {!isAuthPage && !isLoggedIn && (
          <div className="flex items-center gap-1">
            <Link
              href="/about"
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 shrink-0
                bg-transparent border-2 font-mono text-xs uppercase tracking-widest font-bold
                ${pathname === "/about"
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : "border-slate-600 text-slate-400 hover:border-yellow-400 hover:text-yellow-400"
                }
              `}
            >
              ℹ <span className="hidden sm:inline">ABOUT</span>
            </Link>
            <Link
              href="/login"
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 shrink-0
                bg-transparent border-2 border-yellow-400 text-yellow-400
                font-mono text-xs uppercase tracking-widest font-bold
                hover:bg-yellow-400 hover:text-black
              "
            >
              🔑 <span className="hidden sm:inline">LOGIN</span>
            </Link>
          </div>
        )}

        {/* ── Non-auth pages, logged in: show full nav ── */}
        {!isAuthPage && isLoggedIn && (
          <div className="flex items-center gap-1 overflow-hidden">

            {/* Welcome message */}
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

            {/* Logout button */}
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
