import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  scrapeTournamentStatsByEventId,
  type ScrapedTournamentPlayerStat,
} from "@/lib/vlr-storage/scrapeTournamentStats";

interface VlrEventsResponse {
  data?: {
    segments?: VlrEventSegment[];
  };
}

interface VlrEventSegment {
  title: string;
  status: string;
  prize: string;
  dates: string;
  region: string;
  thumb: string;
  url_path: string;
}

function deriveEventTier(title: string | null | undefined) {
  if (!title) {
    return null;
  }

  return /^VCT 2026\b/i.test(title.trim()) ? 1 : null;
}

function normalizeEventStatus(status: string | null | undefined): string {
  if (!status) {
    return "upcoming";
  }

  const lowerStatus = status.toLowerCase().trim();

  // Map various status values from VLR API to normalized statuses
  if (
    lowerStatus === "ongoing" ||
    lowerStatus === "live" ||
    lowerStatus === "in_progress" ||
    lowerStatus === "in-progress"
  ) {
    return "ongoing";
  }

  if (lowerStatus === "completed" || lowerStatus === "finished") {
    return "completed"; // Store as "completed", will be converted to "finished" when returned
  }

  if (lowerStatus === "upcoming" || lowerStatus === "scheduled") {
    return "upcoming";
  }

  // Default to upcoming for unknown statuses
  return "upcoming";
}

interface VlrUpcomingMatchesResponse {
  data?: {
    segments?: VlrUpcomingMatchSegment[];
  };
}

interface VlrUpcomingMatchSegment {
  team1: string;
  team2: string;
  match_series: string;
  match_event: string;
  unix_timestamp: string;
  time_until_match: string;
  match_page: string;
}

interface VlrLiveMatchesResponse {
  data?: {
    segments?: VlrLiveMatchSegment[];
  };
}

interface VlrLiveMatchSegment {
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  match_series: string;
  match_event: string;
  unix_timestamp: string;
  time_until_match: string;
  match_page: string;
}

interface VlrResultsResponse {
  data?: {
    segments?: VlrResultMatchSegment[];
  };
}

interface VlrResultMatchSegment {
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  round_info: string;
  tournament_name: string;
  time_completed: string;
  match_page: string;
  tournament_icon: string;
}

interface VlrMatchDetailsResponse {
  data?: {
    segments?: VlrMatchDetailsSegment[];
  };
}

interface VlrMatchDetailsSegment {
  match_id: string;
  date: string;
  patch: string;
  status: string;
  event: {
    name: string;
    series: string;
    logo: string;
  };
  teams: Array<{
    name: string;
    tag: string;
    logo: string;
    score: string;
    is_winner: boolean;
  }>;
  streams: Array<{
    name: string;
    url: string;
  }>;
  vods?: Array<{
    name?: string;
    url?: string;
  }>;
  head_to_head?: unknown[];
  maps?: unknown[];
  performance?: unknown;
  economy?: unknown[];
  economy_by_map?: unknown[];
}

interface EventRow {
  id: number;
  vlr_event_id: number;
  title: string;
  status: string;
}

interface MatchRow {
  id: number;
  vlr_match_id: number;
  slug: string | null;
  status: string;
  last_synced_at: string | null;
  scheduled_at?: string | null;
}

interface NormalizedMatchRow {
  vlr_match_id: number;
  slug: string | null;
  event_title: string;
  event_series: string | null;
  team_1_name: string | null;
  team_2_name: string | null;
  team_1_score: string | null;
  team_2_score: string | null;
  team_1_is_winner: boolean | null;
  team_2_is_winner: boolean | null;
  scheduled_at: string | null;
  date_label: string | null;
  match_url: string;
  vods: unknown[];
  status: string;
  raw_payload: Record<string, unknown>;
}

export interface SyncTournamentMatchStorageParams {
  eventIds?: number[];
  matchIds?: number[];
  matchDetailsLimit?: number;
  includeCompletedEvents?: boolean;
  syncEvents?: boolean;
  syncMatches?: boolean;
  syncEventPlayerStats?: boolean;
  syncMatchDetails?: boolean;
}

