"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Nav links definition — easy to extend later
const NAV_LINKS = [
  { href: "/",       label: "NEW QUEST",   icon: "⚔" },
  { href: "/trips",  label: "TRIP HISTORY", icon: "📜" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-black border-b-4 border-yellow-400 font-mono">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between h-14">

        {/* Logo */}
        <Link
          href="/"
          className="text-yellow-400 font-bold text-lg uppercase tracking-widest hover:text-white"
        >
          KelanaAI
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon }) => {
            // A route is "active" if the pathname matches exactly,
            // or for /trips it also covers /trips/[id]
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  inline-flex items-center gap-1.5 px-4 py-1.5
                  text-xs uppercase tracking-widest border-2 font-bold
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
        </div>

      </div>
    </nav>
  );
}
