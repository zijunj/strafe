import type { ParsedQuery } from "./parseQuery";
import { createServerSupabaseClient } from "../supabase/server";

export interface RetrievedStatRow {
  id: string;
  player: string;
  team: string;
  region: "na" | "emea" | "pacific" | "br";
  rating: number;
  acs: number;
  kd: number;
  adr: number;
  hsPercentage: number;
  roundsPlayed: number;
}

export interface RetrievedStatsResult {
  rows: RetrievedStatRow[];
  retrievalMeta: {
    source: "supabase" | "mock";
    appliedRegion: string;
    appliedTimespanDays: number;
    rowCount: number;
  };
}

interface AggregatedPlayerStatsRow {
  id: string;
  player_name: string;
  team_name: string | null;
  region: RetrievedStatRow["region"];
  timespan_days: number;
  rating: number | string | null;
  acs: number | string | null;
  kd: number | string | null;
  adr: number | string | null;
  hs_percentage: number | string | null;
  rounds_played: number | string | null;
}

const MOCK_PLAYER_STATS: RetrievedStatRow[] = [
  {
    id: "1",
    player: "Demon1",
    team: "NRG",
    region: "na",
    rating: 1.19,
    acs: 242,
    kd: 1.21,
    adr: 154.4,
    hsPercentage: 28.1,
    roundsPlayed: 512,
  },
  {
    id: "2",
    player: "aspas",
    team: "LEV",
    region: "na",
    rating: 1.24,
    acs: 255,
    kd: 1.28,
    adr: 160.2,
    hsPercentage: 24.6,
    roundsPlayed: 544,
  },
  {
    id: "3",
    player: "Less",
    team: "LOUD",
    region: "br",
    rating: 1.17,
    acs: 221,
    kd: 1.16,
    adr: 146.3,
    hsPercentage: 29.4,
    roundsPlayed: 498,
  },
  {
    id: "4",
    player: "Derke",
    team: "FNATIC",
    region: "emea",
    rating: 1.18,
    acs: 247,
    kd: 1.2,
    adr: 151.1,
    hsPercentage: 27.8,
    roundsPlayed: 533,
  },
  {
    id: "5",
    player: "something",
    team: "Paper Rex",
    region: "pacific",
    rating: 1.16,
    acs: 249,
    kd: 1.17,
    adr: 152.7,
    hsPercentage: 23.2,
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
    rating: toNumber(row.rating),
    acs: toNumber(row.acs),
    kd: toNumber(row.kd),
    adr: toNumber(row.adr),
    hsPercentage: toNumber(row.hs_percentage),
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

function getMetricSortKey(metric: ParsedQuery["metric"]): keyof RetrievedStatRow {
  switch (metric) {
    case "acs":
      return "acs";
    case "kd":
      return "kd";
    case "adr":
      return "adr";
    case "rating":
    case "general":
    case "hs_percentage":
    default:
      return metric === "hs_percentage" ? "hsPercentage" : "rating";
  }
}

async function retrieveStatsFromSupabase(
  parsedQuery: ParsedQuery
): Promise<RetrievedStatRow[] | null> {
  try {
    const supabase = createServerSupabaseClient();
    const region = parsedQuery.filters.region;
    const timespanDays = parsedQuery.filters.timespanDays ?? 30;

    let query = supabase
      .from("aggregated_player_stats")
      .select(
        "id, player_name, team_name, region, timespan_days, rating, acs, kd, adr, hs_percentage, rounds_played"
      )
      .eq("timespan_days", timespanDays)
      .limit(12);

    if (region && region !== "global") {
      query = query.eq("region", region);
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
