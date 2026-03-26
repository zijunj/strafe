import { createServerSupabaseClient } from "../supabase/server";

export interface VlrStatsApiRow {
  player: string;
  org: string;
  agents: string[];
  rounds_played: string;
  rating: string;
  average_combat_score: string;
  kill_deaths: string;
  kill_assists_survived_traded: string;
  average_damage_per_round: string;
  kills_per_round: string;
  assists_per_round: string;
  first_kills_per_round: string;
  first_deaths_per_round: string;
  headshot_percentage: string;
  clutch_success_percentage: string;
}

interface VlrStatsApiResponse {
  data?: {
    status?: number;
    segments?: VlrStatsApiRow[];
  };
}

export interface AggregatedPlayerStatsInsert {
  player_name: string;
  team_name: string;
  region: string;
  timespan_days: number;
  agents: string[];
  rating: number;
  acs: number;
  kd: number;
  kast_percentage: number;
  adr: number;
  hs_percentage: number;
  kills_per_round: number;
  assists_per_round: number;
  first_kills_per_round: number;
  first_deaths_per_round: number;
  clutch_success_percentage: number;
  rounds_played: number;
  updated_at: string;
}

export interface SyncAggregatedStatsParams {
  region: string;
  timespanDays: 30 | 60 | 90 | "all";
  baseUrl?: string;
}

export interface SyncAggregatedStatsResult {
  insertedCount: number;
  rows: AggregatedPlayerStatsInsert[];
  sourceUrl: string;
}

function buildDeduplicationKey(row: AggregatedPlayerStatsInsert): string {
  return `${row.player_name.toLowerCase()}::${row.region.toLowerCase()}::${row.timespan_days}`;
}

function dedupeAggregatedRows(
  rows: AggregatedPlayerStatsInsert[]
): AggregatedPlayerStatsInsert[] {
  const deduped = new Map<string, AggregatedPlayerStatsInsert>();

  for (const row of rows) {
    deduped.set(buildDeduplicationKey(row), row);
  }

  return Array.from(deduped.values());
}

function toNumber(value: string): number {
  const normalized = value.replace("%", "").trim();
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeTimespanValue(
  timespanDays: SyncAggregatedStatsParams["timespanDays"] | string | number
): 30 | 60 | 90 | "all" {
  if (timespanDays === "all") {
    return "all";
  }

  const numericValue =
    typeof timespanDays === "string" ? Number(timespanDays) : timespanDays;

  if (numericValue === 60 || numericValue === 90) {
    return numericValue;
  }

  return 30;
}

function toStoredTimespanValue(
  timespanDays: SyncAggregatedStatsParams["timespanDays"] | string | number
): number {
  const normalizedTimespan = normalizeTimespanValue(timespanDays);
  return normalizedTimespan === "all" ? 0 : normalizedTimespan;
}

export function mapApiStatToAggregatedRow(
  apiRow: VlrStatsApiRow,
  context: { region: string; timespanDays: SyncAggregatedStatsParams["timespanDays"] }
): AggregatedPlayerStatsInsert {
  return {
    player_name: apiRow.player,
    team_name: apiRow.org || "N/A",
    region: context.region,
    timespan_days: toStoredTimespanValue(context.timespanDays),
    agents: apiRow.agents ?? [],
    rating: toNumber(apiRow.rating),
    acs: toNumber(apiRow.average_combat_score),
    kd: toNumber(apiRow.kill_deaths),
    kast_percentage: toNumber(apiRow.kill_assists_survived_traded),
    adr: toNumber(apiRow.average_damage_per_round),
    hs_percentage: toNumber(apiRow.headshot_percentage),
    kills_per_round: toNumber(apiRow.kills_per_round),
    assists_per_round: toNumber(apiRow.assists_per_round),
    first_kills_per_round: toNumber(apiRow.first_kills_per_round),
    first_deaths_per_round: toNumber(apiRow.first_deaths_per_round),
    clutch_success_percentage: toNumber(apiRow.clutch_success_percentage),
    rounds_played: toNumber(apiRow.rounds_played),
    updated_at: new Date().toISOString(),
  };
}

async function fetchStatsFromApi(
  params: SyncAggregatedStatsParams
): Promise<{ rows: VlrStatsApiRow[]; sourceUrl: string }> {
  const baseUrl =
    params.baseUrl ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const sourceUrl = `${baseUrl}/api/proxy?endpoint=${encodeURIComponent(
    `stats?region=${params.region}&timespan=${params.timespanDays}`
  )}`;

  const response = await fetch(sourceUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats from API (${response.status})`);
  }

  const payload = (await response.json()) as VlrStatsApiResponse;
  const rows = payload.data?.segments || [];

  return { rows, sourceUrl };
}

export async function syncAggregatedStats(
  params: SyncAggregatedStatsParams
): Promise<SyncAggregatedStatsResult> {
  const { rows: apiRows, sourceUrl } = await fetchStatsFromApi(params);
  const supabase = createServerSupabaseClient();

  const mappedRows = apiRows.map((row) =>
    mapApiStatToAggregatedRow(row, {
      region: params.region,
      timespanDays: params.timespanDays,
    })
  );

  const dedupedRows = dedupeAggregatedRows(mappedRows);

  if (dedupedRows.length === 0) {
    return {
      insertedCount: 0,
      rows: [],
      sourceUrl,
    };
  }

  const { error } = await supabase
    .from("aggregated_player_stats")
    .upsert(dedupedRows, {
      onConflict: "player_name,region,timespan_days",
    });

  if (error) {
    throw new Error(`Failed to upsert aggregated stats: ${error.message}`);
  }

  return {
    insertedCount: dedupedRows.length,
    rows: dedupedRows,
    sourceUrl,
  };
}
