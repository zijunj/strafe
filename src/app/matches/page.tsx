"use client";
import Matches from "@/components/Matches";
import Results from "@/components/Results";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function MatchPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [matchView, setMatchView] = useState("upcoming");

  // Sync default tab from query param on mount
  useEffect(() => {
    if (tabParam === "finished") {
      setMatchView("finished");
    } else {
      setMatchView("upcoming");
    }
  }, [tabParam]);

  return (
    <>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center gap-4 mb-6">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Upcoming Valorant Matches
          </h1>
          <p className="text-sm text-gray-400">
            Schedule for upcoming Valorant esports matches.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto flex space-x-2 mb-6">
        <button
          onClick={() => setMatchView("upcoming")}
          className={`px-6 py-2 font-bold rounded-tl-md rounded-tr-md transition ${
            matchView === "upcoming"
              ? "bg-[#d2dc59] text-black"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          UPCOMING
        </button>
        <button
          onClick={() => setMatchView("finished")}
          className={`px-6 py-2 font-bold rounded-tl-md rounded-tr-md transition ${
            matchView === "finished"
              ? "bg-[#d2dc59] text-black"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          }`}
        >
          FINISHED
        </button>
      </div>

      {/* Matches */}
      {matchView === "upcoming" ? (
        <Matches pageView="match" />
      ) : (
        <Results pageView="match" />
      )}
    </>
  );
}
