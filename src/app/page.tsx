"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto flex items-start gap-6">
      {/* Left Column */}
      <div className="flex-1 space-y-5">
        {/* Logo + Intro */}
        <div className="flex items-center gap-4">
          <Image
            src="/valorantLogo.png"
            alt="Valorant Logo"
            width={48}
            height={48}
          />
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Valorant Esports
            </h1>
            <p className="text-gray-300">
              Esports news, tournaments, matches, and much more.
            </p>
          </div>
        </div>

        {/* News Card */}
        <div className="relative bg-[#151515] h-[366px] w-full rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700 group">
          <div className="relative h-[250px] w-full overflow-hidden">
            <div className="absolute inset-0 bg-[url('/news.png')] bg-center bg-no-repeat bg-cover transition-transform duration-500 ease-in-out scale-100 group-hover:scale-105 group-hover:brightness-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151515]" />
          </div>
          <div className="relative -mt-20 px-6">
            <News />
          </div>
        </div>

        {/* Tournament Card */}
        <div className="relative bg-[#151515] h-[187px] w-full rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700">
          <div className="relative max-w-7xl">
            <Tournaments />
          </div>
        </div>
      </div>

      {/* Right Column: Matches and Results */}
      <div className="w-[320px] mt-[80px] space-y-6">
        <div className="bg-[#1E1E1E] rounded-lg border border-[#151515] ring-1 ring-stone-700">
          <h2 className="text-m font-bold text-white mb-2 p-4">
            UPCOMING VALORANT MATCHES
          </h2>
          <Matches matchView="upcoming" />
          <div className="border-t border-[#2e2e2e] text-center">
            <Link
              href="/matches"
              className="block py-2 text-yellow-300 text-sm font-semibold hover:underline"
            >
              ALL UPCOMING MATCHES →
            </Link>
          </div>
        </div>

        <div className="bg-[#1E1E1E] rounded-lg border border-[#151515] ring-1 ring-stone-700">
          <h2 className="text-m font-bold text-white mb-2 p-4">
            LATEST VALORANT MATCHES
          </h2>
          <Results />
          <div className="border-t border-[#2e2e2e] text-center">
            <Link
              href="/matches"
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
