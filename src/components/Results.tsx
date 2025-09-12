"use client";

import useValorantApiWithCache from "../app/api/Valorant";

// Type definition for result data
interface MatchResult {
  tournament_name: string;
  team1: string;
  team2: string;
  time_completed: string;
}

export default function Results() {
  const { data: resultData, loading } = useValorantApiWithCache<MatchResult[]>({
    key: "results",
    url: `match?q=results`,
    parse: (res) => res.data?.segments || [],
  });

  if (loading) return <p className="text-white">Loading...</p>;
  if (!resultData || resultData.length === 0)
    return <p className="text-white">No results found.</p>;

  return (
    <section className="max-w-7xl mx-auto">
      {resultData.slice(0, 4).map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-4 py-2 hover:bg-[#2A2A2A] transition"
        >
          <div>
            <div className="text-xs text-gray-400 mb-1">
              {item.tournament_name}
            </div>
            <div className="text-white font-semibold text-sm">
              {item.team1} vs {item.team2}
            </div>
          </div>
          <div className="text-right text-gray-400 text-xs">
            <div>{item.time_completed.replace("ago", "").trim()}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
