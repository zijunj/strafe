import type { ParsedQuery } from "./parseQuery";
import { createServerSupabaseClient } from "../supabase/server";

export interface RetrievedStatRow {
  id: string;
  player: string;
  team: string;
  region: "na" | "emea" | "pacific" | "br";
  agents: string[];
  rating: number;
  acs: number;
  kd: number;
  kastPercentage: number;
  adr: number;
  hsPercentage: number;
  killsPerRound: number;
  assistsPerRound: number;
  firstKillsPerRound: number;
  firstDeathsPerRound: number;
  clutchSuccessPercentage: number;
  roundsPlayed: number;
}

export interface RetrievedStatsResult {
  rows: RetrievedStatRow[];
  retrievalMeta: {
    source: "supabase" | "mock";
    appliedRegion: string;
    appliedTimespanDays: number | "all";
    rowCount: number;
  };
}

interface AggregatedPlayerStatsRow {
  id: string;
  player_name: string;
  team_name: string | null;
  region: RetrievedStatRow["region"];
  timespan_days: "30" | "60" | "90" | "all" | number | string;
  agents: string[] | null;
  rating: number | string | null;
  acs: number | string | null;
  kd: number | string | null;
  kast_percentage: number | string | null;
  adr: number | string | null;
  hs_percentage: number | string | null;
  kills_per_round: number | string | null;
  assists_per_round: number | string | null;
  first_kills_per_round: number | string | null;
  first_deaths_per_round: number | string | null;
  clutch_success_percentage: number | string | null;
  rounds_played: number | string | null;
}

const MOCK_PLAYER_STATS: RetrievedStatRow[] = [
  {
    id: "1",
    player: "Demon1",
    team: "NRG",
    region: "na",
    agents: ["jett", "raze"],
    rating: 1.19,
    acs: 242,
    kd: 1.21,
    kastPercentage: 74,
    adr: 154.4,
    hsPercentage: 28.1,
    killsPerRound: 0.8,
    assistsPerRound: 0.22,
    firstKillsPerRound: 0.14,
    firstDeathsPerRound: 0.11,
    clutchSuccessPercentage: 16,
    roundsPlayed: 512,
  },
  {
    id: "2",
    player: "aspas",
    team: "LEV",
    region: "na",
    agents: ["jett", "raze"],
    rating: 1.24,
    acs: 255,
    kd: 1.28,
    kastPercentage: 76,
    adr: 160.2,
    hsPercentage: 24.6,
    killsPerRound: 0.84,
    assistsPerRound: 0.2,
    firstKillsPerRound: 0.16,
    firstDeathsPerRound: 0.1,
    clutchSuccessPercentage: 18,
    roundsPlayed: 544,
  },
  {
    id: "3",
    player: "Less",
    team: "LOUD",
    region: "br",
    agents: ["viper", "killjoy"],
    rating: 1.17,
    acs: 221,
    kd: 1.16,
    kastPercentage: 75,
    adr: 146.3,
    hsPercentage: 29.4,
    killsPerRound: 0.74,
    assistsPerRound: 0.24,
    firstKillsPerRound: 0.08,
    firstDeathsPerRound: 0.07,
    clutchSuccessPercentage: 17,
    roundsPlayed: 498,
  },
  {
    id: "4",
    player: "Derke",
    team: "FNATIC",
    region: "emea",
    agents: ["jett", "yoru"],
    rating: 1.18,
    acs: 247,
    kd: 1.2,
    kastPercentage: 73,
    adr: 151.1,
    hsPercentage: 27.8,
    killsPerRound: 0.81,
    assistsPerRound: 0.19,
    firstKillsPerRound: 0.15,
    firstDeathsPerRound: 0.1,
    clutchSuccessPercentage: 15,
    roundsPlayed: 533,
  },
  {
    id: "5",
    player: "something",
    team: "Paper Rex",
    region: "pacific",
    agents: ["jett", "phoenix"],
    rating: 1.16,
    acs: 249,
    kd: 1.17,
    kastPercentage: 72,
    adr: 152.7,
    hsPercentage: 23.2,
    killsPerRound: 0.82,
    assistsPerRound: 0.18,
    firstKillsPerRound: 0.17,
    firstDeathsPerRound: 0.12,
    clutchSuccessPercentage: 14,
    roundsPlayed: 489,
  },
];

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function mapSupabaseRow(row: AggregatedPlayerStatsRow): RetrievedStatRow {
  return {
    id: row.id,
    player: row.player_name,
    team: row.team_name || "Unknown Team",
    region: row.region,
    agents: row.agents || [],
    rating: toNumber(row.rating),
    acs: toNumber(row.acs),
    kd: toNumber(row.kd),
    kastPercentage: toNumber(row.kast_percentage),
    adr: toNumber(row.adr),
    hsPercentage: toNumber(row.hs_percentage),
    killsPerRound: toNumber(row.kills_per_round),
    assistsPerRound: toNumber(row.assists_per_round),
    firstKillsPerRound: toNumber(row.first_kills_per_round),
    firstDeathsPerRound: toNumber(row.first_deaths_per_round),
    clutchSuccessPercentage: toNumber(row.clutch_success_percentage),
    roundsPlayed: toNumber(row.rounds_played),
  };
}

