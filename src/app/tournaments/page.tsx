"use client";

import Tournaments from "@/components/Tournaments";
import { useState } from "react";

export default function TournamentPage() {
  const [tournamentView, setTournamentView] = useState<"ongoing" | "upcoming">(
    "ongoing"
  );

  return (
    <>
      <div className="max-w-7xl mx-auto flex items-center mb-6">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Valorant Tournaments
          </h1>
          <p className="text-gray-300">
            Schedule for ongoing and upcoming Valorant esports tournaments.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto flex space-x-2 mb-6">
        <button
          onClick={() => setTournamentView("ongoing")}
          className={`px-6 py-2 font-bold rounded-tl-md rounded-tr-md transition ${
            tournamentView === "ongoing"
              ? "bg-[#d2dc59] text-black"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          ONGOING
        </button>
        <button
          onClick={() => setTournamentView("upcoming")}
          className={`px-6 py-2 font-bold rounded-tl-md rounded-tr-md transition ${
            tournamentView === "upcoming"
              ? "bg-[#d2dc59] text-black"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          UPCOMING
        </button>
      </div>

      <Tournaments
        pageView="tournament"
        tournamentView={tournamentView}
        setTournamentView={setTournamentView} // ✅ pass this instead of setPageView
      />
    </>
  );
}
