import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type {
  TournamentBracketMatch,
  TournamentBracketRound,
  TournamentBracketSection,
  TournamentDetail,
  TournamentFeaturedMatch,
  TournamentInfoCard,
  TournamentMatchSummary,
  TournamentNewsItem,
  TournamentStatsSummaryItem,
} from "@/lib/tournaments/types";

interface EventRow {
  id: number;
  vlr_event_id: number;
  title: string;
  status: string | null;
  region: string | null;
  dates: string | null;
  prize: string | null;
  thumb: string | null;
  event_url: string | null;
}

interface MatchDetailPayload {
  teams?: Array<{
    logo?: string | null;
  }> | null;
}

interface MatchRow {
  id: number;
  vlr_match_id: number;
  event_id: number;
  event_title: string | null;
  event_series: string | null;
  team_1_name: string | null;
  team_2_name: string | null;
  team_1_score: string | null;
  team_2_score: string | null;
  scheduled_at: string | null;
  date_label: string | null;
  match_url: string | null;
  status: string | null;
  last_synced_at: string | null;
  match_details?: { payload?: MatchDetailPayload | null }[] | { payload?: MatchDetailPayload | null } | null;
}

interface EventPlayerStatsRow {
  player_name: string | null;
  team_name: string | null;
  rating: number | null;
  average_combat_score: number | null;
  kill_deaths: number | null;
  agents: string | null;
}

interface NewsCacheRow {
  segments?: TournamentNewsItem[] | null;
}

const NEWS_CACHE_KEY = "vlr-news-list";
const STOP_WORDS = new Set([
  "valorant",
  "champions",
  "tour",
  "stage",
  "event",
  "playoffs",
  "season",
  "league",
  "open",
  "cup",
  "vct",
  "2024",
  "2025",
  "2026",
  "2027",
]);

