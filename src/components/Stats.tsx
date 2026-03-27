"use client";

import { useState } from "react";
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

const columns = [
  { key: "player", label: "Player" },
  { key: "agents", label: "Agents" },
  { key: "rounds_played", label: "Rounds" },
  { key: "rating", label: "Rating" },
  { key: "average_combat_score", label: "ACS" },
  { key: "kill_deaths", label: "K/D" },
  { key: "kill_assists_survived_traded", label: "KAST" },
  { key: "average_damage_per_round", label: "ADR" },
  { key: "kills_per_round", label: "KPR" },
  { key: "assists_per_round", label: "APR" },
  { key: "first_kills_per_round", label: "FKPR" },
  { key: "first_deaths_per_round", label: "FDPR" },
  { key: "headshot_percentage", label: "HS%" },
  { key: "clutch_success_percentage", label: "CL%" },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

export default function Stats({ filters }: StatsProps) {
  const [highlightedColumn, setHighlightedColumn] =
    useState<ColumnKey>("rating");

  const cacheKey = `stats-${filters.region}-${filters.timespan}-${filters.minRating}`;
  const { data: statsData = [], loading } = useValorantApiWithCache<
    PlayerStats[]
  >({
    key: cacheKey,
    url: `stats?region=${filters.region}&timespan=${filters.timespan}&event_group_id=all&min_opponent_rating=${filters.minRating}`,
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

  const getCellClasses = (column: ColumnKey) =>
    highlightedColumn === column
      ? "px-3 py-4 text-center font-bold text-[#FFE44F]"
      : "px-3 py-4 text-center text-[#d6d6d6]";

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFE44F]">
          Stats Overview
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">
          Top Player Stats
        </h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#303030] bg-[#1b1b1b] shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#171717] text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#8b8b8b]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.key === "player"
                      ? "px-4 py-4 text-left"
                      : "px-3 py-4 text-center"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setHighlightedColumn(column.key)}
                    className={`w-full transition-colors hover:text-white ${
                      column.key === "player" ? "text-left" : "text-center"
                    } ${
                      highlightedColumn === column.key ? "text-[#FFE44F]" : ""
                    }`}
                  >
                    {column.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 25).map((item, i) => (
              <tr
                key={i}
                className={`border-t border-[#2d2d2d] text-sm transition-colors hover:bg-[#242424] ${
                  i % 2 === 0 ? "bg-[#1d1d1d]" : "bg-[#212121]"
                }`}
              >
                <td
                  className={`px-4 py-4 font-semibold ${
                    highlightedColumn === "player"
                      ? "text-[#FFE44F]"
                      : "text-white"
                  }`}
                >
                  {item.player}{" "}
                  <span className="text-xs text-[#8b8b8b]">({item.org})</span>
                </td>
                <td className={getCellClasses("agents")}>
                  {item.agents?.join(", ") || "-"}
                </td>
                <td className={getCellClasses("rounds_played")}>
                  {item.rounds_played}
                </td>
                <td className={getCellClasses("rating")}>{item.rating}</td>
                <td className={getCellClasses("average_combat_score")}>
                  {item.average_combat_score}
                </td>
                <td className={getCellClasses("kill_deaths")}>
                  {item.kill_deaths}
                </td>
                <td className={getCellClasses("kill_assists_survived_traded")}>
                  {item.kill_assists_survived_traded}
                </td>
                <td className={getCellClasses("average_damage_per_round")}>
                  {item.average_damage_per_round}
                </td>
                <td className={getCellClasses("kills_per_round")}>
                  {item.kills_per_round}
                </td>
                <td className={getCellClasses("assists_per_round")}>
                  {item.assists_per_round}
                </td>
                <td className={getCellClasses("first_kills_per_round")}>
                  {item.first_kills_per_round}
                </td>
                <td className={getCellClasses("first_deaths_per_round")}>
                  {item.first_deaths_per_round}
                </td>
                <td className={getCellClasses("headshot_percentage")}>
                  {item.headshot_percentage}
                </td>
                <td className={getCellClasses("clutch_success_percentage")}>
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
