import type { ParsedQuery } from "./parseQuery";
import { createServiceRoleSupabaseClient } from "../supabase/server";

export interface RetrievedStatRow {
  id: string;
  player: string;
  team: string;
  region: string;
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
    source: "supabase" | "mock" | "event_storage";
    appliedRegion: string;
    appliedTimespanDays: number | "all";
    appliedEventGroupId: number | null;
    appliedEventName?: string | null;
    rowCount: number;
  };
  contextData: {
    event?: {
      id: number;
      vlrEventId: number;
      title: string;
      status: string;
      region: string | null;
      dates: string | null;
      prize: string | null;
    } | null;
    matches?: Array<{
      vlrMatchId: number;
      eventTitle: string | null;
      eventSeries: string | null;
      team1: string | null;
      team2: string | null;
      score1: string | null;
      score2: string | null;
      status: string;
      scheduledAt: string | null;
      dateLabel: string | null;
      matchUrl: string;
    }>;
  };
}

interface AggregatedPlayerStatsRow {
  id: string;
  player_name: string;
  team_name: string | null;
  region: string;
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

interface StoredEventRow {
  id: number;
  vlr_event_id: number;
  title: string;
  status: string;
  region: string | null;
  dates: string | null;
  prize: string | null;
}

interface EventPlayerStatsRow {
  id: number | string;
  player_name: string | null;
  team_name: string | null;
  agents: string[] | null;
  rounds_played: number | string | null;
  rating: number | string | null;
  average_combat_score: number | string | null;
  kill_deaths: number | string | null;
  kill_assists_survived_traded: number | string | null;
  average_damage_per_round: number | string | null;
  kills_per_round: number | string | null;
  assists_per_round: number | string | null;
  first_kills_per_round: number | string | null;
  first_deaths_per_round: number | string | null;
  headshot_percentage: number | string | null;
  clutch_success_percentage: number | string | null;
}

interface StoredMatchRow {
  vlr_match_id: number;
  event_title: string | null;
  event_series: string | null;
  team_1_name: string | null;
  team_2_name: string | null;
  team_1_score: string | null;
  team_2_score: string | null;
  status: string;
  scheduled_at: string | null;
  date_label: string | null;
  match_url: string;
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

function normalizeForSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getStoredRegions(region?: ParsedQuery["filters"]["region"]): string[] {
  switch (region) {
    case "emea":
      return ["emea", "eu"];
    case "global":
    case undefined:
      return [];
    default:
      return [region];
  }
}

function getEventSearchPhrases(question: string): string[] {
  const normalizedQuestion = normalizeForSearch(question);
  const specificPhrases: string[] = [];
  const genericPhrases: string[] = [];
  const regions = [
    { key: "emea", aliases: ["emea"] },
    { key: "americas", aliases: ["americas"] },
    { key: "na", aliases: ["na", "north america"] },
    { key: "pacific", aliases: ["pacific", "asia pacific"] },
    { key: "br", aliases: ["br", "brazil"] },
  ] as const;

  if (normalizedQuestion.includes("vct 2026")) {
    for (const region of regions) {
      if (region.aliases.some((alias) => normalizedQuestion.includes(alias))) {
        specificPhrases.push(`vct 2026 ${region.key}`);
        specificPhrases.push(`valorant champions tour 2026 ${region.key}`);
        specificPhrases.push(`champions tour 2026 ${region.key}`);
      }
    }

    genericPhrases.push("vct 2026");
    genericPhrases.push("valorant champions tour 2026");
    genericPhrases.push("champions tour 2026");
  }

  return [...specificPhrases, ...genericPhrases];
}

function getEventRegionHints(question: string) {
  const normalizedQuestion = normalizeForSearch(question);

  if (normalizedQuestion.includes("americas")) {
    return {
      titleAliases: ["americas"],
      regionCodes: ["us", "americas", "na"],
    };
  }

  if (normalizedQuestion.includes("emea")) {
    return {
      titleAliases: ["emea"],
      regionCodes: ["de", "emea", "eu"],
    };
  }

  if (
    normalizedQuestion.includes("pacific") ||
    normalizedQuestion.includes("asia pacific")
  ) {
    return {
      titleAliases: ["pacific"],
      regionCodes: ["ap", "pacific"],
    };
  }

  if (
    normalizedQuestion.includes("north america") ||
    /\bna\b/.test(normalizedQuestion)
  ) {
    return {
      titleAliases: ["north america", "na"],
      regionCodes: ["us", "na"],
    };
  }

  if (
    normalizedQuestion.includes("brazil") ||
    /\bbr\b/.test(normalizedQuestion)
  ) {
    return {
      titleAliases: ["brazil", "br"],
      regionCodes: ["br"],
    };
  }

  return null;
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

function mapEventPlayerStatsRow(
  row: EventPlayerStatsRow,
  eventTitle: string
): RetrievedStatRow {
  return {
    id: String(row.id),
    player: row.player_name || "Unknown Player",
    team: row.team_name || "Unknown Team",
    region: eventTitle,
    agents: row.agents || [],
    rating: toNumber(row.rating),
    acs: toNumber(row.average_combat_score),
    kd: toNumber(row.kill_deaths),
    kastPercentage: toNumber(row.kill_assists_survived_traded),
    adr: toNumber(row.average_damage_per_round),
    hsPercentage: toNumber(row.headshot_percentage),
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
  const storedRegions = getStoredRegions(region);
  const playerFilters = getRequestedPlayers(parsedQuery);
  const teamFilter = parsedQuery.filters.team?.toLowerCase();
  const agentFilter = parsedQuery.filters.agent?.toLowerCase();
  const minRounds = parsedQuery.filters.minRounds;

  let filteredRows = rows;

  if (storedRegions.length > 0) {
    filteredRows = filteredRows.filter(
      (row) => storedRegions.includes(row.region.toLowerCase())
    );
  }

  if (playerFilters.length > 0) {
    filteredRows = filteredRows.filter((row) =>
      playerFilters.some((requested) =>
        row.player.toLowerCase().includes(requested)
      )
    );
  }

  if (teamFilter) {
    filteredRows = filteredRows.filter((row) =>
      row.team.toLowerCase().includes(teamFilter)
    );
  }

  if (agentFilter) {
    filteredRows = filteredRows.filter((row) =>
      row.agents.some((agent) => agent.toLowerCase() === agentFilter)
    );
  }

  if (typeof minRounds === "number") {
    filteredRows = filteredRows.filter((row) => row.roundsPlayed >= minRounds);
  }

  return filteredRows;
}

function getRequestedPlayers(parsedQuery: ParsedQuery): string[] {
  const requestedPlayers = [
    parsedQuery.filters.player,
    ...(parsedQuery.comparisonPlayers ?? []),
  ];

  return requestedPlayers
    .map((player) => player?.trim().toLowerCase())
    .filter((player): player is string => Boolean(player));
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

function getEventStatMetricColumn(metric: ParsedQuery["metric"]): string {
  switch (metric) {
    case "acs":
      return "average_combat_score";
    case "kd":
      return "kill_deaths";
    case "adr":
      return "average_damage_per_round";
    case "kpr":
      return "kills_per_round";
    case "apr":
      return "assists_per_round";
    case "fkpr":
      return "first_kills_per_round";
    case "fdpr":
      return "first_deaths_per_round";
    case "kast_percentage":
      return "kill_assists_survived_traded";
    case "clutch_success_percentage":
      return "clutch_success_percentage";
    case "rounds_played":
      return "rounds_played";
    case "hs_percentage":
      return "headshot_percentage";
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
    const supabase = createServiceRoleSupabaseClient();
    const region = parsedQuery.filters.region;
    const storedRegions = getStoredRegions(region);
    const timespanDays = parsedQuery.filters.timespanDays ?? 30;
    const eventGroupId = parsedQuery.filters.eventGroupId ?? null;
    const requestedPlayers = getRequestedPlayers(parsedQuery);
    const metricColumn = getSupabaseMetricColumn(parsedQuery.metric);
    const teamFilter = parsedQuery.filters.team?.trim();
    const minRounds = parsedQuery.filters.minRounds;

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

    if (storedRegions.length === 1) {
      query = query.eq("region", storedRegions[0]);
    } else if (storedRegions.length > 1) {
      query = query.in("region", storedRegions);
    }

    query =
      eventGroupId === null
        ? query.is("event_group_id", null)
        : query.eq("event_group_id", eventGroupId);

    if (teamFilter) {
      query = query.ilike("team_name", `%${teamFilter}%`);
    }

    if (typeof minRounds === "number") {
      query = query.gte("rounds_played", minRounds);
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

async function findReferencedEvent(question: string) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, vlr_event_id, title, status, region, dates, prize")
      .limit(300);

    if (error) {
      console.error("Event lookup error:", error.message);
      return null;
    }

    const normalizedQuestion = normalizeForSearch(question);
    const prioritizedPhrases = getEventSearchPhrases(question);
    const regionHints = getEventRegionHints(question);
    let bestMatch: StoredEventRow | null = null;
    let bestScore = 0;

    for (const event of (data ?? []) as StoredEventRow[]) {
      const normalizedTitle = normalizeForSearch(event.title);
      const normalizedRegion = normalizeForSearch(event.region ?? "");

      if (!normalizedTitle) {
        continue;
      }

      let bonusScore = 0;

      if (regionHints) {
        if (
          regionHints.titleAliases.some((alias) =>
            normalizedTitle.includes(normalizeForSearch(alias))
          )
        ) {
          bonusScore += 300;
        }

        if (
          normalizedRegion &&
          regionHints.regionCodes.some((code) => normalizedRegion === code)
        ) {
          bonusScore += 50;
        }
      }

      const matchedPhrase = prioritizedPhrases.find((phrase) =>
        normalizedTitle.includes(phrase)
      );

      if (matchedPhrase) {
        const score = matchedPhrase.length + 5000 + bonusScore;

        if (score > bestScore) {
          bestMatch = event;
          bestScore = score;
        }

        continue;
      }

      if (normalizedQuestion.includes(normalizedTitle)) {
        const score = normalizedTitle.length + 1000 + bonusScore;

        if (score > bestScore) {
          bestMatch = event;
          bestScore = score;
        }

        continue;
      }

      const titleWords = normalizedTitle.split(" ").filter(Boolean);
      const matchedWords = titleWords.filter((word) =>
        normalizedQuestion.includes(word)
      ).length;
      const titleCoverage = matchedWords / titleWords.length;

      if (
        matchedWords >= 3 &&
        titleCoverage >= 0.6 &&
        matchedWords + bonusScore > bestScore
      ) {
        bestMatch = event;
        bestScore = matchedWords + bonusScore;
      }
    }

    return bestMatch;
  } catch (error: any) {
    console.error("Referenced event lookup failed:", error.message);
    return null;
  }
}

async function retrieveEventStatsFromSupabase(params: {
  parsedQuery: ParsedQuery;
  event: StoredEventRow;
}): Promise<RetrievedStatRow[] | null> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const requestedPlayers = getRequestedPlayers(params.parsedQuery);
    const metricColumn = getEventStatMetricColumn(params.parsedQuery.metric);
    const teamFilter = params.parsedQuery.filters.team?.trim();
    const minRounds = params.parsedQuery.filters.minRounds;

    let query = supabase
      .from("event_player_stats")
      .select(
        "id, player_name, team_name, agents, rounds_played, rating, average_combat_score, kill_deaths, kill_assists_survived_traded, average_damage_per_round, kills_per_round, assists_per_round, first_kills_per_round, first_deaths_per_round, headshot_percentage, clutch_success_percentage"
      )
      .eq("event_id", params.event.id)
      .order(metricColumn, { ascending: false });

    if (teamFilter) {
      query = query.ilike("team_name", `%${teamFilter}%`);
    }

    if (typeof minRounds === "number") {
      query = query.gte("rounds_played", minRounds);
    }

    if (requestedPlayers.length === 1) {
      query = query.ilike("player_name", `%${requestedPlayers[0]}%`);
    } else if (requestedPlayers.length > 1) {
      const orFilters = requestedPlayers
        .map((player) => `player_name.ilike.%${player}%`)
        .join(",");
      query = query.or(orFilters);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Event stats retrieve error:", error.message);
      return null;
    }

    const mappedRows = ((data ?? []) as EventPlayerStatsRow[]).map((row) =>
      mapEventPlayerStatsRow(row, params.event.title)
    );

    return applyLocalFilters(mappedRows, params.parsedQuery);
  } catch (error: any) {
    console.error("Event stats storage lookup failed:", error.message);
    return null;
  }
}

async function retrieveEventMatchesFromSupabase(event: StoredEventRow) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("matches")
      .select(
        "vlr_match_id, event_title, event_series, team_1_name, team_2_name, team_1_score, team_2_score, status, scheduled_at, date_label, match_url"
      )
      .eq("event_id", event.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(20);

    if (error) {
      console.error("Event match lookup error:", error.message);
      return [];
    }

    return ((data ?? []) as StoredMatchRow[]).map((row) => ({
      vlrMatchId: row.vlr_match_id,
      eventTitle: row.event_title,
      eventSeries: row.event_series,
      team1: row.team_1_name,
      team2: row.team_2_name,
      score1: row.team_1_score,
      score2: row.team_2_score,
      status: row.status,
      scheduledAt: row.scheduled_at,
      dateLabel: row.date_label,
      matchUrl: row.match_url,
    }));
  } catch (error: any) {
    console.error("Event match storage lookup failed:", error.message);
    return [];
  }
}

function isEventContextQuestion(question: string) {
  return /\b(event|tournament|schedule|matches?|upcoming|live|when|date|prize|region|status)\b/i.test(
    question
  );
}

export async function retrieveStats(
  parsedQuery: ParsedQuery
): Promise<RetrievedStatsResult> {
  const region = parsedQuery.filters.region ?? "global";
  const timespanDays = parsedQuery.filters.timespanDays ?? 30;
  const eventGroupId = parsedQuery.filters.eventGroupId ?? null;
  const metricSortKey = getMetricSortKey(parsedQuery.metric);
  const canUseMockFallback = process.env.NODE_ENV !== "production";
  const referencedEvent = await findReferencedEvent(parsedQuery.normalizedQuestion);

  if (referencedEvent) {
    const [eventRows, eventMatches] = await Promise.all([
      retrieveEventStatsFromSupabase({
        parsedQuery,
        event: referencedEvent,
      }),
      isEventContextQuestion(parsedQuery.normalizedQuestion)
        ? retrieveEventMatchesFromSupabase(referencedEvent)
        : Promise.resolve([]),
    ]);

    if (eventRows !== null) {
      const sortedRows = [...eventRows].sort(
        (a, b) => Number(b[metricSortKey]) - Number(a[metricSortKey])
      );

      return {
        rows: sortedRows.slice(0, 10),
        retrievalMeta: {
          source: "event_storage",
          appliedRegion: region,
          appliedTimespanDays: timespanDays,
          appliedEventGroupId: eventGroupId,
          appliedEventName: referencedEvent.title,
          rowCount: eventRows.length,
        },
        contextData: {
          event: {
            id: referencedEvent.id,
            vlrEventId: referencedEvent.vlr_event_id,
            title: referencedEvent.title,
            status: referencedEvent.status,
            region: referencedEvent.region,
            dates: referencedEvent.dates,
            prize: referencedEvent.prize,
          },
          matches: eventMatches,
        },
      };
    }
  }

  const supabaseRows = await retrieveStatsFromSupabase(parsedQuery);

  const rows =
    supabaseRows !== null
      ? [...supabaseRows].sort(
          (a, b) => Number(b[metricSortKey]) - Number(a[metricSortKey])
        )
      : canUseMockFallback
        ? applyLocalFilters(MOCK_PLAYER_STATS, parsedQuery).sort(
            (a, b) => Number(b[metricSortKey]) - Number(a[metricSortKey])
          )
        : [];

  return {
    rows: rows.slice(0, 10),
    retrievalMeta: {
      source:
        supabaseRows !== null || !canUseMockFallback ? "supabase" : "mock",
      appliedRegion: region,
      appliedTimespanDays: timespanDays,
      appliedEventGroupId: eventGroupId,
      appliedEventName: referencedEvent?.title ?? null,
      rowCount: rows.length,
    },
    contextData: {
      event: referencedEvent
        ? {
            id: referencedEvent.id,
            vlrEventId: referencedEvent.vlr_event_id,
            title: referencedEvent.title,
            status: referencedEvent.status,
            region: referencedEvent.region,
            dates: referencedEvent.dates,
            prize: referencedEvent.prize,
          }
        : null,
      matches: [],
    },
  };
}
