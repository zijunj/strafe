"use client";

import useValorantApiWithCache from "@/app/api/Valorant";
import { useEffect, useState } from "react";

interface MatchDetails {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  event_logo: string;
  display_date: string;
  start_time: string;
  event_dates?: string;
  event_region?: string;
  prize_pool?: string;
  format?: string;
  head_to_head?: H2HMatch[];
  team1_score?: string;
  team2_score?: string;
  maps?: MatchMapSummary[];
  teamStats?: MatchTeamStats[];
}

interface H2HMatch {
  event_name: string;
  event_series: string;
  event_logo: string;
  team1_score: string;
  team2_score: string;
  team1_win: boolean;
  team2_win: boolean;
  date: string;
  url: string;
}

interface MatchMapSummary {
  name: string;
  team1Score: string;
  team2Score: string;
  winner: "team1" | "team2" | null;
  teamStats?: MatchTeamStats[];
}

interface MatchPlayerStat {
  player: string;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  plusMinus: number | null;
  acs: number | null;
  rating: number | null;
}

interface MatchTeamStats {
  teamName: string;
  teamLogo: string;
  players: MatchPlayerStat[];
}

interface StoredMatchDetailsPayload {
  date?: string | null;
  status?: string | null;
  format?: string | null;
  event?: {
    name?: string | null;
    series?: string | null;
    logo?: string | null;
  } | null;
  teams?: Array<{
    name?: string | null;
    logo?: string | null;
      score?: string | null;
  }> | null;
  maps?: unknown[] | null;
  performance?: unknown;
  head_to_head?: Array<{
    event_name?: string | null;
    event?: string | null;
    event_series?: string | null;
    event_logo?: string | null;
    team1_score?: string | null;
    team2_score?: string | null;
    score?: string | number | null;
    team1_win?: boolean | null;
    team2_win?: boolean | null;
    teams?: Array<{
      name?: string | null;
      is_winner?: boolean | null;
    }> | null;
    date?: string | null;
    url?: string | null;
  }> | null;
}

interface StoredMatchDetailRow {
  payload?: StoredMatchDetailsPayload | null;
}

interface StoredMatchRecord {
  event_title?: string | null;
  event_series?: string | null;
  team_1_name?: string | null;
  team_2_name?: string | null;
  team_1_score?: string | null;
  team_2_score?: string | null;
  events?:
    | {
        title?: string | null;
        thumb?: string | null;
        dates?: string | null;
        region?: string | null;
        prize?: string | null;
      }
    | Array<{
        title?: string | null;
        thumb?: string | null;
        dates?: string | null;
        region?: string | null;
        prize?: string | null;
      }>
    | null;
  match_details?: StoredMatchDetailRow[] | StoredMatchDetailRow | null;
}

interface StoredMatchResponse {
  data?: StoredMatchRecord;
}

interface MatchRouteResponse {
  source?: "storage" | "upstream";
  data?: StoredMatchRecord | StoredMatchDetailsPayload;
}

interface Props {
  id: string;
  slug: string;
}

function normalizeMatchDate(raw: string): string {
  if (!raw) return "";

  return raw.replace(/(\d{1,2})(\d{1,2}:\d{2}\s?[AP]M)/, "$1 $2");
}

function getDisplayDate(raw: string): string {
  const normalized = normalizeMatchDate(raw);
  return normalized.replace(/\s\d{1,2}:\d{2}\s?[AP]M.*$/, "").trim();
}

