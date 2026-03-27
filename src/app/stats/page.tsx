"use client";

import FilterPanel from "@/components/FilterPanel";
import Stats from "@/components/Stats";
import { useState } from "react";

export default function StatsPage() {
  const [filters, setFilters] = useState({
    eventSeries: "All",
    region: "na",
    minRounds: 200,
    minRating: 1550,
    agent: "All",
    map: "All",
    timespan: "30",
  });

  return (
    <div className="page-shell page-stack">
      <div className="content-rise stagger-1 page-hero">
        <img
          src="/valorantLogo.png"
          alt="Valorant Logo"
          className="page-hero-icon"
        />
        <div className="page-hero-copy">
          <h1 className="page-title">Valorant Player Stats</h1>
          <p className="page-subtitle">
            Explore leaderboard-style player stats with filters for region,
            agent, rounds, and timespan.
          </p>
        </div>
      </div>

      <div className="content-rise stagger-2">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onApply={() => console.log(filters)}
        />
      </div>
      <div className="content-rise stagger-3">
        <Stats filters={filters} />
      </div>
    </div>
  );
}
