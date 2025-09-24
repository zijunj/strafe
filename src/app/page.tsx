"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type NewsImg = {
  img: string;
};

export default function HomePage() {
  const [articleImg, setArticleImg] = useState<NewsImg | null>(null);

  useEffect(() => {
    const fetchNewsImg = async () => {
      const res = await fetch("/api/newsImg");
      const data = await res.json();
      setArticleImg(data.articles[0]);
    };

    fetchNewsImg();
  }, []);

  return (
    <div className="max-w-7xl mx-auto flex items-start gap-6">
      {/* Left Column */}
      <div className="flex-1 space-y-5">
        {/* Logo + Intro */}
        <div className="flex items-center gap-4">
          <Image
            src="/valorantLogo.png"
            alt="Valorant Logo"
            width={0}
            height={0}
            sizes="100vw"
            className="w-12 h-12 object-contain"
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
          <div className="relative h-[310px] w-full overflow-hidden">
            {articleImg && (
              <div
                className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 ease-in-out scale-100 group-hover:scale-105 group-hover:brightness-110"
                style={{ backgroundImage: `url(${articleImg.img})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151515]" />
          </div>
          <div className="relative -mt-30 px-6">
            <News />
          </div>
        </div>

        {/* Tournament Card */}
        <div className="relative bg-[#151515] rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700">
          <div className="relative max-w-7xl">
            <Tournaments pageView="home" tournamentView="ongoing" />
          </div>
        </div>
      </div>

      {/* Right Column: Matches and Results */}
      <div className="w-[320px] mt-[80px] space-y-6">
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
