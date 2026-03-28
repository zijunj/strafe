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

const agentImageMap: Record<string, string> = {
  "kay/o": "kayo",
  kayo: "kayo",
};

function getAgentImageSrc(agent: string) {
  const normalized = agent.toLowerCase().trim();
  const fileName =
    agentImageMap[normalized] ??
    normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return `/agents/vlr/${fileName}.png`;
}

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

  if (loading) return <p className="status-note">Loading...</p>;

  const filteredData = statsData.filter((player) => {
    const rounds = Number(player.rounds_played);

    if (filters.minRounds && rounds < filters.minRounds) {
      return false;
    }

    if (
      filters.agent.toLowerCase() !== "all" &&
      !player.agents
        .map((a) => a.toLowerCase())
        .includes(filters.agent.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const getCellClasses = (column: ColumnKey) =>
    highlightedColumn === column
      ? "text-accent font-bold"
      : "text-[var(--color-text-secondary)]";

  return (
    <section className="pt-2">
      <div className="table-container shadow-card">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.key === "player" ? "text-left" : "text-center"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setHighlightedColumn(column.key)}
                    className={`w-full transition-colors hover:text-[var(--color-text-primary)] ${
                      column.key === "player" ? "text-left" : "text-center"
                    } ${
                      highlightedColumn === column.key
                        ? "text-accent"
                        : "text-[var(--color-text-muted)]"
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
              <tr key={i}>
                <td
                  className={`font-semibold ${
                    highlightedColumn === "player"
                      ? "text-accent"
                      : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {item.player}{" "}
                  <span className="text-[var(--color-text-muted)]">
                    ({item.org})
                  </span>
                </td>
                <td className={`text-center ${getCellClasses("agents")}`}>
                  {item.agents?.length ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {item.agents.map((agent) => (
                        <div
                          key={`${item.player}-${agent}`}
                          className="relative h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-white/5"
                          title={agent}
                          aria-label={agent}
                        >
                          <img
                            src={getAgentImageSrc(agent)}
                            alt={agent}
                            className="h-full w-full object-contain object-center"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td
                  className={`text-center ${getCellClasses("rounds_played")}`}
                >
                  {item.rounds_played}
                </td>
                <td className={`text-center ${getCellClasses("rating")}`}>
                  {item.rating}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "average_combat_score"
                  )}`}
                >
                  {item.average_combat_score}
                </td>
                <td className={`text-center ${getCellClasses("kill_deaths")}`}>
                  {item.kill_deaths}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "kill_assists_survived_traded"
                  )}`}
                >
                  {item.kill_assists_survived_traded}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "average_damage_per_round"
                  )}`}
                >
                  {item.average_damage_per_round}
                </td>
                <td
                  className={`text-center ${getCellClasses("kills_per_round")}`}
                >
                  {item.kills_per_round}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "assists_per_round"
                  )}`}
                >
                  {item.assists_per_round}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "first_kills_per_round"
                  )}`}
                >
                  {item.first_kills_per_round}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "first_deaths_per_round"
                  )}`}
                >
                  {item.first_deaths_per_round}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "headshot_percentage"
                  )}`}
                >
                  {item.headshot_percentage}
                </td>
                <td
                  className={`text-center ${getCellClasses(
                    "clutch_success_percentage"
                  )}`}
                >
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
