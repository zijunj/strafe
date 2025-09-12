import useValorantApiWithCache from "../app/api/Valorant";
import React from "react";

interface MatchProps {
  matchView: string;
  setMatchView?: (view: string) => void;
}

interface MatchItem {
  match_event: string;
  team1: string;
  team2: string;
  unix_timestamp: string;
  time_until_match: string;
}

export default function Matches({ matchView }: MatchProps) {
  const { data: matchData = [], loading } = useValorantApiWithCache<
    MatchItem[]
  >({
    key: `${matchView}Matches`,
    url: `match?q=${matchView}`,
    parse: (res) => res.data.segments,
  });

  if (loading) return <p>Loading...</p>;

  return (
    <section className="max-w-7xl mx-auto">
      {(matchData ?? [])
        .sort(
          (a, b) =>
            new Date(a.unix_timestamp).getTime() -
            new Date(b.unix_timestamp).getTime()
        )
        .slice(0, 4)
        .map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2 hover:bg-[#2A2A2A] transition"
          >
            <div>
              <div className="text-xs text-gray-400 mb-1">
                {item.match_event}
              </div>
              <div className="text-white font-semibold text-sm">
                {item.team1} vs {item.team2}
              </div>
            </div>
            <div className="text-right text-gray-400 text-xs">
              <div>{item.time_until_match?.replace("from now", "").trim()}</div>
            </div>
          </div>
        ))}
    </section>
  );
}
