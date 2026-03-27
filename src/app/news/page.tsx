"use client";

import News from "@/components/News";
import Tournaments from "@/components/Tournaments";
import Matches from "@/components/Matches";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="page-shell">
      <div className="content-rise stagger-1 page-hero">
        <img
          src="/valorantLogo.png"
          alt="Valorant Logo"
          className="page-hero-icon"
        />
        <div className="page-hero-copy">
          <h1 className="page-title">Valorant Esports News</h1>
          <p className="page-subtitle">Read up on the latest news.</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="flex-1 space-y-5">
          <div className="content-rise stagger-2">
            <News newsView="featured" />
          </div>
          <div className="content-rise stagger-3">
            <News newsView="normal" />
          </div>
        </div>

        <aside className="flex h-fit w-full flex-col gap-6 lg:w-[300px]">
          <div className="content-rise stagger-3">
            <Tournaments pageView="news" tournamentView="ongoing" />
          </div>

          <div className="content-rise stagger-4 card">
            <div className="card-header">
              <h2 className="card-title text-[var(--color-text-primary)]">
                Upcoming Matches
              </h2>
            </div>

            <Matches pageView="home" />

            <div className="card-footer text-center">
              <Link href="/matches" className="link-accent">
                All upcoming matches -&gt;
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
