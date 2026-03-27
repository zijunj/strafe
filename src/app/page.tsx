"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import AboutValorant from "@/components/AboutValorant";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto flex items-start gap-6">
      {/* Left Column */}
      <div className="flex-1 space-y-4">
        {/* Logo + Intro */}
        <div className="content-rise stagger-1 flex items-center gap-4">
          <img
            src="/valorantLogo.png"
            alt="Valorant Logo"
            className="h-[48px]"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Valorant Esports
            </h1>
            <p className="text-sm text-gray-400">
              Esports news, tournaments, matches, and much more.
            </p>
          </div>
        </div>

        {/* News Card */}
        <div className="content-rise stagger-2">
          <News newsView="featured" />
        </div>

        {/* Tournament Card */}
        <div className="content-rise stagger-3 relative bg-[#151515] rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700">
          <div className="relative max-w-7xl">
            <Tournaments pageView="home" tournamentView="ongoing" />
          </div>
        </div>

        {/* About Valorant Section */}
        <div className="content-rise stagger-4">
          <AboutValorant />
        </div>
      </div>

      {/* Right Column: Matches and Results */}
      <div className="w-[360px] mt-[70px] space-y-4">
        {/* Upcoming Matches Card */}
        <div className="content-rise stagger-3 bg-[#1E1E1E] rounded-lg border border-[#2e2e2e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2e2e2e]">
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Upcoming Valorant Matches
            </h2>
          </div>

          {/* Matches List */}
          <Matches pageView="home" />

          {/* Footer Link */}
          <div className="text-center border-t border-[#2e2e2e]">
            <Link
              href="/matches"
              className="block py-2.5 text-[#FFE44F] text-xs font-semibold hover:underline"
            >
              All upcoming matches →
            </Link>
          </div>
        </div>

        {/* Latest Results Card */}
        <div className="content-rise stagger-5 bg-[#1E1E1E] rounded-lg border border-[#2e2e2e] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2e2e2e]">
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Latest Valorant Results
            </h2>
          </div>
          <Results pageView="home" />
          <div className="text-center border-t border-[#2e2e2e]">
            <Link
              href="/matches?tab=finished"
              className="block py-2.5 text-[#FFE44F] text-xs font-semibold hover:underline"
            >
              All match results →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
