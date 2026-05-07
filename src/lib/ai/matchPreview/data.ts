import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getTournamentDetailByVlrEventId } from "@/lib/tournaments/detail";
import { readStoredMatchDetailsByVlrMatchId } from "@/lib/vlr-storage/sync";

export interface MatchPreviewHeadToHeadMatch {
  eventName: string;
  eventSeries: string;
  team1Score: string;
  team2Score: string;
  team1Win: boolean;
  team2Win: boolean;
  date: string;
  url: string;
}

export interface MatchPreviewContext {
  matchId: number;
  internalEventId: number | null;
  vlrEventId: number | null;
  eventTitle: string;
  eventSeries: string;
  team1: string;
  team2: string;
  displayDate: string;
  startTime: string;
  status: string;
  isCompleted: boolean;
  team1Score: string;
  team2Score: string;
  eventRegion: string | null;
  prizePool: string | null;
  eventDates: string | null;
  format: string | null;
  hasSyncedPlayerStats: boolean;
  headToHead: MatchPreviewHeadToHeadMatch[];
  headToHeadSummary: {
    team1Wins: number;
    team2Wins: number;
    draws: number;
  };
}

export interface TeamPreviewPlayer {
  player: string;
  team: string;
  rating: number;
  acs: number;
  kd: number;
  adr: number | null;
  kastPercentage: number | null;
  hsPercentage: number | null;
  firstKillsPerRound: number | null;
  clutchSuccessPercentage: number | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  roundsPlayed: number;
  sampleMatches?: number;
}

export interface TeamPreviewForm {
  teamName: string;
  timespanDays: 30 | 60 | 90 | "all";
  source: "recent_matches";
  sampleMatchCount: number;
  players: TeamPreviewPlayer[];
  topPlayersByRating: TeamPreviewPlayer[];
  topPlayersByAcs: TeamPreviewPlayer[];
  topRatedPlayer: TeamPreviewPlayer | null;
  topAcsPlayer: TeamPreviewPlayer | null;
  averageTop3Rating: number | null;
  averageTop3Acs: number | null;
}

export interface MatchPreviewEventContext {
  internalEventId: number | null;
  vlrEventId: number | null;
  title: string;
  status: string | null;
  region: string | null;
  dates: string | null;
  prize: string | null;
  tier: number | null;
}

export interface MatchStakeContext {
  isPlayoff: boolean;
  roundTitle: string | null;
  stakesSummary: string;
  winnerPath: string | null;
  loserPath: string | null;
  inferredFromBracket: boolean;
}

function normalizeMatchDate(raw: string) {
  if (!raw) {
    return "";
  }

  return raw.replace(/(\d{1,2})(\d{1,2}:\d{2}\s?[AP]M)/, "$1 $2");
}

function getDisplayDate(raw: string) {
  const normalized = normalizeMatchDate(raw);
  return normalized.replace(/\s\d{1,2}:\d{2}\s?[AP]M.*$/, "").trim();
}

function getStartTime(raw: string) {
  const normalized = normalizeMatchDate(raw);
  const match = normalized.match(/(\d{1,2}:\d{2}\s?[AP]M(?:\s?[A-Z]{3,4})?)/);
  return match ? match[1].trim() : "";
}

function cleanEventText(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .trim();
}

function deriveEventName(rawName?: string | null, rawSeries?: string | null) {
  const name = cleanEventText(rawName);
  const series = cleanEventText(rawSeries);

  if (!name) {
    return "";
  }

  if (series && name.endsWith(series)) {
    return name.slice(0, -series.length).trim();
  }

  return name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "").trim();

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function findFirstArray(
  record: Record<string, unknown>,
  keys: string[]
): unknown[] | null {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return null;
}

function parseHeadToHeadScore(rawScore?: string | number | null) {
  if (rawScore === null || rawScore === undefined) {
    return { team1Score: "", team2Score: "" };
  }

  const scoreText = String(rawScore).trim();

  if (!scoreText) {
    return { team1Score: "", team2Score: "" };
  }

  const delimitedMatch = scoreText.match(/^(\d+)\s*[-:]\s*(\d+)$/);

  if (delimitedMatch) {
    return {
      team1Score: delimitedMatch[1],
      team2Score: delimitedMatch[2],
    };
  }

  const digitsOnly = scoreText.replace(/\D/g, "");

  if (digitsOnly.length >= 2) {
    return {
      team1Score: digitsOnly[0] ?? "",
      team2Score: digitsOnly[1] ?? "",
    };
  }

  return { team1Score: scoreText, team2Score: "" };
}

