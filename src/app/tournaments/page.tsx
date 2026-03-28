"use client";

import Tournaments from "@/components/Tournaments";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function TournamentPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tournamentView, setTournamentView] = useState<"ongoing" | "upcoming">(
    "ongoing"
  );

  useEffect(() => {
    if (tabParam === "upcoming") {
      setTournamentView("upcoming");
    } else {
      setTournamentView("ongoing");
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
          <h1 className="page-title">Valorant Tournaments</h1>
          <p className="page-subtitle">
            Schedule up for upcoming and ongoing tournaments.
          </p>
        </div>
      </div>

      <div className="content-rise stagger-2 page-tabs">
        <button
          onClick={() => setTournamentView("ongoing")}
          className={tournamentView === "ongoing" ? "btn-tab-active" : "btn-tab"}
        >
          ONGOING
        </button>
        <button
          onClick={() => setTournamentView("upcoming")}
          className={tournamentView === "upcoming" ? "btn-tab-active" : "btn-tab"}
        >
          UPCOMING
        </button>
      </div>

      <div className="content-rise stagger-3">
        <Tournaments
          pageView="tournament"
          tournamentView={tournamentView}
          setTournamentView={setTournamentView}
        />
      </div>
    </div>
  );
}