function getStartTime(raw: string): string {
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

function mapHeadToHeadMatch(
  h2h: NonNullable<StoredMatchDetailsPayload["head_to_head"]>[number]
): H2HMatch {
  const parsedScore = parseHeadToHeadScore(h2h.score);

  return {
    event_name: h2h.event_name || h2h.event || "",
    event_series: h2h.event_series || "",
    event_logo: h2h.event_logo || "/valorantLogo.png",
    team1_score: h2h.team1_score || parsedScore.team1Score,
    team2_score: h2h.team2_score || parsedScore.team2Score,
    team1_win:
      typeof h2h.team1_win === "boolean"
        ? h2h.team1_win
        : Boolean(h2h.teams?.[0]?.is_winner),
    team2_win:
      typeof h2h.team2_win === "boolean"
        ? h2h.team2_win
        : Boolean(h2h.teams?.[1]?.is_winner),
    date: h2h.date || "",
    url: h2h.url || "#",
  };
}

function parseMapSummary(
  map: unknown,
  fallbackTeam1Score = "",
  fallbackTeam2Score = "",
  fallbackTeams: Array<{ name: string; logo: string }> = []
): MatchMapSummary | null {
  if (!isRecord(map)) {
    return null;
  }

  const name =
    toText(map.name) ||
    toText(map.map) ||
    toText(map.map_name) ||
    toText(map.title);
  const nestedScore = isRecord(map.score) ? map.score : null;
  const team1Score = toText(
    map.team1_score ??
      map.team_1_score ??
      map.score1 ??
      nestedScore?.team1 ??
      fallbackTeam1Score
  );
  const team2Score = toText(
    map.team2_score ??
      map.team_2_score ??
      map.score2 ??
      nestedScore?.team2 ??
      fallbackTeam2Score
  );

  if (!name && !team1Score && !team2Score) {
    return null;
  }

  const parsedTeam1 = toNumber(team1Score);
  const parsedTeam2 = toNumber(team2Score);
  const mapTeamStats = parseTeamStatsForSingleMap(map, [
    { name: fallbackTeams[0]?.name || "Team 1", logo: fallbackTeams[0]?.logo || "/valorantLogo.png" },
    { name: fallbackTeams[1]?.name || "Team 2", logo: fallbackTeams[1]?.logo || "/valorantLogo.png" },
  ]);

  return {
    name: name || "Map",
    team1Score,
    team2Score,
    winner:
      parsedTeam1 !== null && parsedTeam2 !== null
        ? parsedTeam1 > parsedTeam2
          ? "team1"
          : parsedTeam2 > parsedTeam1
            ? "team2"
            : null
        : null,
    teamStats: mapTeamStats,
  };
}

function parsePlayerStat(player: unknown): MatchPlayerStat | null {
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
    plusMinus: toNumber(
      player.plus_minus ??
        player.plusMinus ??
        player.diff ??
        player.kd_diff ??
        player["+/-"]
    ),
    acs: toNumber(player.acs ?? player.average_combat_score),
    rating: toNumber(player.rating),
  };
}

function aggregatePlayerStats(players: MatchPlayerStat[]) {
  const byPlayer = new Map<string, MatchPlayerStat>();

  for (const player of players) {
    const current = byPlayer.get(player.player);

    if (!current) {
      byPlayer.set(player.player, { ...player });
      continue;
    }

    current.kills = (current.kills ?? 0) + (player.kills ?? 0);
    current.deaths = (current.deaths ?? 0) + (player.deaths ?? 0);
    current.assists = (current.assists ?? 0) + (player.assists ?? 0);
    current.plusMinus =
      current.kills !== null && current.deaths !== null
        ? current.kills - current.deaths
        : current.plusMinus;

    if (player.acs !== null) {
      current.acs =
        current.acs === null ? player.acs : Math.round((current.acs + player.acs) / 2);
    }

    if (player.rating !== null) {
      current.rating =
        current.rating === null
          ? player.rating
          : Number(((current.rating + player.rating) / 2).toFixed(2));
    }
  }

  return [...byPlayer.values()].sort(
    (a, b) => (b.kills ?? -1) - (a.kills ?? -1)
  );
}

function parseTeamStatsFromMaps(
  maps: unknown[] | null | undefined,
  fallbackTeams: Array<{ name: string; logo: string }>
): MatchTeamStats[] {
  if (!maps?.length) {
    return [];
  }

  const grouped = new Map<
    "team1" | "team2",
    { teamName: string; teamLogo: string; players: MatchPlayerStat[] }
  >();

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
        {
          teamName: fallbackTeams[index]?.name || `Team ${index + 1}`,
          teamLogo: fallbackTeams[index]?.logo || "/valorantLogo.png",
          players: [] as MatchPlayerStat[],
        };

      current.players.push(
        ...rawPlayers
          .map(parsePlayerStat)
          .filter((row): row is MatchPlayerStat => Boolean(row))
      );

      grouped.set(side, {
        teamName: current.teamName,
        teamLogo: current.teamLogo,
        players: current.players,
      });
    });
  }

  return (["team1", "team2"] as const)
    .map((side) => {
      const team = grouped.get(side);

      if (!team || !team.players.length) {
        return null;
      }

      return {
        teamName: team.teamName,
        teamLogo: team.teamLogo,
        players: aggregatePlayerStats(team.players),
      };
    })
    .filter((team): team is MatchTeamStats => Boolean(team));
}

