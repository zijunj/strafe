"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto flex items-start gap-6">
      {/* Left Column */}
      <div className="flex-1 space-y-4">
        {/* Logo + Intro */}
        <div className="flex items-center gap-4">
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
        <News newsView="featured" />

        {/* Tournament Card */}
        <div className="relative bg-[#151515] rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700">
          <div className="relative max-w-7xl">
            <Tournaments pageView="home" tournamentView="ongoing" />
          </div>
        </div>
      </div>

      {/* Right Column: Matches and Results */}
      <div className="w-[320px] mt-[70px] space-y-6">
        <div className="bg-[#1E1E1E] rounded-lg border border-[#3c3c3c] ring-1 ring-[#2E2E2E]">
          <h2 className="text-sm font-bold text-white mb-2 px-4 pt-4 py-4">
            UPCOMING VALORANT MATCHES
          </h2>

          {/* Matches List */}
          <Matches pageView="home" />

          {/* Footer Link */}
          <div className="text-center">
            <Link
              href="/matches"
              className="block pb-3 text-[#FFE44F] text-xs font-bold tracking-wide hover:underline"
            >
              ALL UPCOMING MATCHES →
            </Link>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg border border-[#151515] ring-1 ring-stone-700">
          <h2 className="text-m font-bold text-white mb-2 p-4">
            LATEST VALORANT RESULTS
          </h2>
          <Results pageView="home" />
          <div className="border-t border-[#2e2e2e] text-center">
            <Link
              href="/matches?tab=finished"
              className="block py-2 text-yellow-300 text-sm font-semibold hover:underline"
            >
              ALL MATCH RESULTS →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