export interface SyncTournamentMatchStorageResult {
  syncedEvents: number;
  syncedMatches: number;
  syncedEventPlayerStats: number;
  syncedMatchDetails: number;
}

const DEFAULT_MATCH_DETAILS_SOURCE_VERSION = "vlrggapi:v1";
const DEFAULT_SYNC_FLAGS = {
  syncEvents: true,
  syncMatches: true,
  syncEventPlayerStats: true,
  syncMatchDetails: true,
} as const;
const UPSTREAM_FETCH_TIMEOUT_MS = 15000;
const UPSTREAM_FETCH_MAX_RETRIES = 3;
const MATCH_DETAIL_REQUEST_DELAY_MS = 600;
const UPCOMING_MATCH_STALE_BUFFER_HOURS = 6;
const ACTIVE_MATCH_CLEANUP_BUFFER_HOURS = 6;

function getBaseUrl() {
  const baseUrl = process.env.VLR_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("VLR_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(attempt: number) {
  const baseDelay = 800 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 400);
  return baseDelay + jitter;
}

function shouldRetryStatus(status: number) {
  return [403, 408, 425, 429, 500, 502, 503, 504].includes(status);
}

function getUpstreamRequestHeaders() {
  return {
    Accept: "application/json,text/html,application/xhtml+xml",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  };
}

async function fetchVlrJson<T>(endpoint: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= UPSTREAM_FETCH_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        headers: getUpstreamRequestHeaders(),
        signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        const status = response.status;
        const bodyText = await response.text().catch(() => "");
        const bodySnippet = bodyText.slice(0, 180).replace(/\s+/g, " ").trim();

        console.warn(
          `Upstream VLR API request failed (${status}) for ${endpoint}${
            bodySnippet ? ` | body: ${bodySnippet}` : ""
          }`
        );

        if (attempt < UPSTREAM_FETCH_MAX_RETRIES && shouldRetryStatus(status)) {
          await sleep(getRetryDelayMs(attempt));
          continue;
        }

        throw new Error(
          `Upstream VLR API request failed (${status}) for ${endpoint}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown upstream fetch error");

      if (attempt < UPSTREAM_FETCH_MAX_RETRIES) {
        console.warn(
          `Retrying upstream request for ${endpoint} after error: ${lastError.message}`
        );
        await sleep(getRetryDelayMs(attempt));
        continue;
      }
    }
  }

  throw lastError ?? new Error(`Upstream VLR API request failed for ${endpoint}`);
}

function parseVlrEventId(urlPath: string): number | null {
  const match = urlPath.match(/\/event\/(\d+)/i);
  return match ? Number(match[1]) : null;
}

function normalizeMatchPage(matchPage: string) {
  const trimmed = matchPage.replace(/^https?:\/\/www\.vlr\.gg\//i, "").replace(/^\/+/, "");
  const [idPart, slugPart] = trimmed.split("/", 2);
  const vlrMatchId = Number(idPart);

  return {
    vlrMatchId: Number.isFinite(vlrMatchId) ? vlrMatchId : null,
    slug: slugPart || null,
    matchUrl: `https://www.vlr.gg/${trimmed}`,
  };
}

