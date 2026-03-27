"use client";

import Matches from "@/components/Matches";
import Results from "@/components/Results";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function MatchesPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [matchView, setMatchView] = useState("upcoming");

  useEffect(() => {
    if (tabParam === "finished") {
      setMatchView("finished");
    } else {
      setMatchView("upcoming");
    }
  }, [tabParam]);

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

      <div className="content-rise stagger-3">
        {matchView === "upcoming" ? (
          <Matches pageView="match" />
        ) : (
          <Results pageView="match" />
        )}
      </div>
    </div>
  );
}
