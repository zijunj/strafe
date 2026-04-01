"use client";

import useValorantApiWithCache from "@/app/api/Valorant";

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

interface StoredMatchDetailsPayload {
  date?: string | null;
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
    team1: teams[0]?.name || storedMatch.team_1_name || "Unknown Team",
    team2: teams[1]?.name || storedMatch.team_2_name || "Unknown Team",
    team1_logo: teams[0]?.logo || "/valorantLogo.png",
    team2_logo: teams[1]?.logo || "/valorantLogo.png",
    event_logo: payload?.event?.logo || eventData?.thumb || "/valorantLogo.png",
    display_date: getDisplayDate(payload?.date || ""),
    start_time: getStartTime(payload?.date || ""),
    event_dates: eventData?.dates || "",
    event_region: eventData?.region || "",
    prize_pool: eventData?.prize || "",
    format: "",
    head_to_head: (payload?.head_to_head || []).map(mapHeadToHeadMatch),
    team1_score: teams[0]?.score || storedMatch.team_1_score || "",
    team2_score: teams[1]?.score || storedMatch.team_2_score || "",
  };
}

function mapRouteResponseToDetails(res: MatchRouteResponse): MatchDetails {
  if (res.source === "upstream") {
    const payload = res.data as StoredMatchDetailsPayload | undefined;
    const teams = payload?.teams ?? [];

    if (!payload) {
      throw new Error("Match details not found");
    }

    return {
      match_event:
        deriveEventName(payload.event?.name, payload.event?.series) ||
        "Unknown Event",
      match_series: cleanEventText(payload.event?.series) || "TBD",
      team1: teams[0]?.name || "Unknown Team",
      team2: teams[1]?.name || "Unknown Team",
      team1_logo: teams[0]?.logo || "/valorantLogo.png",
      team2_logo: teams[1]?.logo || "/valorantLogo.png",
      event_logo: payload.event?.logo || "/valorantLogo.png",
      display_date: getDisplayDate(payload.date || ""),
      start_time: getStartTime(payload.date || ""),
      event_dates: "",
      event_region: "",
      prize_pool: "",
      format: "",
      head_to_head: (payload.head_to_head || []).map(mapHeadToHeadMatch),
      team1_score: teams[0]?.score || "",
      team2_score: teams[1]?.score || "",
    };
  }

  return mapStoredMatchToDetails(res.data as StoredMatchRecord | undefined);
}

export default function MatchDetailClient({ id, slug }: Props) {
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

  if (isLoading || !resolvedMatch) {
    return <div className="max-w-7xl mx-auto p-6 text-white">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 text-white grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <img
              src={resolvedMatch.team1_logo || "/valorantLogo.png"}
              alt={resolvedMatch.team1 || "Team"}
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-xl font-bold">{resolvedMatch.team1}</h2>
              <p className="text-gray-500 text-sm">Rank #47</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">{resolvedMatch.match_series}</p>
            <p className="text-lg font-semibold">{resolvedMatch.display_date}</p>
            <p className="text-lg font-semibold">{resolvedMatch.start_time}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <h2 className="text-xl font-bold">{resolvedMatch.team2}</h2>
              <p className="text-gray-500 text-sm">Rank #67</p>
            </div>
            <img
              src={resolvedMatch.team2_logo || "/valorantLogo.png"}
              alt={resolvedMatch.team2 || "Team"}
              className="w-12 h-12"
            />
          </div>
        </div>

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
          <h3 className="font-semibold mb-3">Match Preview</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {resolvedMatch.team1} vs {resolvedMatch.team2} will be played on{" "}
            <span className="font-bold">{resolvedMatch.display_date}</span>. This is a{" "}
            <span className="font-bold">{resolvedMatch.match_series}</span> match in the{" "}
            <span className="font-bold">{resolvedMatch.match_event}</span>. Stay tuned
            for live updates and results.
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