function parseTeamStatsForSingleMap(
  map: unknown,
  fallbackTeams: Array<{ name: string; logo: string }>
): MatchTeamStats[] {
  if (!isRecord(map) || !isRecord(map.players)) {
    return [];
  }

  const playersBySide = map.players as Record<string, unknown>;

  return (["team1", "team2"] as const)
    .map((side, index) => {
      const rawPlayers = playersBySide[side];

      if (!Array.isArray(rawPlayers)) {
        return null;
      }

      const players = rawPlayers
        .map(parsePlayerStat)
        .filter((row): row is MatchPlayerStat => Boolean(row))
        .sort((a, b) => (b.kills ?? -1) - (a.kills ?? -1));

      if (!players.length) {
        return null;
      }

      return {
        teamName: fallbackTeams[index]?.name || `Team ${index + 1}`,
        teamLogo: fallbackTeams[index]?.logo || "/valorantLogo.png",
        players,
      };
    })
    .filter((team): team is MatchTeamStats => Boolean(team));
}

function parseTeamStats(
  team: unknown,
  fallbackName: string,
  fallbackLogo: string
): MatchTeamStats | null {
  if (!isRecord(team)) {
    return null;
  }

  const playersSource = findFirstArray(team, [
    "players",
    "player_stats",
    "stats",
    "roster",
    "members",
  ]);
  const players = (playersSource ?? [])
    .map(parsePlayerStat)
    .filter((row): row is MatchPlayerStat => Boolean(row));

  if (!players.length) {
    return null;
  }

  return {
    teamName:
      toText(team.team_name) ||
      toText(team.team) ||
      toText(team.name) ||
      fallbackName,
    teamLogo:
      toText(team.team_logo) ||
      toText(team.logo) ||
      fallbackLogo ||
      "/valorantLogo.png",
    players,
  };
}

function parsePerformance(
  performance: unknown,
  fallbackTeams: Array<{ name: string; logo: string }>
): MatchTeamStats[] {
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
      parseTeamStats(
        team,
        fallbackTeams[index]?.name || `Team ${index + 1}`,
        fallbackTeams[index]?.logo || "/valorantLogo.png"
      )
    )
    .filter((team): team is MatchTeamStats => Boolean(team));
}

function mapStoredMatchToDetails(storedMatch?: StoredMatchRecord): MatchDetails {
  if (!storedMatch) {
    throw new Error("Match details not found");
  }

  const matchDetails = Array.isArray(storedMatch.match_details)
    ? storedMatch.match_details[0]
    : storedMatch.match_details;
  const payload = matchDetails?.payload;
  const teams = payload?.teams ?? [];
  const eventData = Array.isArray(storedMatch.events)
    ? storedMatch.events[0]
    : storedMatch.events;
  const team1Name = teams[0]?.name || storedMatch.team_1_name || "Unknown Team";
  const team2Name = teams[1]?.name || storedMatch.team_2_name || "Unknown Team";
  const team1Logo = teams[0]?.logo || "/valorantLogo.png";
  const team2Logo = teams[1]?.logo || "/valorantLogo.png";
  const team1Score = teams[0]?.score || storedMatch.team_1_score || "";
  const team2Score = teams[1]?.score || storedMatch.team_2_score || "";
  const maps = (payload?.maps || [])
    .map((map) =>
      parseMapSummary(map, team1Score, team2Score, [
        { name: team1Name, logo: team1Logo },
        { name: team2Name, logo: team2Logo },
      ])
    )
    .filter((map): map is MatchMapSummary => Boolean(map));
  const teamStatsFromMaps = parseTeamStatsFromMaps(payload?.maps, [
    { name: team1Name, logo: team1Logo },
    { name: team2Name, logo: team2Logo },
  ]);
  const teamStatsFromPerformance = parsePerformance(payload?.performance, [
    { name: team1Name, logo: team1Logo },
    { name: team2Name, logo: team2Logo },
  ]);
  const resolvedTeamStats =
    teamStatsFromMaps.length > 0 ? teamStatsFromMaps : teamStatsFromPerformance;

  return {
    match_event:
      storedMatch.event_title ||
      eventData?.title ||
      deriveEventName(payload?.event?.name, payload?.event?.series) ||
      storedMatch.event_title ||
      "Unknown Event",
    match_series:
      cleanEventText(payload?.event?.series) ||
      cleanEventText(storedMatch.event_series) ||
      "TBD",
    team1: team1Name,
    team2: team2Name,
    team1_logo: team1Logo,
    team2_logo: team2Logo,
    event_logo: payload?.event?.logo || eventData?.thumb || "/valorantLogo.png",
    display_date: getDisplayDate(payload?.date || ""),
    start_time: getStartTime(payload?.date || ""),
    event_dates: eventData?.dates || "",
    event_region: eventData?.region || "",
    prize_pool: eventData?.prize || "",
    format: cleanEventText(payload?.format) || "",
    head_to_head: (payload?.head_to_head || []).map(mapHeadToHeadMatch),
    team1_score: team1Score,
    team2_score: team2Score,
    maps,
    teamStats: resolvedTeamStats,
  };
}

