import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Only load Geist Mono — the whole app uses font-mono (retro terminal theme).
// Removing Geist Sans eliminates the "preloaded but not used" browser warning.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:       "KelanaAI — AI Travel Planner",
  description: "Plan your next adventure with AI-powered itineraries",
  icons: {
    icon:    "/favicon.ico",
    shortcut: "/favicon.ico",
    apple:   "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