function mapHeadToHeadMatch(h2h: Record<string, unknown>): MatchPreviewHeadToHeadMatch {
  const parsedScore = parseHeadToHeadScore(
    (h2h.score as string | number | null | undefined) ?? null
  );
  const teams = Array.isArray(h2h.teams) ? h2h.teams : [];
  const team1 = isRecord(teams[0]) ? teams[0] : null;
  const team2 = isRecord(teams[1]) ? teams[1] : null;

  return {
    eventName:
      String(h2h.event_name ?? h2h.event ?? "").trim(),
    eventSeries: String(h2h.event_series ?? "").trim(),
    team1Score: String(h2h.team1_score ?? parsedScore.team1Score ?? "").trim(),
    team2Score: String(h2h.team2_score ?? parsedScore.team2Score ?? "").trim(),
    team1Win:
      typeof h2h.team1_win === "boolean"
        ? h2h.team1_win
        : Boolean(team1?.is_winner),
    team2Win:
      typeof h2h.team2_win === "boolean"
        ? h2h.team2_win
        : Boolean(team2?.is_winner),
    date: String(h2h.date ?? "").trim(),
    url: String(h2h.url ?? "#").trim(),
  };
}

function hasSyncedPlayerStats(payload: Record<string, unknown> | null | undefined) {
  if (!payload) {
    return false;
  }

  const maps = Array.isArray(payload.maps) ? payload.maps : [];

  for (const map of maps) {
    if (!isRecord(map) || !isRecord(map.players)) {
      continue;
    }

    const team1Players = Array.isArray(map.players.team1) ? map.players.team1 : [];
    const team2Players = Array.isArray(map.players.team2) ? map.players.team2 : [];

    if (team1Players.length > 0 || team2Players.length > 0) {
      return true;
    }
  }

  const performance = payload.performance;

  if (Array.isArray(performance)) {
    return performance.length > 0;
  }

  if (isRecord(performance)) {
    return true;
  }

  return false;
}

function buildFallbackPreviewFromTeamForms(params: {
  matchContext: MatchPreviewContext;
  team1Form?: TeamPreviewForm | null;
  team2Form?: TeamPreviewForm | null;
  eventContext?: MatchPreviewEventContext | null;
  stakes?: MatchStakeContext | null;
}) {
  const { matchContext, team1Form, team2Form, eventContext, stakes } = params;
  const previewParts: string[] = [];
  const eventLabel = eventContext?.title || matchContext.eventTitle;
  const stageLabel = matchContext.eventSeries || "scheduled stage";
  const whenLabel = matchContext.displayDate
    ? `${matchContext.displayDate}${matchContext.startTime ? ` at ${matchContext.startTime}` : ""}`
    : "a time that has not been posted yet";

  previewParts.push(
    `${matchContext.team1} vs ${matchContext.team2} is scheduled for ${whenLabel} in ${eventLabel}${stageLabel ? ` (${stageLabel})` : ""}.`
  );

  const featuredTeamLines = [team1Form, team2Form]
    .filter((teamForm): teamForm is TeamPreviewForm => Boolean(teamForm))
    .map((teamForm) => {
      const topRated = teamForm.topRatedPlayer;
      const topAcs = teamForm.topAcsPlayer;

      if (!topRated && !topAcs) {
        return null;
      }

      if (topRated && topAcs && topRated.player !== topAcs.player) {
        const topRatedDetail =
          teamForm.source === "recent_matches" && topRated.kills !== null && topRated.deaths !== null
            ? `${topRated.kills}-${topRated.deaths} K-D across ${topRated.sampleMatches ?? teamForm.sampleMatchCount} recent matches`
            : `${topRated.kd} K/D${topRated.adr !== null ? ` and ${topRated.adr} ADR` : ""}`;
        return `${teamForm.teamName} is led by ${topRated.player} with a ${topRated.rating} rating and ${topRatedDetail}, while ${topAcs.player} brings a team-best ${topAcs.acs} ACS over ${teamForm.source === "recent_matches" ? `${teamForm.sampleMatchCount} stored recent matches` : teamForm.timespanDays === "all" ? "all available matches" : `the last ${teamForm.timespanDays} days`}.`;
      }

      const featuredPlayer = topRated ?? topAcs;
      return featuredPlayer
        ? `${teamForm.teamName}'s key player is ${featuredPlayer.player}, posting ${featuredPlayer.rating} rating, ${featuredPlayer.acs} ACS, ${featuredPlayer.kd} K/D${featuredPlayer.adr !== null ? `, and ${featuredPlayer.adr} ADR` : ""}${teamForm.source === "recent_matches" ? ` across ${featuredPlayer.sampleMatches ?? teamForm.sampleMatchCount} recent stored matches` : ` over ${featuredPlayer.roundsPlayed} rounds`}.`
        : null;
    })
    .filter((line): line is string => Boolean(line));

  previewParts.push(...featuredTeamLines);

  const averageLines = [team1Form, team2Form]
    .filter((teamForm): teamForm is TeamPreviewForm => Boolean(teamForm))
    .map((teamForm) => {
      if (
        teamForm.averageTop3Rating === null ||
        teamForm.averageTop3Acs === null
      ) {
        return null;
      }

      return `${teamForm.teamName}'s top-three core is averaging ${teamForm.averageTop3Rating} rating and ${teamForm.averageTop3Acs} ACS${teamForm.source === "recent_matches" ? ` across ${teamForm.sampleMatchCount} recent stored matches` : ""}.`;
    })
    .filter((line): line is string => Boolean(line));

  previewParts.push(...averageLines);

  if (stakes?.stakesSummary) {
    previewParts.push(stakes.stakesSummary);
  }

  if (stakes?.winnerPath) {
    previewParts.push(stakes.winnerPath);
  }

  if (stakes?.loserPath) {
    previewParts.push(stakes.loserPath);
  }

  if (matchContext.headToHead.length > 0) {
    previewParts.push(
      `In recent head-to-head meetings, ${matchContext.team1} has ${matchContext.headToHeadSummary.team1Wins} wins and ${matchContext.team2} has ${matchContext.headToHeadSummary.team2Wins}.`
    );
  }

  if (matchContext.prizePool) {
    previewParts.push(`The event prize pool is ${matchContext.prizePool}.`);
  }

  return previewParts.join(" ");
}

