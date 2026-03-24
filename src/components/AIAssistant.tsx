"use client";

import { useMemo, useState } from "react";
import useValorantApiWithCache from "../app/api/Valorant";
import { askOpenAI } from "../app/api/openAi";

interface PlayerStats {
  player: string;
  org: string;
  rating: number;
  average_combat_score: number;
  kill_deaths: string;
  kill_assists_survived_traded: string;
  average_damage_per_round: number;
  headshot_percentage: string;
  clutch_success_percentage: string;
  agents: string[];
  rounds_played: number;
}

const suggestedQuestions = [
  "Who looks like the strongest player right now?",
  "Which player has the best rating and ACS combination?",
  "Summarize the top players in simple terms.",
];

export default function AIAssistant() {
  const [userQuery, setUserQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const { data: statsData = [], loading } = useValorantApiWithCache<
    PlayerStats[]
  >({
    key: "ai-assistant-stats-na-30-1550",
    url: "stats?region=na&timespan=30&min_opponent_rating=1550",
    parse: (res) => res.data?.segments || [],
  });

  const statSnapshot = useMemo(
    () =>
      statsData.slice(0, 10).map((player) => ({
        player: player.player,
        org: player.org,
        rating: player.rating,
        acs: player.average_combat_score,
        kd: player.kill_deaths,
        kast: player.kill_assists_survived_traded,
        adr: player.average_damage_per_round,
        headshotPercentage: player.headshot_percentage,
        clutchSuccessPercentage: player.clutch_success_percentage,
        agents: player.agents,
        roundsPlayed: player.rounds_played,
      })),
    [statsData]
  );

  const handleAsk = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? userQuery).trim();

    if (!prompt) {
      return;
    }

    setUserQuery(prompt);
    setIsAsking(true);

    const systemPrompt = `
You are a Valorant esports stats assistant.
Use only the player snapshot provided below.
Do not invent stats, rankings, teams, or comparisons that are not supported by the data.
If the answer cannot be determined from the data, say that clearly.
Keep answers short, direct, and easy to understand.

Player snapshot:
${JSON.stringify(statSnapshot, null, 2)}
`;

    try {
      const response = await askOpenAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]);

      setAiResponse(response);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="bg-[#1E1E1E] rounded-xl border border-[#2f2f2f] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#2f2f2f]">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#FFE44F] uppercase">
          AI Assistant
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-white">
          Ask questions about current Valorant player form
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-3xl">
          This assistant uses a live snapshot of top player stats from the last
          30 days in North America against a minimum opponent rating of 1550.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => handleAsk(question)}
              className="rounded-lg border border-[#3a3a3a] bg-[#242424] px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:border-[#FFE44F] hover:text-white"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label
            htmlFor="ai-question"
            className="block text-sm font-semibold text-white"
          >
            Your question
          </label>
          <textarea
            id="ai-question"
            rows={4}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask something like: Which player looks the most efficient?"
            className="w-full rounded-lg border border-[#3a3a3a] bg-[#151515] px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#FFE44F]"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={loading || isAsking}
            className="rounded-lg bg-[#FFE44F] px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAsking ? "Thinking..." : loading ? "Loading stats..." : "Ask AI"}
          </button>
        </div>

        <div className="rounded-xl border border-[#2f2f2f] bg-[#151515] p-5">
          <p className="text-xs font-extrabold tracking-[0.2em] text-gray-400 uppercase">
            Response
          </p>
          <div className="mt-3 min-h-28 text-sm leading-7 text-gray-200">
            {aiResponse || (
              <span className="text-gray-500">
                Ask a question to get a quick AI read on the available stats.
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {statSnapshot.slice(0, 4).map((player) => (
            <article
              key={player.player}
              className="rounded-lg border border-[#2f2f2f] bg-[#242424] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {player.player}
                  </h3>
                  <p className="text-sm text-gray-400">{player.org}</p>
                </div>
                <span className="rounded-full bg-[#151515] px-3 py-1 text-xs font-bold text-[#FFE44F]">
                  Rating {player.rating}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300">
                <p>ACS: {player.acs}</p>
                <p>K/D: {player.kd}</p>
                <p>ADR: {player.adr}</p>
                <p>HS%: {player.headshotPercentage}</p>
                <p>Clutch%: {player.clutchSuccessPercentage}</p>
                <p>Agents: {player.agents.join(", ")}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
