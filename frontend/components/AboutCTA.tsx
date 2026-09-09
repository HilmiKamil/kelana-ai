"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Reads token on the client only — safe from SSR issues.
export default function AboutCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href="/"
        className="flex-1 bg-red-600 border-4 border-white text-white font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-white hover:text-red-600"
      >
        ⚔ START PLANNING
      </Link>

      {/* Only shown when not logged in */}
      {!isLoggedIn && (
        <Link
          href="/register"
          className="flex-1 bg-black border-4 border-yellow-400 text-yellow-400 font-mono font-bold text-xs uppercase tracking-widest py-3 text-center hover:bg-yellow-400 hover:text-black"
        >
          📝 CREATE ACCOUNT
        </Link>
      )}
    </div>
  );
}