function applyLocalFilters(
  rows: RetrievedStatRow[],
  parsedQuery: ParsedQuery
): RetrievedStatRow[] {
  const region = parsedQuery.filters.region;
  const playerFilter = parsedQuery.filters.player?.toLowerCase();

  let filteredRows = rows;

  if (region && region !== "global") {
    filteredRows = filteredRows.filter((row) => row.region === region);
  }

  if (playerFilter) {
    const requestedPlayers = playerFilter.split(",").map((part) => part.trim());
    filteredRows = filteredRows.filter((row) =>
      requestedPlayers.some((requested) =>
        row.player.toLowerCase().includes(requested)
      )
    );
  }

  return filteredRows;
}

function getRequestedPlayers(playerFilter?: string): string[] {
  if (!playerFilter) {
    return [];
  }

  return playerFilter
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function getMetricSortKey(metric: ParsedQuery["metric"]): keyof RetrievedStatRow {
  switch (metric) {
    case "agents":
      return "rating";
    case "acs":
      return "acs";
    case "kd":
      return "kd";
    case "adr":
      return "adr";
    case "kpr":
      return "killsPerRound";
    case "apr":
      return "assistsPerRound";
    case "fkpr":
      return "firstKillsPerRound";
    case "fdpr":
      return "firstDeathsPerRound";
    case "kast_percentage":
      return "kastPercentage";
    case "clutch_success_percentage":
      return "clutchSuccessPercentage";
    case "rounds_played":
      return "roundsPlayed";
    case "rating":
    case "general":
    case "hs_percentage":
    default:
      return metric === "hs_percentage" ? "hsPercentage" : "rating";
  }
}

function getSupabaseMetricColumn(metric: ParsedQuery["metric"]): string {
  switch (metric) {
    case "acs":
      return "acs";
    case "kd":
      return "kd";
    case "adr":
      return "adr";
    case "kpr":
      return "kills_per_round";
    case "apr":
      return "assists_per_round";
    case "fkpr":
      return "first_kills_per_round";
    case "fdpr":
      return "first_deaths_per_round";
    case "kast_percentage":
      return "kast_percentage";
    case "clutch_success_percentage":
      return "clutch_success_percentage";
    case "rounds_played":
      return "rounds_played";
    case "hs_percentage":
      return "hs_percentage";
    case "rating":
    case "agents":
    case "general":
    default:
      return "rating";
  }
}

async function retrieveStatsFromSupabase(
  parsedQuery: ParsedQuery
): Promise<RetrievedStatRow[] | null> {
  try {
    const supabase = createServerSupabaseClient();
    const region = parsedQuery.filters.region;
    const timespanDays = parsedQuery.filters.timespanDays ?? 30;
    const playerFilter = parsedQuery.filters.player?.trim();
    const requestedPlayers = getRequestedPlayers(playerFilter);
    const metricColumn = getSupabaseMetricColumn(parsedQuery.metric);

    let query = supabase
      .from("aggregated_player_stats")
      .select(
        "id, player_name, team_name, region, timespan_days, agents, rating, acs, kd, kast_percentage, adr, hs_percentage, kills_per_round, assists_per_round, first_kills_per_round, first_deaths_per_round, clutch_success_percentage, rounds_played"
      )
      .order(metricColumn, { ascending: false });

    if (timespanDays === "all") {
      query = query.in("timespan_days", [0]);
    } else {
      query = query.in("timespan_days", [timespanDays, String(timespanDays)]);
    }

    if (region && region !== "global") {
      query = query.eq("region", region);
    }

    if (requestedPlayers.length === 1) {
      query = query.ilike("player_name", `%${requestedPlayers[0]}%`);
    } else if (requestedPlayers.length > 1) {
      const orFilters = requestedPlayers
        .map((player) => `player_name.ilike.%${player}%`)
        .join(",");
      query = query.or(orFilters);
    } else {
      query = query.limit(200);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase retrieveStats error:", error.message);
      return null;
    }

    if (!data?.length) {
      return [];
    }

    const mappedRows = data.map((row) =>
      mapSupabaseRow(row as AggregatedPlayerStatsRow)
    );

    return applyLocalFilters(mappedRows, parsedQuery);
  } catch (error: any) {
    console.error("Supabase client error:", error.message);
    return null;
  }
}

export async function retrieveStats(
  parsedQuery: ParsedQuery
): Promise<RetrievedStatsResult> {
  const region = parsedQuery.filters.region ?? "global";
  const timespanDays = parsedQuery.filters.timespanDays ?? 30;
  const metricSortKey = getMetricSortKey(parsedQuery.metric);

  const supabaseRows = await retrieveStatsFromSupabase(parsedQuery);

  const rows =
    supabaseRows !== null
      ? [...supabaseRows].sort(
          (a, b) => Number(b[metricSortKey]) - Number(a[metricSortKey])
        )
      : applyLocalFilters(MOCK_PLAYER_STATS, parsedQuery).sort(
          (a, b) => Number(b[metricSortKey]) - Number(a[metricSortKey])
        );

  return {
    rows: rows.slice(0, 10),
    retrievalMeta: {
      source: supabaseRows !== null ? "supabase" : "mock",
      appliedRegion: region,
      appliedTimespanDays: timespanDays,
      rowCount: rows.length,
    },
  };
}
