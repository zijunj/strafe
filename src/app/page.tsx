"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import AboutValorant from "@/components/AboutValorant";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <div className="flex items-start gap-6 xl:gap-8">
        <div className="flex-1 space-y-4">
          <div className="content-rise stagger-1 page-hero mb-0">
            <img
              src="/valorantLogo.png"
              alt="Valorant Logo"
              className="page-hero-icon"
            />
            <div className="page-hero-copy">
              <h1 className="page-title">Valorant Esports</h1>
              <p className="page-subtitle">
                Esports news, tournaments, matches, and much more.
              </p>
            </div>
          </div>

          <div className="content-rise stagger-2">
            <News newsView="featured" />
          </div>

          <div className="content-rise stagger-3 card-elevated relative">
            <div className="relative max-w-7xl">
              <Tournaments pageView="home" tournamentView="ongoing" />
            </div>
          </div>

          <div className="content-rise stagger-4">
            <AboutValorant />
          </div>
        </div>

        <div className="w-[360px] mt-[76px] space-y-4">
          <div className="content-rise stagger-3 card">
            <div className="card-header">
              <h2 className="card-title text-[var(--color-text-primary)]">
                Upcoming Valorant Matches
              </h2>
            </div>

            <Matches pageView="home" />

            <div className="card-footer text-center">
              <Link href="/matches" className="link-accent">
                All upcoming matches -&gt;
              </Link>
            </div>
          </div>

          <div className="content-rise stagger-5 card">
            <div className="card-header">
              <h2 className="card-title text-[var(--color-text-primary)]">
                Latest Valorant Results
              </h2>
            </div>

            <Results pageView="home" />

            <div className="card-footer text-center">
              <Link href="/matches?tab=finished" className="link-accent">
                All match results -&gt;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
