"use client";

import { useState } from "react";
import useValorantApiWithCache from "../app/api/Valorant";
import { askOpenAI } from "../app/api/openAi";

// Define the expected shape of one player's stat entry
interface PlayerStats {
  player: string;
  org: string;
  rating: number;
  average_combat_score: number;
  kill_deaths: string;
  kill_assists_survived_traded: string;
  average_damage_per_round: number;
  kills_per_round: number;
  assists_per_round: number;
  first_kills_per_round: number;
  first_deaths_per_round: number;
  headshot_percentage: string;
  clutch_success_percentage: string;
}

interface StatsProps {
  filters: {
    region: string;
    timespan: string;
  };
}

export default function Stats({ filters }: StatsProps) {
  const cacheKey = `stats-${filters.region}-${filters.timespan}`;
  const { data: statsData = [], loading } = useValorantApiWithCache<
    PlayerStats[]
  >({
    key: cacheKey,
    url: `stats?region=${filters.region}&timespan=${filters.timespan}`,
    parse: (res) => res.data?.segments || [],
  });

  console.log(statsData);
  const [userQuery, setUserQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const handleQuerySubmit = async () => {
    const systemPrompt = `
You are an assistant that analyzes Valorant player statistics from JSON data.
The data includes metrics like rating, acs, k/d, adr, headshot%, clutch%.
Answer the user's question using the following data:
${JSON.stringify(statsData.slice(0, 5), null, 2)}.
Only use this data — do not make up anything.
Answer clearly in simple terms.
`;

    const response = await askOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ]);

    setAiResponse(response);
  };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Top Player Stats</h1>

      {/* Natural Language Query Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Ask a question (e.g. Who has the highest K/D?)"
          className="p-2 w-full bg-gray-800 text-white rounded"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleQuerySubmit}
        >
          Ask AI
        </button>
        {aiResponse && (
          <div className="mt-4 p-4 bg-gray-700 text-white rounded">
            {aiResponse}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {statsData.slice(0, 5).map((item, i) => (
          <article
            key={i}
            className="bg-gray-800 text-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold mb-2">
              {item.player}{" "}
              <span className="text-sm text-gray-400">({item.org})</span>
            </h2>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Rating: {item.rating}</li>
              <li>ACS: {item.average_combat_score}</li>
              <li>K/D: {item.kill_deaths}</li>
              <li>KAST: {item.kill_assists_survived_traded}</li>
              <li>ADR: {item.average_damage_per_round}</li>
              <li>Kills/Round: {item.kills_per_round}</li>
              <li>Assists/Round: {item.assists_per_round}</li>
              <li>First Kills/Round: {item.first_kills_per_round}</li>
              <li>First Deaths/Round: {item.first_deaths_per_round}</li>
              <li>HS%: {item.headshot_percentage}</li>
              <li>Clutch %: {item.clutch_success_percentage}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
