import Matches from "../components/Matches";
import { useState } from "react";
export default function MatchPage() {
  const [matchView, setMatchView] = useState("upcoming");
  return (
    <>
      <div className="max-w-7xl mx-auto flex items-center">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight ">
            Upcoming Valorant Matches
          </h1>
          <p className="text-sm text-gray-400">
            Schedule for upcoming Valorant esports matches.
          </p>
        </div>
      </div>
      <Matches matchView={matchView} setMatchView={setMatchView} />
    </>
  );
}