function mapRouteResponseToDetails(res: MatchRouteResponse): MatchDetails {
  if (res.source === "upstream") {
    const payload = res.data as StoredMatchDetailsPayload | undefined;
    const teams = payload?.teams ?? [];
    const team1Name = teams[0]?.name || "Unknown Team";
    const team2Name = teams[1]?.name || "Unknown Team";
    const team1Logo = teams[0]?.logo || "/valorantLogo.png";
    const team2Logo = teams[1]?.logo || "/valorantLogo.png";
    const team1Score = teams[0]?.score || "";
    const team2Score = teams[1]?.score || "";
    const maps = (payload?.maps || [])
      .map((map) =>
        parseMapSummary(map, team1Score, team2Score, [
          { name: team1Name, logo: team1Logo },
          { name: team2Name, logo: team2Logo },
        ])
      )
      .filter((map): map is MatchMapSummary => Boolean(map));
    const teamStatsFromMaps = parseTeamStatsFromMaps(payload?.maps, [
      { name: team1Name, logo: team1Logo },
      { name: team2Name, logo: team2Logo },
    ]);
    const teamStatsFromPerformance = parsePerformance(payload?.performance, [
      { name: team1Name, logo: team1Logo },
      { name: team2Name, logo: team2Logo },
    ]);
    const resolvedTeamStats =
      teamStatsFromMaps.length > 0
        ? teamStatsFromMaps
        : teamStatsFromPerformance;

    if (!payload) {
      throw new Error("Match details not found");
    }

    return {
      match_event:
        deriveEventName(payload.event?.name, payload.event?.series) ||
        "Unknown Event",
      match_series: cleanEventText(payload.event?.series) || "TBD",
      team1: team1Name,
      team2: team2Name,
      team1_logo: team1Logo,
      team2_logo: team2Logo,
      event_logo: payload.event?.logo || "/valorantLogo.png",
      display_date: getDisplayDate(payload.date || ""),
      start_time: getStartTime(payload.date || ""),
      event_dates: "",
      event_region: "",
      prize_pool: "",
      format: cleanEventText(payload.format) || "",
      head_to_head: (payload.head_to_head || []).map(mapHeadToHeadMatch),
      team1_score: team1Score,
      team2_score: team2Score,
      maps,
      teamStats: resolvedTeamStats,
    };
  }

  return mapStoredMatchToDetails(res.data as StoredMatchRecord | undefined);
}

function getWinningSide(team1Score?: string, team2Score?: string) {
  const score1 = toNumber(team1Score);
  const score2 = toNumber(team2Score);

  if (score1 === null || score2 === null) {
    return null;
  }

  if (score1 > score2) {
    return "team1" as const;
  }

  if (score2 > score1) {
    return "team2" as const;
  }

  return null;
}

function getAllPlayers(teamStats?: MatchTeamStats[]) {
  return (teamStats ?? []).flatMap((team) =>
    team.players.map((player) => ({
      ...player,
      teamName: team.teamName,
      teamLogo: team.teamLogo,
    }))
  );
}

function getTopPerformer(
  teamStats: MatchTeamStats[] | undefined,
  mode: "kills" | "rating" | "leastDeaths"
) {
  const players = getAllPlayers(teamStats);

  if (!players.length) {
    return null;
  }

  const sorted = [...players].sort((a, b) => {
    if (mode === "leastDeaths") {
      return (a.deaths ?? Number.MAX_SAFE_INTEGER) - (b.deaths ?? Number.MAX_SAFE_INTEGER);
    }

    if (mode === "rating") {
      return (b.rating ?? -1) - (a.rating ?? -1);
    }

    return (b.kills ?? -1) - (a.kills ?? -1);
  });

  return sorted[0] ?? null;
}