function parseTimestamp(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(" ", "T");
  const date = new Date(`${normalized}Z`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function reconcileMatchStatus(
  status: string,
  scheduledAt: string | null
): string {
  if (status !== "upcoming" || !scheduledAt) {
    return status;
  }

  const scheduledTime = new Date(scheduledAt).getTime();

  if (Number.isNaN(scheduledTime)) {
    return status;
  }

  const staleThreshold =
    Date.now() - UPCOMING_MATCH_STALE_BUFFER_HOURS * 60 * 60 * 1000;

  return scheduledTime <= staleThreshold ? "completed" : status;
}

function normalizeNumericString(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[%,$]/g, "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function dedupeMatches(rows: NormalizedMatchRow[]) {
  const byId = new Map<number, NormalizedMatchRow>();
  const priority = new Map<string, number>([
    ["live", 3],
    ["upcoming", 2],
    ["completed", 1],
  ]);

  for (const row of rows) {
    const current = byId.get(row.vlr_match_id);

    if (!current) {
      byId.set(row.vlr_match_id, row);
      continue;
    }

    const currentPriority = priority.get(current.status) ?? 0;
    const nextPriority = priority.get(row.status) ?? 0;

    if (nextPriority >= currentPriority) {
      byId.set(row.vlr_match_id, row);
    }
  }

  return [...byId.values()];
}

function normalizeUpcomingMatch(segment: VlrUpcomingMatchSegment): NormalizedMatchRow | null {
  const parsedPage = normalizeMatchPage(segment.match_page);

  if (!parsedPage.vlrMatchId) {
    return null;
  }

  const scheduledAt = parseTimestamp(segment.unix_timestamp);

  return {
    vlr_match_id: parsedPage.vlrMatchId,
    slug: parsedPage.slug,
    event_title: segment.match_event,
    event_series: segment.match_series || null,
    team_1_name: segment.team1 || null,
    team_2_name: segment.team2 || null,
    team_1_score: null,
    team_2_score: null,
    team_1_is_winner: null,
    team_2_is_winner: null,
    scheduled_at: scheduledAt,
    date_label: segment.time_until_match || null,
    match_url: parsedPage.matchUrl,
    vods: [],
    status: reconcileMatchStatus("upcoming", scheduledAt),
    raw_payload: segment as unknown as Record<string, unknown>,
  };
}

function normalizeLiveMatch(segment: VlrLiveMatchSegment): NormalizedMatchRow | null {
  const parsedPage = normalizeMatchPage(segment.match_page);

  if (!parsedPage.vlrMatchId) {
    return null;
  }

  const team1Score = segment.score1 || null;
  const team2Score = segment.score2 || null;

  return {
    vlr_match_id: parsedPage.vlrMatchId,
    slug: parsedPage.slug,
    event_title: segment.match_event,
    event_series: segment.match_series || null,
    team_1_name: segment.team1 || null,
    team_2_name: segment.team2 || null,
    team_1_score: team1Score,
    team_2_score: team2Score,
    team_1_is_winner: null,
    team_2_is_winner: null,
    scheduled_at: parseTimestamp(segment.unix_timestamp),
    date_label: segment.time_until_match || null,
    match_url: parsedPage.matchUrl,
    vods: [],
    status: "live",
    raw_payload: segment as unknown as Record<string, unknown>,
  };
}

function normalizeResultMatch(segment: VlrResultMatchSegment): NormalizedMatchRow | null {
  const parsedPage = normalizeMatchPage(segment.match_page);

  if (!parsedPage.vlrMatchId) {
    return null;
  }

  const score1 = segment.score1 || null;
  const score2 = segment.score2 || null;
  const parsedScore1 = score1 ? Number(score1) : Number.NaN;
  const parsedScore2 = score2 ? Number(score2) : Number.NaN;

  return {
    vlr_match_id: parsedPage.vlrMatchId,
    slug: parsedPage.slug,
    event_title: segment.tournament_name,
    event_series: segment.round_info || null,
    team_1_name: segment.team1 || null,
    team_2_name: segment.team2 || null,
    team_1_score: score1,
    team_2_score: score2,
    team_1_is_winner:
      Number.isFinite(parsedScore1) && Number.isFinite(parsedScore2)
        ? parsedScore1 > parsedScore2
        : null,
    team_2_is_winner:
      Number.isFinite(parsedScore1) && Number.isFinite(parsedScore2)
        ? parsedScore2 > parsedScore1
        : null,
    scheduled_at: null,
    date_label: segment.time_completed || null,
    match_url: parsedPage.matchUrl,
    vods: [],
    status: "completed",
    raw_payload: segment as unknown as Record<string, unknown>,
  };
}

async function fetchEventsFromUpstream() {
  const payload = await fetchVlrJson<VlrEventsResponse>("/events");
  return payload.data?.segments ?? [];
}

async function fetchNormalizedMatchesFromUpstream() {
  const [upcomingPayload, livePayload, resultsPayload] = await Promise.all([
    fetchVlrJson<VlrUpcomingMatchesResponse>("/match?q=upcoming"),
    fetchVlrJson<VlrLiveMatchesResponse>("/match?q=live_score"),
    fetchVlrJson<VlrResultsResponse>("/match?q=results"),
  ]);

  return dedupeMatches([
    ...(upcomingPayload.data?.segments ?? [])
      .map(normalizeUpcomingMatch)
      .filter((row): row is NormalizedMatchRow => Boolean(row)),
    ...(livePayload.data?.segments ?? [])
      .map(normalizeLiveMatch)
      .filter((row): row is NormalizedMatchRow => Boolean(row)),
    ...(resultsPayload.data?.segments ?? [])
      .map(normalizeResultMatch)
      .filter((row): row is NormalizedMatchRow => Boolean(row)),
  ]);
}

async function fetchMatchDetailsFromUpstream(vlrMatchId: number) {
  const payload = await fetchVlrJson<VlrMatchDetailsResponse>(
    `/match/details?match_id=${vlrMatchId}`
  );

  return payload.data?.segments?.[0] ?? null;
}

async function loadStoredMatchByVlrMatchId(vlrMatchId: number) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, vlr_match_id, slug, status, last_synced_at")
    .eq("vlr_match_id", vlrMatchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load stored match ${vlrMatchId}: ${error.message}`);
  }

  return (data as MatchRow | null) ?? null;
}

export async function syncStoredMatchDetailByVlrMatchId(vlrMatchId: number) {
  const supabase = createServiceRoleSupabaseClient();
  const timestamp = new Date().toISOString();
  const match = await loadStoredMatchByVlrMatchId(vlrMatchId);

  if (!match) {
    return false;
  }

  const detailPayload = await fetchMatchDetailsFromUpstream(vlrMatchId).catch(
    (error) => {
      console.warn(
        `Failed to fetch match details for ${vlrMatchId}:`,
        error
      );
      return null;
    }
  );

  if (!detailPayload) {
    return false;
  }

  const { error } = await supabase.from("match_details").upsert(
    {
      match_id: match.id,
      status: detailPayload.status || match.status,
      source_version: DEFAULT_MATCH_DETAILS_SOURCE_VERSION,
      payload: detailPayload,
      last_synced_at: timestamp,
    },
    { onConflict: "match_id" }
  );

  if (error) {
    throw new Error(
      `Failed to upsert match details for ${vlrMatchId}: ${error.message}`
    );
  }

  return true;
}

async function syncEvents() {
  const supabase = createServiceRoleSupabaseClient();
  const upstreamEvents = await fetchEventsFromUpstream();
  const timestamp = new Date().toISOString();

  const eventRows = upstreamEvents
    .map((event) => {
      const vlrEventId = parseVlrEventId(event.url_path);

      if (!vlrEventId) {
        return null;
      }

      return {
        vlr_event_id: vlrEventId,
        title: event.title,
        tier: deriveEventTier(event.title),
        status: normalizeEventStatus(event.status),
        region: event.region || null,
        dates: event.dates || null,
        prize: event.prize || null,
        thumb: event.thumb || null,
        event_url: event.url_path || null,
        raw_payload: event,
        last_synced_at: timestamp,
      };
    })
    .filter(
      (
        row
      ): row is {
        vlr_event_id: number;
        title: string;
        tier: number | null;
        status: string;
        region: string | null;
        dates: string | null;
        prize: string | null;
        thumb: string | null;
        event_url: string | null;
        raw_payload: VlrEventSegment;
        last_synced_at: string;
      } => Boolean(row)
    );

  if (eventRows.length === 0) {
    return [] as EventRow[];
  }

  const { data, error } = await supabase
    .from("events")
    .upsert(eventRows, { onConflict: "vlr_event_id" })
    .select("id, vlr_event_id, title, status");

  if (error) {
    throw new Error(`Failed to upsert events: ${error.message}`);
  }

  return (data ?? []) as EventRow[];
}

async function loadTargetEvents(params: SyncTournamentMatchStorageParams) {
  const supabase = createServiceRoleSupabaseClient();

  let query = supabase.from("events").select("id, vlr_event_id, title, status");

  if (params.eventIds?.length) {
    query = query.in("vlr_event_id", params.eventIds);
  } else if (!params.includeCompletedEvents) {
    query = query.in("status", ["ongoing", "upcoming"]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load events for sync: ${error.message}`);
  }

  return (data ?? []) as EventRow[];
}

