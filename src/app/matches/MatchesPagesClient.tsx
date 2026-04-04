"use client";

import Matches from "@/components/Matches";
import Results from "@/components/Results";
import useValorantApiWithCache from "../api/Valorant";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface TournamentItem {
  title: string;
  tier?: number | null;
  status: string;
}

export default function MatchesPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [matchView, setMatchView] = useState("upcoming");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");

  const { data: tournamentData = [] } = useValorantApiWithCache<TournamentItem[]>({
    key: "matches-major-filters",
    url: "storage/events?limit=300&backgroundSync=0",
    parse: (res) => res.data.segments,
  });

  const majorTournaments = tournamentData.filter(
    (item) => item.tier === 1 && item.status === "ongoing",
  );

  useEffect(() => {
    if (tabParam === "finished") {
      setMatchView("finished");
    } else {
      setMatchView("upcoming");
    }
  }, [tabParam]);

  useEffect(() => {
    setSelectedTournament("all");
  }, [matchView]);

  return (
    <div className="page-shell">
      <div className="content-rise stagger-1 page-hero">
        <img
          src="/valorantLogo.png"
          alt="Valorant Logo"
          className="page-hero-icon"
        />
        <div className="page-hero-copy">
          <h1 className="page-title">
            {matchView === "upcoming"
              ? "Upcoming Valorant Matches"
              : "Recent Valorant Results"}
          </h1>
          <p className="page-subtitle">
            {matchView === "upcoming"
              ? "Schedule for upcoming Valorant esports matches."
              : "Recent completed Valorant esports matches."}
          </p>
        </div>
      </div>

      <div className="content-rise stagger-2 page-tabs">
        <button
          onClick={() => setMatchView("upcoming")}
          className={matchView === "upcoming" ? "btn-tab-active" : "btn-tab"}
        >
          UPCOMING
        </button>
        <button
          onClick={() => setMatchView("finished")}
          className={matchView === "finished" ? "btn-tab-active" : "btn-tab"}
        >
          FINISHED
        </button>
      </div>

      {majorTournaments.length > 0 ? (
        <div className="content-rise stagger-3 mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
            Popular Filters:
          </span>
          {majorTournaments.map((tournament) => {
            const isActive = selectedTournament === tournament.title;

            return (
              <button
                key={tournament.title}
                type="button"
                onClick={() =>
                  setSelectedTournament((current) =>
                    current === tournament.title ? "all" : tournament.title,
                  )
                }
                className={
                  isActive
                    ? "rounded-full bg-[var(--color-primary)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-black"
                    : "rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-[var(--color-text-primary)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-surface)]"
                }
              >
                {tournament.title}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="content-rise stagger-3">
        {matchView === "upcoming" ? (
          <Matches
            pageView="match"
            selectedTournament={
              selectedTournament === "all" ? undefined : selectedTournament
            }
          />
        ) : (
          <Results
            pageView="match"
            selectedTournament={
              selectedTournament === "all" ? undefined : selectedTournament
            }
          />
        )}
      </div>
    </div>
  );
}