export async function getMatchContext(
  matchId: number
): Promise<MatchPreviewContext | null> {
  const storedMatch = await readStoredMatchDetailsByVlrMatchId(matchId);

  if (!storedMatch || typeof storedMatch !== "object") {
    return null;
  }

  const eventData = Array.isArray(storedMatch.events)
    ? storedMatch.events[0]
    : storedMatch.events;
  const matchDetails = Array.isArray(storedMatch.match_details)
    ? storedMatch.match_details[0]
    : storedMatch.match_details;
  const payload =
    matchDetails && typeof matchDetails === "object" && "payload" in matchDetails
      ? (matchDetails.payload as Record<string, unknown> | null | undefined)
      : null;
  const dateRaw = String(payload?.date ?? "").trim();
  const status = String(payload?.status ?? storedMatch.status ?? "").trim();
  const headToHeadSource = Array.isArray(payload?.head_to_head)
    ? payload.head_to_head
    : [];
  const headToHead = headToHeadSource
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map(mapHeadToHeadMatch);
  const headToHeadSummary = headToHead.reduce(
    (summary, match) => {
      if (match.team1Win) {
        summary.team1Wins += 1;
      } else if (match.team2Win) {
        summary.team2Wins += 1;
      } else {
        summary.draws += 1;
      }

      return summary;
    },
    { team1Wins: 0, team2Wins: 0, draws: 0 }
  );
  const eventTitle =
    storedMatch.event_title ||
    (eventData?.title as string | null | undefined) ||
    deriveEventName(
      payload?.event && isRecord(payload.event) ? String(payload.event.name ?? "") : "",
      payload?.event && isRecord(payload.event) ? String(payload.event.series ?? "") : ""
    ) ||
    "Unknown Event";
  const eventSeries =
    cleanEventText(
      payload?.event && isRecord(payload.event)
        ? String(payload.event.series ?? "")
        : storedMatch.event_series ?? ""
    ) || "TBD";
  const team1 = String(
    (Array.isArray(payload?.teams) && isRecord(payload.teams[0]) ? payload.teams[0].name : undefined) ??
      storedMatch.team_1_name ??
      "Unknown Team"
  ).trim();
  const team2 = String(
    (Array.isArray(payload?.teams) && isRecord(payload.teams[1]) ? payload.teams[1].name : undefined) ??
      storedMatch.team_2_name ??
      "Unknown Team"
  ).trim();
  const team1Score = String(
    (Array.isArray(payload?.teams) && isRecord(payload.teams[0]) ? payload.teams[0].score : undefined) ??
      storedMatch.team_1_score ??
      ""
  ).trim();
  const team2Score = String(
    (Array.isArray(payload?.teams) && isRecord(payload.teams[1]) ? payload.teams[1].score : undefined) ??
      storedMatch.team_2_score ??
      ""
  ).trim();

  return {
    matchId,
    internalEventId:
      eventData && typeof eventData === "object" && "id" in eventData
        ? Number(eventData.id ?? null) || null
        : null,
    vlrEventId:
      eventData && typeof eventData === "object" && "vlr_event_id" in eventData
        ? Number(eventData.vlr_event_id ?? null) || null
        : null,
    eventTitle,
    eventSeries,
    team1,
    team2,
    displayDate: getDisplayDate(dateRaw),
    startTime: getStartTime(dateRaw),
    status,
    isCompleted:
      Boolean(team1Score && team2Score) ||
      /completed|finished/i.test(status),
    team1Score,
    team2Score,
    eventRegion:
      eventData && typeof eventData === "object" && "region" in eventData
        ? String(eventData.region ?? "").trim() || null
        : null,
    prizePool:
      eventData && typeof eventData === "object" && "prize" in eventData
        ? String(eventData.prize ?? "").trim() || null
        : null,
    eventDates:
      eventData && typeof eventData === "object" && "dates" in eventData
        ? String(eventData.dates ?? "").trim() || null
        : null,
    format: cleanEventText(String(payload?.format ?? "").trim()) || null,
    hasSyncedPlayerStats: hasSyncedPlayerStats(payload),
    headToHead,
    headToHeadSummary,
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function isPlaceholderTeam(value: string | null | undefined) {
  const normalized = (value || "").trim().toLowerCase();

  return (
    !normalized ||
    normalized === "tbd" ||
    normalized === "tba" ||
    normalized.includes("winner of") ||
    normalized.includes("loser of")
  );
}

function findWaitingMatch(
  rounds: Array<{ title: string; order: number; matches: Array<{ team1: string; team2: string }> }>,
  currentOrder: number,
  roundMatcher: (title: string) => boolean
) {
  const futureRounds = rounds
    .filter((round) => round.order > currentOrder && roundMatcher(round.title))
    .sort((a, b) => a.order - b.order);

  for (const round of futureRounds) {
    const waitingMatch = round.matches.find((match) => {
      const placeholderCount = Number(isPlaceholderTeam(match.team1)) + Number(isPlaceholderTeam(match.team2));
      return placeholderCount === 1;
    });

    if (waitingMatch) {
      const knownOpponent = isPlaceholderTeam(waitingMatch.team1)
        ? waitingMatch.team2
        : waitingMatch.team1;

      return {
        roundTitle: round.title,
        opponent: isPlaceholderTeam(knownOpponent) ? null : knownOpponent,
      };
    }
  }

  return null;
}

export async function getMatchStakes(
  matchContext: MatchPreviewContext
): Promise<MatchStakeContext | null> {
  if (!matchContext.vlrEventId) {
    return null;
  }

  const tournament = await getTournamentDetailByVlrEventId(matchContext.vlrEventId);

  if (!tournament) {
    return null;
  }

  const rounds = tournament.bracket.rounds;
  const currentRound =
    rounds.find((round) =>
      round.matches.some((match) => match.vlrMatchId === matchContext.matchId)
    ) ??
    rounds.find(
      (round) => round.title.toLowerCase() === matchContext.eventSeries.toLowerCase()
    ) ??
    null;

  const roundTitle = currentRound?.title ?? matchContext.eventSeries ?? null;
  const normalized = (roundTitle || "").toLowerCase();
  const isPlayoff =
    tournament.bracket.layout === "bracket" ||
    normalized.includes("upper") ||
    normalized.includes("lower") ||
    normalized.includes("playoff") ||
    normalized.includes("final") ||
    normalized.includes("quarter") ||
    normalized.includes("semi");

  if (!isPlayoff) {
    return {
      isPlayoff: false,
      roundTitle,
      stakesSummary: "This match is part of the current event schedule but does not appear to be a playoff elimination match.",
      winnerPath: null,
      loserPath: null,
      inferredFromBracket: false,
    };
  }

  const currentOrder = currentRound?.order ?? 0;
  let stakesSummary = "This playoff match will shape the next stage of the bracket.";
  let winnerPath: string | null = null;
  let loserPath: string | null = null;

  if (normalized.includes("grand final")) {
    stakesSummary = "This is the Grand Final. The winner claims the event title, while the loser finishes runner-up.";
  } else if (normalized.includes("upper final")) {
    stakesSummary =
      "This is an upper-bracket final. The winner reaches the Grand Final, while the loser drops into the lower final.";
  } else if (normalized.includes("lower final")) {
    stakesSummary =
      "This is a lower-bracket final. The winner advances to the Grand Final, while the loser is eliminated.";
  } else if (normalized.includes("lower")) {
    stakesSummary =
      "This is a lower-bracket playoff match. The winner stays alive, while the loser is eliminated from the event.";
  } else if (normalized.includes("upper")) {
    stakesSummary =
      "This is an upper-bracket playoff match. The winner advances in the upper bracket, while the loser drops into the lower bracket.";
  } else if (normalized.includes("final")) {
    stakesSummary =
      "This is a playoff final-stage match with advancement on the line for the winner.";
  } else if (normalized.includes("quarter") || normalized.includes("semi")) {
    stakesSummary =
      "This is a playoff elimination-stage match. The winner moves deeper into the bracket, while the loser exits the event.";
  }

  const upperNext = findWaitingMatch(
    rounds,
    currentOrder,
    (title) =>
      /upper|grand final|final/i.test(title)
  );
  const lowerNext = findWaitingMatch(
    rounds,
    currentOrder,
    (title) => /lower/i.test(title)
  );

  if (normalized.includes("upper")) {
    if (upperNext) {
      winnerPath = upperNext.opponent
        ? `Winner likely advances to ${upperNext.roundTitle} against ${upperNext.opponent}.`
        : `Winner likely advances to ${upperNext.roundTitle}.`;
    }

    if (lowerNext) {
      loserPath = lowerNext.opponent
        ? `Loser likely drops to ${lowerNext.roundTitle} against ${lowerNext.opponent}.`
        : `Loser likely drops to ${lowerNext.roundTitle}.`;
    }
  } else if (normalized.includes("lower")) {
    if (upperNext && normalized.includes("lower final")) {
      winnerPath = upperNext.opponent
        ? `Winner likely advances to ${upperNext.roundTitle} against ${upperNext.opponent}.`
        : `Winner likely advances to ${upperNext.roundTitle}.`;
    } else if (lowerNext) {
      winnerPath = lowerNext.opponent
        ? `Winner likely advances to ${lowerNext.roundTitle} against ${lowerNext.opponent}.`
        : `Winner likely advances to ${lowerNext.roundTitle}.`;
    }
  }

  return {
    isPlayoff: true,
    roundTitle,
    stakesSummary,
    winnerPath,
    loserPath,
    inferredFromBracket: Boolean(winnerPath || loserPath),
  };
}

interface StoredRecentMatchRow {
  vlr_match_id: number;
  team_1_name: string | null;
  team_2_name: string | null;
  scheduled_at: string | null;
  status: string | null;
  match_details?:
    | { payload?: Record<string, unknown> | null }[]
    | { payload?: Record<string, unknown> | null }
    | null;
}

interface RecentMatchPlayerStat {
  player: string;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  acs: number | null;
  rating: number | null;
}

interface RecentMatchTeamStats {
  teamName: string;
  players: RecentMatchPlayerStat[];
}

function normalizeTeamName(value: string) {
  return value.trim().toLowerCase();
}

function parseRecentMatchPlayerStat(player: unknown): RecentMatchPlayerStat | null {
  if (!isRecord(player)) {
    return null;
  }

  const playerName =
    toText(player.player) ||
    toText(player.name) ||
    toText(player.player_name);

  if (!playerName) {
    return null;
  }

  return {
    player: playerName,
    kills: toNumber(player.kills ?? player.k),
    deaths: toNumber(player.deaths ?? player.d),
    assists: toNumber(player.assists ?? player.a),
    acs: toNumber(player.acs ?? player.average_combat_score),
    rating: toNumber(player.rating),
  };
}

function parseRecentMatchTeamStats(
  team: unknown,
  fallbackName: string
): RecentMatchTeamStats | null {
  if (!isRecord(team)) {
    return null;
  }

  const playersSource = findFirstArray(team, [
    "players",
    "stats",
    "roster",
    "members",
  ]);
  const players = (playersSource ?? [])
    .map(parseRecentMatchPlayerStat)
    .filter((row): row is RecentMatchPlayerStat => Boolean(row));

  if (!players.length) {
    return null;
  }

  return {
    teamName:
      toText(team.team_name) ||
      toText(team.team) ||
      toText(team.name) ||
      fallbackName,
    players,
  };
}

function parseRecentMatchTeamStatsFromMaps(
  maps: unknown[] | null | undefined,
  fallbackTeams: [string, string]
): RecentMatchTeamStats[] {
  if (!maps?.length) {
    return [];
  }

  const grouped = new Map<"team1" | "team2", RecentMatchTeamStats>();

  for (const map of maps) {
    if (!isRecord(map) || !isRecord(map.players)) {
      continue;
    }

    const playersBySide = map.players as Record<string, unknown>;

    (["team1", "team2"] as const).forEach((side, index) => {
      const rawPlayers = playersBySide[side];

      if (!Array.isArray(rawPlayers)) {
        return;
      }

      const current =
        grouped.get(side) ??
        ({
          teamName: fallbackTeams[index] || `Team ${index + 1}`,
          players: [],
        } as RecentMatchTeamStats);

      current.players.push(
        ...rawPlayers
          .map(parseRecentMatchPlayerStat)
          .filter((row): row is RecentMatchPlayerStat => Boolean(row))
      );
      grouped.set(side, current);
    });
  }

  return [...grouped.values()];
}

function parseRecentMatchPerformance(
  performance: unknown,
  fallbackTeams: [string, string]
): RecentMatchTeamStats[] {
  if (!performance) {
    return [];
  }

  let teamCandidates: unknown[] = [];

  if (Array.isArray(performance)) {
    teamCandidates = performance;
  } else if (isRecord(performance)) {
    const teamsArray = findFirstArray(performance, ["teams", "data"]);
    if (teamsArray) {
      teamCandidates = teamsArray;
    } else {
      teamCandidates = [performance.team1, performance.team2].filter(Boolean);
    }
  }

  return teamCandidates
    .map((team, index) =>
      parseRecentMatchTeamStats(
        team,
        fallbackTeams[index] || `Team ${index + 1}`
      )
    )
    .filter((team): team is RecentMatchTeamStats => Boolean(team));
}

function pickRecentMatchTeamStats(
  payload: Record<string, unknown> | null | undefined,
  fallbackTeams: [string, string],
  teamName: string
) {
  if (!payload) {
    return null;
  }

  const fromMaps = parseRecentMatchTeamStatsFromMaps(
    Array.isArray(payload.maps) ? payload.maps : null,
    fallbackTeams
  );
  const fromPerformance = parseRecentMatchPerformance(
    payload.performance,
    fallbackTeams
  );
  const candidates = fromMaps.length > 0 ? fromMaps : fromPerformance;
  const normalizedTarget = normalizeTeamName(teamName);

  return (
    candidates.find(
      (candidate) => normalizeTeamName(candidate.teamName) === normalizedTarget
    ) ?? null
  );
}

export async function getRecentTeamMatchForm(
  teamName: string,
  limit = 5
): Promise<TeamPreviewForm | null> {
  const trimmedTeamName = teamName.trim();

  if (!trimmedTeamName || /^tbd$/i.test(trimmedTeamName)) {
    return null;
  }

  const supabase = createServiceRoleSupabaseClient();
  const [asTeam1, asTeam2] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "vlr_match_id, team_1_name, team_2_name, scheduled_at, status, match_details(payload)"
      )
      .eq("team_1_name", trimmedTeamName)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(limit),
    supabase
      .from("matches")
      .select(
        "vlr_match_id, team_1_name, team_2_name, scheduled_at, status, match_details(payload)"
      )
      .eq("team_2_name", trimmedTeamName)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(limit),
  ]);

  const rows = [...(asTeam1.data ?? []), ...(asTeam2.data ?? [])] as StoredRecentMatchRow[];
  const uniqueRows = [...new Map(rows.map((row) => [row.vlr_match_id, row])).values()]
    .sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  if (uniqueRows.length === 0) {
    return null;
  }

  const byPlayer = new Map<
    string,
    {
      player: string;
      team: string;
      kills: number;
      deaths: number;
      assists: number;
      totalAcs: number;
      acsCount: number;
      totalRating: number;
      ratingCount: number;
      sampleMatches: number;
    }
  >();

  for (const row of uniqueRows) {
    const matchDetail = Array.isArray(row.match_details)
      ? row.match_details[0]
      : row.match_details;
    const payload =
      matchDetail && typeof matchDetail === "object" && "payload" in matchDetail
        ? (matchDetail.payload as Record<string, unknown> | null | undefined)
        : null;

    const teamStats = pickRecentMatchTeamStats(
      payload,
      [row.team_1_name ?? "Team 1", row.team_2_name ?? "Team 2"],
      trimmedTeamName
    );

    if (!teamStats) {
      continue;
    }

    for (const player of teamStats.players) {
      const current =
        byPlayer.get(player.player) ??
        {
          player: player.player,
          team: trimmedTeamName,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalAcs: 0,
          acsCount: 0,
          totalRating: 0,
          ratingCount: 0,
          sampleMatches: 0,
        };

      current.kills += player.kills ?? 0;
      current.deaths += player.deaths ?? 0;
      current.assists += player.assists ?? 0;
      if (player.acs !== null) {
        current.totalAcs += player.acs;
        current.acsCount += 1;
      }
      if (player.rating !== null) {
        current.totalRating += player.rating;
        current.ratingCount += 1;
      }
      current.sampleMatches += 1;
      byPlayer.set(player.player, current);
    }
  }

  const players: TeamPreviewPlayer[] = [...byPlayer.values()]
    .map((player) => {
      const rating =
        player.ratingCount > 0
          ? Number((player.totalRating / player.ratingCount).toFixed(2))
          : 0;
      const acs =
        player.acsCount > 0
          ? Number((player.totalAcs / player.acsCount).toFixed(0))
          : 0;
      const kd =
        player.deaths > 0
          ? Number((player.kills / player.deaths).toFixed(2))
          : Number(player.kills.toFixed(2));

      return {
        player: player.player,
        team: player.team,
        rating,
        acs,
        kd,
        adr: null,
        kastPercentage: null,
        hsPercentage: null,
        firstKillsPerRound: null,
        clutchSuccessPercentage: null,
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        roundsPlayed: 0,
        sampleMatches: player.sampleMatches,
      };
    })
    .filter((player) => player.rating > 0 || player.acs > 0 || (player.kills ?? 0) > 0);

  if (players.length === 0) {
    return null;
  }

  const topPlayersByRating = [...players]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const topPlayersByAcs = [...players]
    .sort((a, b) => b.acs - a.acs)
    .slice(0, 3);

  return {
    teamName: trimmedTeamName,
    timespanDays: 30,
    source: "recent_matches",
    sampleMatchCount: uniqueRows.length,
    players,
    topPlayersByRating,
    topPlayersByAcs,
    topRatedPlayer: topPlayersByRating[0] ?? null,
    topAcsPlayer: topPlayersByAcs[0] ?? null,
    averageTop3Rating: average(topPlayersByRating.map((player) => player.rating)),
    averageTop3Acs: average(topPlayersByAcs.map((player) => player.acs)),
  };
}