export default function MatchDetailClient({ id, slug }: Props) {
  const [selectedStatView, setSelectedStatView] = useState("overview");
  const {
    data: match,
    loading: primaryLoading,
    error: primaryError,
  } =
    useValorantApiWithCache<MatchDetails>({
      key: `match-detail-${id}`,
      url: `storage/match-details/${id}?sync=1`,
      parse: (res: StoredMatchResponse) =>
        mapStoredMatchToDetails(res.data as StoredMatchRecord | undefined),
    });

  const {
    data: fallbackMatch,
    loading: fallbackLoading,
  } = useValorantApiWithCache<MatchDetails>({
    key: `match-detail-fallback-${id}`,
    url: `/api/matches/${id}/${slug}`,
    parse: mapRouteResponseToDetails,
    enabled: Boolean(primaryError),
  });

  const resolvedMatch = primaryError ? fallbackMatch : match;
  const isLoading = primaryError ? fallbackLoading : primaryLoading;

  useEffect(() => {
    setSelectedStatView("overview");
  }, [id]);

  if (isLoading || !resolvedMatch) {
    return <div className="max-w-7xl mx-auto p-6 text-white">Loading...</div>;
  }

  const winningSide = getWinningSide(
    resolvedMatch.team1_score,
    resolvedMatch.team2_score
  );
  const hasFinishedScore =
    resolvedMatch.team1_score !== "" && resolvedMatch.team2_score !== "";
  const selectedMap =
    selectedStatView === "overview"
      ? null
      : resolvedMatch.maps?.find((map) => map.name === selectedStatView) ?? null;
  const displayedTeamStats = selectedMap?.teamStats?.length
    ? selectedMap.teamStats
    : resolvedMatch.teamStats ?? [];
  const topFragger = getTopPerformer(displayedTeamStats, "kills");
  const topRated = getTopPerformer(displayedTeamStats, "rating");
  const leastDeaths = getTopPerformer(displayedTeamStats, "leastDeaths");

  return (
    <div className="max-w-7xl mx-auto p-6 text-white grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src={resolvedMatch.team1_logo || "/valorantLogo.png"}
              alt={resolvedMatch.team1 || "Team"}
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-xl font-bold">{resolvedMatch.team1}</h2>
              {winningSide === "team1" ? (
                <p className="text-emerald-400 text-sm font-bold uppercase">
                  Win
                </p>
              ) : winningSide === "team2" ? (
                <p className="text-gray-500 text-sm font-bold uppercase">
                  Loss
                </p>
              ) : null}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">{resolvedMatch.match_series}</p>
            {hasFinishedScore ? (
              <div className="mt-1 flex items-center gap-3 text-4xl font-black leading-none">
                <span>{resolvedMatch.team1_score}</span>
                <span className="text-sm font-bold text-gray-500">-</span>
                <span>{resolvedMatch.team2_score}</span>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold">{resolvedMatch.display_date}</p>
                <p className="text-lg font-semibold">{resolvedMatch.start_time}</p>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="text-right">
              <h2 className="text-xl font-bold">{resolvedMatch.team2}</h2>
              {winningSide === "team2" ? (
                <p className="text-emerald-400 text-sm font-bold uppercase">
                  Win
                </p>
              ) : winningSide === "team1" ? (
                <p className="text-gray-500 text-sm font-bold uppercase">
                  Loss
                </p>
              ) : null}
            </div>
            <img
              src={resolvedMatch.team2_logo || "/valorantLogo.png"}
              alt={resolvedMatch.team2 || "Team"}
              className="w-12 h-12"
            />
          </div>
        </div>

        {(resolvedMatch.maps?.length || topFragger || topRated || leastDeaths) ? (
          <div className="bg-[#202020] rounded-lg border border-[#2a2a2a] overflow-hidden">
            <div className="px-4 py-4 border-b border-[#2a2a2a]">
              <h3 className="font-semibold uppercase tracking-wide text-sm">
                Score Summary
              </h3>
              {resolvedMatch.maps && resolvedMatch.maps.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStatView("overview")}
                    className={
                      selectedStatView === "overview"
                        ? "rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold"
                        : "rounded-md border border-white/10 bg-[#171717] px-4 py-2 text-sm"
                    }
                  >
                    Match Overview
                  </button>
                  {resolvedMatch.maps.map((map, index) => (
                    <button
                      type="button"
                      key={`${map.name}-${index}`}
                      onClick={() => setSelectedStatView(map.name)}
                      className={
                        selectedStatView === map.name
                          ? "rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm"
                          : "rounded-md border border-white/10 bg-[#171717] px-4 py-2 text-sm"
                      }
                    >
                      <span className="font-semibold">{map.name}</span>
                      <span className="ml-3 text-gray-400">
                        {map.team1Score} - {map.team2Score}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {(topFragger || topRated || leastDeaths) ? (
              <div className="grid gap-px bg-[#2a2a2a] md:grid-cols-3">
                {[
                  { label: "MVP", player: topRated },
                  { label: "Top Fragger", player: topFragger },
                  { label: "Least Deaths", player: leastDeaths },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-[#202020] px-5 py-5"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                      {card.label}
                    </p>
                    {card.player ? (
                      <div className="mt-4 flex items-center gap-4">
                        <img
                          src={card.player.teamLogo || "/valorantLogo.png"}
                          alt={card.player.teamName}
                          className="h-16 w-16 object-contain opacity-90"
                        />
                        <div>
                          <p className="text-lg font-bold">{card.player.player}</p>
                          <p className="text-sm text-gray-400">
                            {card.player.teamName}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#d2ff4d]">
                            {card.player.kills ?? "-"} / {card.player.deaths ?? "-"}
                            {card.player.rating !== null
                              ? ` | Rating ${card.player.rating}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-400">
                        No finished-match player stats available yet.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {displayedTeamStats && displayedTeamStats.length > 0 ? (
              <div className="divide-y divide-[#2a2a2a]">
                {displayedTeamStats.map((team) => (
                  <div key={team.teamName}>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#161616]">
                      <img
                        src={team.teamLogo || "/valorantLogo.png"}
                        alt={team.teamName}
                        className="h-8 w-8 object-contain"
                      />
                      <div>
                        <p className="font-bold">{team.teamName}</p>
                        <p className="text-xs text-gray-500">Player stats</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#111111] text-gray-500 uppercase text-[11px] tracking-[0.08em]">
                          <tr>
                            <th className="px-4 py-3 text-left">Player</th>
                            <th className="px-3 py-3 text-right">K</th>
                            <th className="px-3 py-3 text-right">D</th>
                            <th className="px-3 py-3 text-right">A</th>
                            <th className="px-3 py-3 text-right">+/-</th>
                            <th className="px-3 py-3 text-right">ACS</th>
                            <th className="px-4 py-3 text-right">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.players.map((player) => (
                            <tr
                              key={`${team.teamName}-${player.player}`}
                              className="border-t border-[#242424] hover:bg-[#191919]"
                            >
                              <td className="px-4 py-3 font-semibold">
                                {player.player}
                              </td>
                              <td className="px-3 py-3 text-right">{player.kills ?? "-"}</td>
                              <td className="px-3 py-3 text-right">{player.deaths ?? "-"}</td>
                              <td className="px-3 py-3 text-right">{player.assists ?? "-"}</td>
                              <td className="px-3 py-3 text-right">
                                {player.plusMinus === null ? (
                                  "-"
                                ) : (
                                  <span
                                    className={
                                      player.plusMinus > 0
                                        ? "text-emerald-400"
                                        : player.plusMinus < 0
                                          ? "text-red-400"
                                          : "text-gray-300"
                                    }
                                  >
                                    {player.plusMinus > 0
                                      ? `+${player.plusMinus}`
                                      : player.plusMinus}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">{player.acs ?? "-"}</td>
                              <td className="px-4 py-3 text-right">{player.rating ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-gray-400">
                Match stats have not been synced for this match yet.
              </div>
            )}
          </div>
        ) : null}

        <div className="bg-[#202020] p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Previous Encounters</h3>

          {resolvedMatch.head_to_head && resolvedMatch.head_to_head.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <div className="flex items-center gap-2">
                  <img
                    src={resolvedMatch.team1_logo || "/valorantLogo.png"}
                    alt={resolvedMatch.team1 || "Team"}
                    className="w-6 h-6"
                  />
                  <span className="text-white">
                    {resolvedMatch.head_to_head.filter((h2h) => h2h.team1_win).length}{" "}
                    Wins
                  </span>
                </div>

                <div className="text-gray-400 text-sm">0 Draws</div>

                <div className="flex items-center gap-2">
                  <span className="text-white">
                    {resolvedMatch.head_to_head.filter((h2h) => h2h.team2_win).length}{" "}
                    Wins
                  </span>
                  <img
                    src={resolvedMatch.team2_logo || "/valorantLogo.png"}
                    alt={resolvedMatch.team2 || "Team"}
                    className="w-6 h-6"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-700">
                {resolvedMatch.head_to_head.map((h2h, idx) => (
                  <a
                    key={idx}
                    href={h2h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center py-3 hover:bg-[#2a2a2a] px-3 rounded-md"
                  >
                    <div className="w-1/4 text-xs text-gray-400">
                      {h2h.date}
                    </div>

                    <div className="flex-1 flex items-center justify-center gap-3">
                      <span
                        className={`font-bold ${
                          h2h.team1_win ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {resolvedMatch.team1}
                      </span>

                      <div className="flex items-center gap-1 text-sm font-bold">
                        <span
                          className={
                            h2h.team1_win ? "text-white" : "text-gray-400"
                          }
                        >
                          {h2h.team1_score}
                        </span>
                        <span>-</span>
                        <span
                          className={
                            h2h.team2_win ? "text-white" : "text-gray-400"
                          }
                        >
                          {h2h.team2_score}
                        </span>
                      </div>

                      <span
                        className={`font-bold ${
                          h2h.team2_win ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {resolvedMatch.team2}
                      </span>
                    </div>

                    <div className="w-1/4 text-right">
                      <p className="text-sm font-semibold">{h2h.event_name}</p>
                      <p className="text-xs text-gray-400">
                        {h2h.event_series}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No past encounters logged.</p>
          )}
        </div>

        <div className="bg-[#202020] p-4 rounded-lg">
          <h3 className="font-semibold mb-3">
            {hasFinishedScore ? "Match Recap" : "Match Preview"}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {resolvedMatch.team1} vs {resolvedMatch.team2}
            {hasFinishedScore ? (
              <>
                {" "}
                finished {resolvedMatch.team1_score} - {resolvedMatch.team2_score} in{" "}
                <span className="font-bold">{resolvedMatch.match_event}</span>.
              </>
            ) : (
              <>
                {" "}
                will be played on{" "}
                <span className="font-bold">{resolvedMatch.display_date}</span>.
              </>
            )}{" "}
            This is a <span className="font-bold">{resolvedMatch.match_series}</span>{" "}
            match in the <span className="font-bold">{resolvedMatch.match_event}</span>.
          </p>
        </div>
      </div>

      <div className="col-span-1">
        <div className="bg-[#1a1a1a] rounded-lg w-full max-w-sm text-white border border-[#2a2a2a] sticky top-8">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Match Info
            </h2>
          </div>

          <div className="p-4 flex items-center justify-center">
            <img
              src={resolvedMatch.event_logo || "/valorantLogo.png"}
              alt="Tournament Logo"
              className="h-16 object-contain"
            />
          </div>

          <div className="px-6 py-4">
            <p className="text-xs uppercase text-gray-400 mb-1">Tournament</p>
            <p className="text-base font-semibold">{resolvedMatch.match_event}</p>
          </div>

          <div className="px-6 pb-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-400">Date</p>
              <p>{resolvedMatch.display_date}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Start time</p>
              <p>{resolvedMatch.start_time}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Stage</p>
              <p>{resolvedMatch.match_series}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Region</p>
              <p>{resolvedMatch.event_region || "TBD"}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Prize pool</p>
              <p>{resolvedMatch.prize_pool || "TBD"}</p>
            </div>

            {resolvedMatch.event_dates ? (
              <div className="flex justify-between">
                <p className="text-gray-400">Event dates</p>
                <p>{resolvedMatch.event_dates}</p>
              </div>
            ) : null}

            {resolvedMatch.format ? (
              <div className="flex justify-between">
                <p className="text-gray-400">Format</p>
                <p>{resolvedMatch.format}</p>
              </div>
            ) : null}
          </div>

          <div className="bg-[#101010] px-6 py-4 border-t border-[#2a2a2a]">
            <a
              href={`https://www.vlr.gg/${id}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[#d2ff4d] text-sm font-semibold hover:underline"
            >
              GO TO TOURNAMENT →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
