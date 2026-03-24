"use client";

import News from "@/components/News";
import Tournaments from "@/components/Tournaments";
import Matches from "@/components/Matches";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* 🏷️ Header */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mb-6">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Valorant Esports News
          </h1>
          <p className="text-sm text-gray-400">Read up on the latest news.</p>
        </div>
      </div>

      {/* 📄 Content */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* LEFT COLUMN: Featured + Normal news */}
        <div className="flex-1 space-y-5">
          {/* ⭐ Featured news */}
          <News newsView="featured" />

          {/* 📰 Normal news grid */}
          <News newsView="normal" />
        </div>

        {/* 📅 RIGHT COLUMN: Sidebar with tournaments + upcoming matches */}
        <aside className="w-full lg:w-[300px] flex flex-col gap-6 h-fit">
          {/* 🏆 Tournaments section */}
          <Tournaments pageView="news" tournamentView="ongoing" />

          {/* 🔥 Upcoming Matches section */}
          <div className="bg-[#1E1E1E] rounded-lg border border-[#2a2a2a] ring-1 ring-[#2E2E2E]">
            <h2 className="text-sm font-bold text-white mb-2 px-4 pt-4">
              UPCOMING MATCHES
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
        </aside>
      </div>
    </div>
  );
}