export async function getEventContext(params: {
  internalEventId?: number | null;
  vlrEventId?: number | null;
  eventTitle?: string | null;
}): Promise<MatchPreviewEventContext | null> {
  const supabase = createServiceRoleSupabaseClient();
  let query = supabase
    .from("events")
    .select("id, vlr_event_id, title, status, region, dates, prize, tier")
    .limit(1);

  if (params.internalEventId) {
    query = query.eq("id", params.internalEventId);
  } else if (params.vlrEventId) {
    query = query.eq("vlr_event_id", params.vlrEventId);
  } else if (params.eventTitle) {
    query = query.ilike("title", `%${params.eventTitle}%`);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to load event context: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    internalEventId: data.id ?? null,
    vlrEventId: data.vlr_event_id ?? null,
    title: data.title ?? "",
    status: data.status ?? null,
    region: data.region ?? null,
    dates: data.dates ?? null,
    prize: data.prize ?? null,
    tier: data.tier ?? null,
  };
}

export function buildDeterministicMatchPreview(params: {
  matchContext: MatchPreviewContext;
  team1Form?: TeamPreviewForm | null;
  team2Form?: TeamPreviewForm | null;
  eventContext?: MatchPreviewEventContext | null;
  stakes?: MatchStakeContext | null;
}) {
  return buildFallbackPreviewFromTeamForms(params);
}