async function syncMatches(params: SyncTournamentMatchStorageParams) {
  const supabase = createServiceRoleSupabaseClient();
  const timestamp = new Date().toISOString();
  const [events, upstreamMatches] = await Promise.all([
    loadTargetEvents(params),
    fetchNormalizedMatchesFromUpstream(),
  ]);

  const eventsByTitle = new Map(events.map((event) => [event.title, event]));
  const targetMatchIds = params.matchIds?.length
    ? new Set(params.matchIds)
    : null;

  const matchRows = upstreamMatches
    .filter((match) =>
      targetMatchIds ? targetMatchIds.has(match.vlr_match_id) : true
    )
    .map((match) => {
      const event = eventsByTitle.get(match.event_title);

      if (!event) {
        return null;
      }

      return {
        event_id: event.id,
        vlr_match_id: match.vlr_match_id,
        slug: match.slug,
        event_title: match.event_title,
        event_series: match.event_series,
        team_1_name: match.team_1_name,
        team_2_name: match.team_2_name,
        team_1_score: match.team_1_score,
        team_2_score: match.team_2_score,
        team_1_is_winner: match.team_1_is_winner,
        team_2_is_winner: match.team_2_is_winner,
        scheduled_at: match.scheduled_at,
        date_label: match.date_label,
        match_url: match.match_url,
        vods: match.vods,
        status: match.status,
        raw_payload: match.raw_payload,
        last_synced_at: timestamp,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const activeUpstreamMatchIds = new Set(
    upstreamMatches
      .filter((match) => match.status === "live" || match.status === "upcoming")
      .map((match) => match.vlr_match_id),
  );

  const staleThresholdIso = new Date(
    Date.now() - ACTIVE_MATCH_CLEANUP_BUFFER_HOURS * 60 * 60 * 1000,
  ).toISOString();

  let existingActiveMatchesQuery = supabase
    .from("matches")
    .select("id, vlr_match_id, scheduled_at, status")
    .in("status", ["live", "upcoming"]);

  if (params.matchIds?.length) {
    existingActiveMatchesQuery = existingActiveMatchesQuery.in(
      "vlr_match_id",
      params.matchIds,
    );
  } else if (params.eventIds?.length) {
    const targetedEventIds = events.map((event) => event.id);

    if (targetedEventIds.length > 0) {
      existingActiveMatchesQuery = existingActiveMatchesQuery.in(
        "event_id",
        targetedEventIds,
      );
    }
  }

  const { data: existingActiveMatches, error: existingActiveMatchesError } =
    await existingActiveMatchesQuery;

  if (existingActiveMatchesError) {
    throw new Error(
      `Failed to load existing active matches: ${existingActiveMatchesError.message}`,
    );
  }

  const staleMatchIds = (existingActiveMatches ?? [])
    .filter((match) => {
      const scheduledAt = match.scheduled_at;
      const isMissingFromUpstream = !activeUpstreamMatchIds.has(match.vlr_match_id);

      if (!isMissingFromUpstream) {
        return false;
      }

      if (match.status === "live") {
        return true;
      }

      if (!scheduledAt) {
        return false;
      }

      const isPastCleanupThreshold = scheduledAt <= staleThresholdIso;

      return isPastCleanupThreshold;
    })
    .map((match) => match.id);

  if (staleMatchIds.length > 0) {
    const { error: staleUpdateError } = await supabase
      .from("matches")
      .update({
        status: "completed",
        last_synced_at: timestamp,
      })
      .in("id", staleMatchIds);

    if (staleUpdateError) {
      throw new Error(
        `Failed to mark stale matches completed: ${staleUpdateError.message}`,
      );
    }
  }

  if (matchRows.length === 0) {
    return [] as MatchRow[];
  }

  const { data, error } = await supabase
    .from("matches")
    .upsert(matchRows, { onConflict: "vlr_match_id" })
    .select("id, vlr_match_id, slug, status, last_synced_at");

  if (error) {
    throw new Error(`Failed to upsert matches: ${error.message}`);
  }

  return (data ?? []) as MatchRow[];
}

function mapEventPlayerStatRow(
  eventId: number,
  row: ScrapedTournamentPlayerStat,
  timestamp: string
) {
  return {
    event_id: eventId,
    player_name: row.player_name,
    team_name: row.team_name,
    agents: row.agents,
    rounds_played: normalizeNumericString(row.rounds_played),
    rating: normalizeNumericString(row.rating),
    average_combat_score: normalizeNumericString(row.average_combat_score),
    kill_deaths: normalizeNumericString(row.kill_deaths),
    kill_assists_survived_traded: normalizeNumericString(
      row.kill_assists_survived_traded
    ),
    average_damage_per_round: normalizeNumericString(
      row.average_damage_per_round
    ),
    kills_per_round: normalizeNumericString(row.kills_per_round),
    assists_per_round: normalizeNumericString(row.assists_per_round),
    first_kills_per_round: normalizeNumericString(row.first_kills_per_round),
    first_deaths_per_round: normalizeNumericString(row.first_deaths_per_round),
    headshot_percentage: normalizeNumericString(row.headshot_percentage),
    clutch_success_percentage: normalizeNumericString(
      row.clutch_success_percentage
    ),
    raw_payload: row,
    last_synced_at: timestamp,
  };
}

async function syncEventPlayerStats(params: SyncTournamentMatchStorageParams) {
  const supabase = createServiceRoleSupabaseClient();
  const timestamp = new Date().toISOString();
  const events = await loadTargetEvents(params);
  const targetEvents = events.filter(
    (event) => params.eventIds?.length || event.status === "ongoing" || params.includeCompletedEvents
  );

  let insertedCount = 0;

  for (const event of targetEvents) {
    const scrapedRows = await scrapeTournamentStatsByEventId(event.vlr_event_id).catch(
      (error) => {
        console.warn(
          `Failed to scrape event stats for event ${event.vlr_event_id}:`,
          error
        );
        return [] as ScrapedTournamentPlayerStat[];
      }
    );

    if (scrapedRows.length === 0) {
      continue;
    }

    const { error: deleteError } = await supabase
      .from("event_player_stats")
      .delete()
      .eq("event_id", event.id);

    if (deleteError) {
      throw new Error(
        `Failed to clear existing event player stats for ${event.vlr_event_id}: ${deleteError.message}`
      );
    }

    const rows = scrapedRows.map((row) =>
      mapEventPlayerStatRow(event.id, row, timestamp)
    );

    const { error: insertError } = await supabase
      .from("event_player_stats")
      .insert(rows);

    if (insertError) {
      throw new Error(
        `Failed to insert event player stats for ${event.vlr_event_id}: ${insertError.message}`
      );
    }

    insertedCount += rows.length;
  }

  return insertedCount;
}

async function loadTargetMatches(params: SyncTournamentMatchStorageParams) {
  const supabase = createServiceRoleSupabaseClient();
  const matchDetailsLimit =
    typeof params.matchDetailsLimit === "number" &&
    Number.isFinite(params.matchDetailsLimit) &&
    params.matchDetailsLimit > 0
      ? Math.floor(params.matchDetailsLimit)
      : null;

  let query = supabase
    .from("matches")
    .select("id, vlr_match_id, slug, status, last_synced_at, scheduled_at");

  if (params.matchIds?.length) {
    query = query.in("vlr_match_id", params.matchIds);
  } else {
    query = query.in("status", ["live", "upcoming"]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load matches for detail sync: ${error.message}`);
  }

  const rows = (data ?? []) as MatchRow[];

  const getStatusPriority = (status: string) => {
    if (status === "live") {
      return 0;
    }

    if (status === "upcoming") {
      return 1;
    }

    return 2;
  };

  const getScheduledPriority = (value: string | null | undefined) => {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const getSyncedPriority = (value: string | null | undefined) => {
    if (!value) {
      return Number.MIN_SAFE_INTEGER;
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Number.MIN_SAFE_INTEGER : parsed;
  };

  const sortedRows = [...rows].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    const scheduledDiff =
      getScheduledPriority(a.scheduled_at) - getScheduledPriority(b.scheduled_at);

    if (scheduledDiff !== 0) {
      return scheduledDiff;
    }

    return getSyncedPriority(a.last_synced_at) - getSyncedPriority(b.last_synced_at);
  });

  return sortedRows.slice(0, matchDetailsLimit ?? 50);
}

async function syncMatchDetails(params: SyncTournamentMatchStorageParams) {
  const supabase = createServiceRoleSupabaseClient();
  const timestamp = new Date().toISOString();
  const matches = await loadTargetMatches(params);
  let syncedCount = 0;

  for (const match of matches) {
    if (syncedCount > 0) {
      await sleep(MATCH_DETAIL_REQUEST_DELAY_MS + Math.floor(Math.random() * 250));
    }

    const detailPayload = await fetchMatchDetailsFromUpstream(match.vlr_match_id).catch(
      (error) => {
        console.warn(
          `Failed to fetch match details for ${match.vlr_match_id}:`,
          error
        );
        return null;
      }
    );

    if (!detailPayload) {
      continue;
    }

    const { error } = await supabase.from("match_details").upsert(
      {
        match_id: match.id,
        status: detailPayload.status || match.status,
        source_version: DEFAULT_MATCH_DETAILS_SOURCE_VERSION,
        payload: detailPayload,
        last_synced_at: timestamp,
      },
      { onConflict: "match_id" }
    );

    if (error) {
      throw new Error(
        `Failed to upsert match details for ${match.vlr_match_id}: ${error.message}`
      );
    }

    syncedCount += 1;
  }

  return syncedCount;
}

export async function readStoredMatchDetailsByVlrMatchId(vlrMatchId: number) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, vlr_match_id, slug, event_title, event_series, team_1_name, team_2_name, team_1_score, team_2_score, match_url, scheduled_at, status, events(id, vlr_event_id, title, region, thumb, dates, prize), match_details(status, source_version, payload, last_synced_at)"
    )
    .eq("vlr_match_id", vlrMatchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load stored match details: ${error.message}`);
  }

  return data;
}

export async function syncTournamentMatchStorage(
  params: SyncTournamentMatchStorageParams = {}
): Promise<SyncTournamentMatchStorageResult> {
  const syncFlags = {
    ...DEFAULT_SYNC_FLAGS,
    syncEvents: params.syncEvents ?? DEFAULT_SYNC_FLAGS.syncEvents,
    syncMatches: params.syncMatches ?? DEFAULT_SYNC_FLAGS.syncMatches,
    syncEventPlayerStats:
      params.syncEventPlayerStats ?? DEFAULT_SYNC_FLAGS.syncEventPlayerStats,
    syncMatchDetails:
      params.syncMatchDetails ?? DEFAULT_SYNC_FLAGS.syncMatchDetails,
  };

  const syncedEvents = syncFlags.syncEvents ? (await syncEvents()).length : 0;
  const syncedMatches = syncFlags.syncMatches
    ? (await syncMatches(params)).length
    : 0;
  const syncedEventPlayerStats = syncFlags.syncEventPlayerStats
    ? await syncEventPlayerStats(params)
    : 0;
  const syncedMatchDetails = syncFlags.syncMatchDetails
    ? await syncMatchDetails(params)
    : 0;

  return {
    syncedEvents,
    syncedMatches,
    syncedEventPlayerStats,
    syncedMatchDetails,
  };
}
