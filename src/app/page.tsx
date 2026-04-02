"use client";

import Matches from "@/components/Matches";
import Tournaments from "@/components/Tournaments";
import News from "@/components/News";
import Results from "@/components/Results";
import AboutValorant from "@/components/AboutValorant";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[100rem] px-5 pb-10">
      <div className="flex items-start gap-5 xl:gap-6">
        <div className="min-w-0 max-w-[926px] flex-1 space-y-4">
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
            <Matches pageView="home-live" />
          </div>

          <div className="content-rise stagger-3">
            <News newsView="featured" />
          </div>

          <div className="content-rise stagger-4 relative">
            <div className="relative">
              <Tournaments pageView="home" tournamentView="ongoing" />
            </div>
          </div>

          <div className="content-rise stagger-5">
            <AboutValorant />
          </div>
        </div>

        <div className="mt-[76px] w-[360px] space-y-4">
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