function normalizeStatus(status: string | null | undefined) {
  if (!status) {
    return "upcoming";
  }

  return status === "completed" ? "finished" : status;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function getTournamentSlug(eventUrl: string | null | undefined, title: string) {
  if (eventUrl) {
    const parts = eventUrl.replace(/^https?:\/\/[^/]+/i, "").split("/").filter(Boolean);
    const slugPart = parts[2];
    if (slugPart) {
      return slugify(slugPart);
    }
  }

  return slugify(title);
}

function getNestedMatchDetails(row: MatchRow) {
  return Array.isArray(row.match_details) ? row.match_details[0] : row.match_details;
}

function getMatchSlug(matchUrl: string | null | undefined, fallbackId: number) {
  if (!matchUrl) {
    return String(fallbackId);
  }

  const trimmed = matchUrl.replace(/^https?:\/\/www\.vlr\.gg\//i, "").replace(/^\/+/, "");
  const [, slug] = trimmed.split("/", 2);
  return slug || String(fallbackId);
}

function mapMatchRow(row: MatchRow, tournamentLogo: string): TournamentMatchSummary {
  const payload = getNestedMatchDetails(row)?.payload;
  const teams = payload?.teams ?? [];
  const slug = getMatchSlug(row.match_url, row.vlr_match_id);

  return {
    id: row.id,
    vlrMatchId: row.vlr_match_id,
    eventId: row.event_id,
    eventTitle: row.event_title || "",
    eventSeries: row.event_series || "TBD",
    team1: row.team_1_name || "TBD",
    team2: row.team_2_name || "TBD",
    team1Logo: teams[0]?.logo || "/valorantLogo.png",
    team2Logo: teams[1]?.logo || "/valorantLogo.png",
    tournamentLogo,
    score1: row.team_1_score || "",
    score2: row.team_2_score || "",
    scheduledAt: row.scheduled_at,
    dateLabel: row.date_label || "",
    matchUrl: row.match_url || `https://www.vlr.gg/${row.vlr_match_id}/${slug}`,
    status: row.status || "upcoming",
    slug,
  };
}

function getTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortMatches(rows: TournamentMatchSummary[]) {
  return [...rows].sort((a, b) => {
    const aTime = getTimestamp(a.scheduledAt);
    const bTime = getTimestamp(b.scheduledAt);

    if (aTime !== null && bTime !== null) {
      return aTime - bTime;
    }

    if (aTime !== null) {
      return -1;
    }

    if (bTime !== null) {
      return 1;
    }

    return a.vlrMatchId - b.vlrMatchId;
  });
}

function pickFeaturedMatch(matches: TournamentMatchSummary[]): TournamentFeaturedMatch | null {
  const live = matches.find((match) => match.status === "live");
  if (live) {
    return { ...live, emphasisLabel: "Live now" };
  }

  const upcoming = sortMatches(
    matches.filter((match) => match.status === "upcoming")
  )[0];
  if (upcoming) {
    return { ...upcoming, emphasisLabel: "Next match" };
  }

  const completed = [...matches]
    .filter((match) => match.status === "completed")
    .sort((a, b) => {
      const aTime = getTimestamp(a.scheduledAt) ?? 0;
      const bTime = getTimestamp(b.scheduledAt) ?? 0;
      return bTime - aTime;
    })[0];

  return completed ? { ...completed, emphasisLabel: "Latest result" } : null;
}

function getKeywordTokens(event: EventRow) {
  const source = `${event.title} ${event.region ?? ""}`.toLowerCase();
  return source
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

function filterNewsForEvent(event: EventRow, items: TournamentNewsItem[]) {
  const tokens = getKeywordTokens(event);

  if (tokens.length === 0) {
    return items.slice(0, 4);
  }

  const scored = items
    .map((item) => {
      const haystack = `${item.title} ${item.description}`.toLowerCase();
      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0
      );

      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  const filtered = scored.filter((entry) => entry.score > 0).map((entry) => entry.item);
  return (filtered.length > 0 ? filtered : items).slice(0, 4);
}

function normalizeRoundLabel(label: string | null | undefined) {
  const raw = (label || "Stage").trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes("grand final")) {
    return { key: "grand-final", title: "Grand Final", order: 900, elimination: true };
  }
  if (normalized === "final" || normalized.includes(" final")) {
    return { key: "final", title: "Final", order: 850, elimination: true };
  }
  if (normalized.includes("upper final")) {
    return { key: "upper-final", title: "Upper Final", order: 700, elimination: true };
  }
  if (normalized.includes("lower final")) {
    return { key: "lower-final", title: "Lower Final", order: 710, elimination: true };
  }
  if (normalized.includes("semifinal")) {
    return { key: "semifinal", title: "Semifinal", order: 600, elimination: true };
  }
  if (normalized.includes("quarterfinal")) {
    return { key: "quarterfinal", title: "Quarterfinal", order: 500, elimination: true };
  }

  const upperMatch = normalized.match(/upper.*?(round\s*\d+|r\d+|final)/);
  if (upperMatch) {
    return {
      key: `upper-${slugify(upperMatch[1])}`,
      title: raw,
      order: 300 + Number(upperMatch[1].match(/\d+/)?.[0] || 0),
      elimination: true,
    };
  }

  const lowerMatch = normalized.match(/lower.*?(round\s*\d+|r\d+|final)/);
  if (lowerMatch) {
    return {
      key: `lower-${slugify(lowerMatch[1])}`,
      title: raw,
      order: 320 + Number(lowerMatch[1].match(/\d+/)?.[0] || 0),
      elimination: true,
    };
  }

  if (
    normalized.includes("bracket") ||
    normalized.includes("elim") ||
    normalized.includes("playoff")
  ) {
    return { key: slugify(raw), title: raw, order: 400, elimination: true };
  }

  return { key: slugify(raw) || "stage", title: raw, order: 100, elimination: false };
}

function buildBracketSection(matches: TournamentMatchSummary[]): TournamentBracketSection {
  const grouped = new Map<string, TournamentBracketRound>();
  let eliminationSignals = 0;

  for (const match of matches) {
    const roundInfo = normalizeRoundLabel(match.eventSeries);
    if (roundInfo.elimination) {
      eliminationSignals += 1;
    }

    const existing = grouped.get(roundInfo.key);
    const mappedMatch: TournamentBracketMatch = {
      id: match.id,
      vlrMatchId: match.vlrMatchId,
      label: match.dateLabel || match.eventSeries,
      team1: match.team1,
      team2: match.team2,
      team1Logo: match.team1Logo,
      team2Logo: match.team2Logo,
      score1: match.score1,
      score2: match.score2,
      status: match.status,
      matchHref: `/matches/${match.vlrMatchId}/${match.slug}`,
    };

    if (existing) {
      existing.matches.push(mappedMatch);
      continue;
    }

    grouped.set(roundInfo.key, {
      key: roundInfo.key,
      title: roundInfo.title,
      order: roundInfo.order,
      matches: [mappedMatch],
    });
  }

  const rounds = [...grouped.values()]
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map((round) => ({
      ...round,
      matches: [...round.matches].sort((a, b) => a.vlrMatchId - b.vlrMatchId),
    }));

  const layout: "bracket" | "stage-board" =
    eliminationSignals >= 2 && rounds.length >= 2 ? "bracket" : "stage-board";

  return { layout, rounds };
}

async function loadNewsForEvent(event: EventRow) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("news_articles_cache")
    .select("segments")
    .eq("cache_key", NEWS_CACHE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read news cache: ${error.message}`);
  }

  const row = data as NewsCacheRow | null;
  const items = Array.isArray(row?.segments) ? row.segments : [];
  return filterNewsForEvent(event, items);
}

async function loadStatsSummary(eventId: number) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("event_player_stats")
    .select("player_name, team_name, rating, average_combat_score, kill_deaths, agents")
    .eq("event_id", eventId)
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    throw new Error(`Failed to read event stats: ${error.message}`);
  }

  return ((data ?? []) as EventPlayerStatsRow[]).map((row) => ({
    playerName: row.player_name || "Unknown Player",
    teamName: row.team_name || "Unknown Team",
    rating: row.rating,
    averageCombatScore: row.average_combat_score,
    killDeaths: row.kill_deaths,
    agents: row.agents || "",
  }));
}

export async function getTournamentDetailByVlrEventId(
  vlrEventId: number
): Promise<TournamentDetail | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id, vlr_event_id, title, status, region, dates, prize, thumb, event_url")
    .eq("vlr_event_id", vlrEventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Failed to read event details: ${eventError.message}`);
  }

  const event = eventData as EventRow | null;

  if (!event) {
    return null;
  }

  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, vlr_match_id, event_id, event_title, event_series, team_1_name, team_2_name, team_1_score, team_2_score, scheduled_at, date_label, match_url, status, last_synced_at, match_details(payload)"
    )
    .eq("event_id", event.id)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (matchError) {
    throw new Error(`Failed to read event matches: ${matchError.message}`);
  }

  const tournamentInfo: TournamentInfoCard = {
    id: event.id,
    vlrEventId: event.vlr_event_id,
    title: event.title,
    status: normalizeStatus(event.status),
    region: event.region || "TBD",
    dates: event.dates || "TBD",
    prize: event.prize || "TBD",
    thumb: event.thumb || "/valorantLogo.png",
    urlPath: event.event_url || "",
    canonicalSlug: getTournamentSlug(event.event_url, event.title),
  };

  const mappedMatches = sortMatches(
    ((matchData ?? []) as MatchRow[]).map((row) => mapMatchRow(row, tournamentInfo.thumb))
  );

  const [news, statsSummary] = await Promise.all([
    loadNewsForEvent(event).catch((error) => {
      console.error(error);
      return [] as TournamentNewsItem[];
    }),
    loadStatsSummary(event.id).catch((error) => {
      console.error(error);
      return [] as TournamentStatsSummaryItem[];
    }),
  ]);

  return {
    event: tournamentInfo,
    matches: mappedMatches,
    featuredMatch: pickFeaturedMatch(mappedMatches),
    bracket: buildBracketSection(mappedMatches),
    news,
    statsSummary,
  };
}
