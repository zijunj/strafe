"use client";

import useValorantApiWithCache from "../app/api/Valorant";

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
  agents: string[];
  rounds_played: number;
}

interface StatsProps {
  filters: {
    region: string;
    timespan: string;
    minRounds: number;
    minRating: number;
    agent: string;
  };
}

export default function Stats({ filters }: StatsProps) {
  const cacheKey = `stats-${filters.region}-${filters.timespan}-${filters.minRating}`;
  const { data: statsData = [], loading } = useValorantApiWithCache<
    PlayerStats[]
  >({
    key: cacheKey,
    url: `stats?region=${filters.region}&timespan=${filters.timespan}&min_opponent_rating=${filters.minRating}`,
    parse: (res) => res.data?.segments || [],
  });

  if (loading) return <p className="text-white">Loading...</p>;

  const filteredData = statsData.filter((player) => {
    const rounds = Number(player.rounds_played);

    if (filters.minRounds && rounds < filters.minRounds) {
      console.log(
        `Excluded ${player.player} (rounds ${rounds} < minRounds ${filters.minRounds})`
      );
      return false;
    }

    if (
      filters.agent.toLowerCase() !== "all" &&
      !player.agents
        .map((a) => a.toLowerCase())
        .includes(filters.agent.toLowerCase())
    ) {
      console.log(
        `Excluded ${player.player} (agent filter ${filters.agent} not in ${player.agents})`
      );
      return false;
    }

    console.log(`Included ${player.player}`);
    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Top Player Stats</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-900 text-gray-300 text-sm">
              <th className="p-2 text-left">Player</th>
              <th className="p-2">Agents</th>
              <th className="p-2">Rounds</th>
              <th className="p-2">Rating</th>
              <th className="p-2">ACS</th>
              <th className="p-2">K/D</th>
              <th className="p-2">KAST</th>
              <th className="p-2">ADR</th>
              <th className="p-2">KPR</th>
              <th className="p-2">APR</th>
              <th className="p-2">FKPR</th>
              <th className="p-2">FDPR</th>
              <th className="p-2">HS%</th>
              <th className="p-2">CL%</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 25).map((item, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}
              >
                <td className="p-2 font-medium text-white">
                  {item.player}{" "}
                  <span className="text-xs text-gray-400">({item.org})</span>
                </td>
                <td className="p-2 text-center">
                  {item.agents?.join(", ") || "-"}
                </td>
                <td className="p-2 text-center">{item.rounds_played}</td>
                <td className="p-2 text-center">{item.rating}</td>
                <td className="p-2 text-center">{item.average_combat_score}</td>
                <td className="p-2 text-center">{item.kill_deaths}</td>
                <td className="p-2 text-center">
                  {item.kill_assists_survived_traded}
                </td>
                <td className="p-2 text-center">
                  {item.average_damage_per_round}
                </td>
                <td className="p-2 text-center">{item.kills_per_round}</td>
                <td className="p-2 text-center">{item.assists_per_round}</td>
                <td className="p-2 text-center">
                  {item.first_kills_per_round}
                </td>
                <td className="p-2 text-center">
                  {item.first_deaths_per_round}
                </td>
                <td className="p-2 text-center">{item.headshot_percentage}</td>
                <td className="p-2 text-center">
                  {item.clutch_success_percentage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
