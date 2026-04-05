import {
  getEventGroupIdForTier,
  normalizeAiRegion,
  type QueryPlan,
} from "./queryPlan";

export interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
  intent: QueryPlan["intent"];
  comparisonPlayers?: string[];
  metric: QueryPlan["metric"];
  entity: QueryPlan["entity"];
  sort: QueryPlan["sort"];
  limit: number;
  filters: {
    region?: QueryPlan["filters"]["region"];
    timespanDays?: QueryPlan["filters"]["timespanDays"];
    tier?: QueryPlan["filters"]["tier"];
    eventGroupId?: number | null;
    eventName?: string | null;
    player?: string | null;
    players?: string[];
    role?: QueryPlan["filters"]["role"];
    agent?: string | null;
    minRounds?: number | null;
    team?: string | null;
    matchTeam?: string | null;
    opponentTeam?: string | null;
    status?: QueryPlan["filters"]["status"];
    datePreset?: QueryPlan["filters"]["datePreset"];
  };
}

const metricMatchers: Array<{
  metric: ParsedQuery["metric"];
  patterns: RegExp[];
}> = [
  {
    metric: "agents",
    patterns: [/\bagents?\b/i, /\bagent pool\b/i, /what agents/i, /plays?\b.*agent/i],
  },
  { metric: "rating", patterns: [/\brating\b/i, /\bbest player\b/i, /\btop\b/i] },
  { metric: "acs", patterns: [/\bacs\b/i, /combat score/i] },
  { metric: "kd", patterns: [/\bk\/d\b/i, /\bkd\b/i, /kill.?death/i] },
  { metric: "adr", patterns: [/\badr\b/i, /damage per round/i] },
  { metric: "kpr", patterns: [/\bkpr\b/i, /kills per round/i, /kill per round/i] },
  { metric: "apr", patterns: [/\bapr\b/i, /assists per round/i, /assist per round/i] },
  { metric: "fkpr", patterns: [/\bfkpr\b/i, /first kills per round/i, /first kill per round/i] },
  { metric: "fdpr", patterns: [/\bfdpr\b/i, /first deaths per round/i, /first death per round/i] },
  { metric: "kast_percentage", patterns: [/\bkast\b/i, /survived traded/i] },
  { metric: "hs_percentage", patterns: [/\bhs%\b/i, /headshot/i, /headshot percentage/i] },
  { metric: "clutch_success_percentage", patterns: [/\bclutch\b/i, /clutch success/i] },
  { metric: "rounds_played", patterns: [/\brounds played\b/i, /\brounds\b/i] },
];

const regionMatchers: Array<{
  region: NonNullable<ParsedQuery["filters"]["region"]>;
  patterns: RegExp[];
}> = [
  { region: "na", patterns: [/north america/i, /\bna\b/i] },
  { region: "eu", patterns: [/\bemea\b/i, /\beu\b/i, /europe/i] },
  { region: "ap", patterns: [/\bpacific\b/i, /asia.?pacific/i, /\bap\b/i] },
  { region: "cn", patterns: [/\bchina\b/i, /\bcn\b/i] },
  { region: "kr", patterns: [/\bkorea\b/i, /\bkr\b/i] },
  { region: "jp", patterns: [/\bjapan\b/i, /\bjp\b/i] },
  { region: "br", patterns: [/\bbrazil\b/i, /\bbr\b/i] },
  { region: "oce", patterns: [/\boce\b/i, /oceania/i] },
];

const timespanMatchers: Array<{
  days: NonNullable<ParsedQuery["filters"]["timespanDays"]>;
  patterns: RegExp[];
}> = [
  { days: "all", patterns: [/\ball time\b/i, /\ball\b/i, /all stats/i] },
  { days: 30, patterns: [/30 days/i, /last month/i] },
  { days: 60, patterns: [/60 days/i] },
  { days: 90, patterns: [/90 days/i, /last 3 months/i] },
];

const roleMatchers: Array<{
  role: NonNullable<ParsedQuery["filters"]["role"]>;
  patterns: RegExp[];
}> = [
  { role: "duelist", patterns: [/\bduelists?\b/i] },
  { role: "controller", patterns: [/\bcontrollers?\b/i] },
  { role: "initiator", patterns: [/\binitiators?\b/i] },
  { role: "sentinel", patterns: [/\bsentinels?\b/i] },
];

function parseTier(question: string): ParsedQuery["filters"]["tier"] {
  if (/\b(tier\s*1|tier one|major tournaments?|major events?)\b/i.test(question)) {
    return 1;
  }

  if (/\b(tier\s*2|tier two)\b/i.test(question)) {
    return 2;
  }

  return null;
}

const invalidPlayerTokens = new Set([
  "in",
  "at",
  "on",
  "for",
  "by",
  "with",
  "during",
  "within",
  "from",
  "of",
  "the",
  "a",
  "an",
  "all",
  "time",
  "days",
  "day",
  "last",
  "what",
  "whats",
  "who",
  "best",
  "top",
  "is",
  "are",
  "does",
  "did",
  "has",
  "team",
  "vct",
  "event",
  "events",
  "match",
  "matches",
  "schedule",
  "tournament",
]);

const validAgents = [
  "astra",
  "breach",
  "brimstone",
  "chamber",
  "clove",
  "cypher",
  "deadlock",
  "fade",
  "gekko",
  "harbor",
  "iso",
  "jett",
  "kayo",
  "killjoy",
  "neon",
  "omen",
  "phoenix",
  "raze",
  "reyna",
  "sage",
  "skye",
  "sova",
  "tejo",
  "viper",
  "vyse",
  "waylay",
  "yoru",
] as const;

function sanitizePlayerCandidate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().replace(/[?.!,]+$/g, "");
  if (!normalized) {
    return undefined;
  }

  return invalidPlayerTokens.has(normalized.toLowerCase()) ? undefined : normalized;
}

function sanitizeComparisonPlayers(players: Array<string | undefined>): string[] {
  return players
    .map((player) => sanitizePlayerCandidate(player))
    .filter((player): player is string => Boolean(player));
}

function parseMinRounds(question: string): number | undefined {
  const match = question.match(/\b(?:at least|min(?:imum)?|over)\s+(\d+)\s+rounds?\b/i);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseLimit(question: string): number {
  const topMatch =
    question.match(/\btop\s+(\d+)\b/i) ||
    question.match(/\bbest\s+(\d+)\b/i);

  if (!topMatch) {
    return 10;
  }

  const parsed = Number(topMatch[1]);
  if (Number.isNaN(parsed)) {
    return 10;
  }

  return Math.max(1, Math.min(parsed, 25));
}

function parseAgent(question: string): string | undefined {
  const agentPattern = validAgents.join("|");
  const match = question.match(new RegExp(`\\b(?:on|with|using)\\s+(${agentPattern})\\b`, "i"));
  return match?.[1]?.toLowerCase();
}

function parseRole(question: string): ParsedQuery["filters"]["role"] {
  return (
    roleMatchers.find(({ patterns }) =>
      patterns.some((pattern) => pattern.test(question))
    )?.role ?? null
  );
}

function parseTeam(question: string): string | undefined {
  const teamMatch =
    question.match(/\bteam\s+([a-z0-9._ -]+)\b/i) ||
    question.match(/\bfor\s+team\s+([a-z0-9._ -]+)\b/i);

  return teamMatch?.[1]?.trim();
}

function cleanMatchTeamCandidate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value
    .replace(/^(when is|when does|what time does|what time is|show me|find|tell me)\s+/i, "")
    .replace(/\b(play|playing|next|today|tomorrow|this week|right now)\b/gi, "")
    .replace(/[?.!,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}

function parseMatchTeams(question: string) {
  const versusMatch = question.match(
    /\b([a-z0-9][a-z0-9 .&'-]{1,40}?)\s+(?:vs|versus)\s+([a-z0-9][a-z0-9 .&'-]{1,40}?)(?:\?|$)/i
  );

  if (!versusMatch) {
    return { matchTeam: undefined, opponentTeam: undefined };
  }

  return {
    matchTeam: cleanMatchTeamCandidate(versusMatch[1]),
    opponentTeam: cleanMatchTeamCandidate(versusMatch[2]),
  };
}

function parseMatchTeam(question: string): string | undefined {
  const nextPlayMatch =
    question.match(/\bwhat\s+time\s+does\s+(.+?)\s+play\b/i) ||
    question.match(/\bwhen\s+does\s+(.+?)\s+play\b/i) ||
    question.match(/\bwhen\s+is\s+(.+?)\s+playing\b/i) ||
    question.match(/\bwhat\s+time\s+is\s+(.+?)\s+playing\b/i);

  return cleanMatchTeamCandidate(nextPlayMatch?.[1]);
}

function parseMatchStatus(question: string): ParsedQuery["filters"]["status"] {
  if (/\b(right now|live|playing now)\b/i.test(question)) {
    return "live";
  }

  if (/\b(upcoming|next|happening today|today|tomorrow|this week)\b/i.test(question)) {
    return "upcoming";
  }

  if (/\b(completed|finished|results?)\b/i.test(question)) {
    return "completed";
  }

  return null;
}

function parseDatePreset(question: string): ParsedQuery["filters"]["datePreset"] {
  if (/\btoday\b/i.test(question)) {
    return "today";
  }

  if (/\btomorrow\b/i.test(question)) {
    return "tomorrow";
  }

  if (/\bthis week\b/i.test(question)) {
    return "this_week";
  }

  if (/\bnext\b/i.test(question)) {
    return "next";
  }

  return null;
}

function isEventScheduleQuestion(question: string) {
  return /\b(event|events|tournament|tournaments|schedule|matches?|upcoming|live|when|date|prize|status|vct|champions tour)\b/i.test(
    question
  );
}

function inferIntent(params: {
  comparisonPlayers: string[];
  inferredPlayer?: string;
  team?: string;
  hasMatchIntent: boolean;
  hasEventIntent: boolean;
}): ParsedQuery["intent"] {
  if (params.hasMatchIntent) {
    return "match_lookup";
  }

  if (params.hasEventIntent) {
    return "event_lookup";
  }

  if (params.comparisonPlayers.length > 1) {
    return "comparison";
  }

  if (params.inferredPlayer) {
    return "player_lookup";
  }

  if (params.team) {
    return "team_lookup";
  }

  return "leaderboard";
}

export function buildParsedQueryFromPlan(
  plan: QueryPlan,
  question: string
): ParsedQuery {
  const normalizedQuestion = question.trim().replace(/\s+/g, " ");
  const comparisonPlayers = plan.filters.players.length > 1 ? plan.filters.players : undefined;
  const inferredRole = parseRole(normalizedQuestion);
  const inferredTier = parseTier(normalizedQuestion);
  const resolvedTier = inferredTier ?? null;
  const eventGroupId = getEventGroupIdForTier(resolvedTier);
  const normalizedRegion = normalizeAiRegion(plan.filters.region);

  return {
    rawQuestion: question,
    normalizedQuestion,
    intent: plan.intent,
    comparisonPlayers,
    metric: plan.metric,
    entity: plan.entity,
    sort: plan.sort,
    limit: plan.limit,
    filters: {
      region: normalizedRegion,
      timespanDays: plan.filters.timespanDays,
      tier: resolvedTier,
      eventGroupId,
      eventName: plan.filters.eventName,
      player: plan.filters.player,
      players: plan.filters.players,
      role: plan.filters.role ?? inferredRole,
      agent: plan.filters.agent,
      minRounds: plan.filters.minRounds,
      team: plan.filters.team,
      matchTeam: plan.filters.matchTeam,
      opponentTeam: plan.filters.opponentTeam,
      status: plan.filters.status,
      datePreset: plan.filters.datePreset,
    },
  };
}

export function parseQuery(question: string): ParsedQuery {
  const normalizedQuestion = question.trim().replace(/\s+/g, " ");
  const matchedMetric =
    metricMatchers.find(({ patterns }) =>
      patterns.some((pattern) => pattern.test(normalizedQuestion))
    )?.metric ?? "general";
  const matchedRegion =
    regionMatchers.find(({ patterns }) =>
      patterns.some((pattern) => pattern.test(normalizedQuestion))
    )?.region ?? "global";
  const matchedTimespan = timespanMatchers.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(normalizedQuestion))
  )?.days;
  const parsedMatchTeams = parseMatchTeams(normalizedQuestion);
  const parsedMatchTeam = parseMatchTeam(normalizedQuestion);
  const parsedMatchStatus = parseMatchStatus(normalizedQuestion);
  const parsedDatePreset = parseDatePreset(normalizedQuestion);
  const eventScheduleQuestion = isEventScheduleQuestion(normalizedQuestion);

  const compareMatch = normalizedQuestion.match(/compare\s+([a-z0-9._-]+)\s+and\s+([a-z0-9._-]+)/i);
  const versusMatch = normalizedQuestion.match(/\b([a-z0-9._-]+)\s+(?:vs|versus)\s+([a-z0-9._-]+)\b/i);
  const playerMatch = eventScheduleQuestion
    ? normalizedQuestion.match(/\bplayer\s+([a-z0-9._-]+)\b/i)
    : normalizedQuestion.match(/\bfor\s+([a-z0-9._-]+)\b/i) ||
      normalizedQuestion.match(/\bplayer\s+([a-z0-9._-]+)\b/i);
  const leadingNameMatch = normalizedQuestion.match(
    /^([a-z0-9._-]+)\s+(agents?|rating|acs|k\/d|kd|adr|rounds?|kills?\s+per\s+round|assists?\s+per\s+round|first\s+kills?\s+per\s+round|first\s+deaths?\s+per\s+round|headshot|clutch|kast)\b/i
  );
  const questionWords = /^(what|whats|show|tell|give|how|who|where|when|why|is|are|does|did|can|could)\b/i;
  const questionPrefixPlayerMatch = normalizedQuestion.match(
    /^(?:what(?:'s|\s+is)?|show|tell me|give me)\s+([a-z0-9._-]+)\s+(agents?|rating|acs|k\/d|kd|adr|kpr|apr|fkpr|fdpr|rounds?|kills?\s+per\s+round|assists?\s+per\s+round|first\s+kills?\s+per\s+round|first\s+deaths?\s+per\s+round|headshot|clutch|kast)\b/i
  );
  const inRegionPlayerMatch = normalizedQuestion.match(
    /^(?:what(?:'s|\s+is)?|whats\s+is|show|tell me|give me)\s+([a-z0-9._-]+)\s+in\s+(?:na|north america|emea|eu|europe|pacific|asia.?pacific|br|brazil)\b/i
  );
  const metricBeforePlayerMatch = normalizedQuestion.match(
    /\b(?:agents?|rating|acs|k\/d|kd|adr|kpr|apr|fkpr|fdpr|rounds?|kills?\s+per\s+round|assists?\s+per\s+round|first\s+kills?\s+per\s+round|first\s+deaths?\s+per\s+round|headshot|clutch|kast)\s+(?:for\s+)?([a-z0-9._-]+)\b/i
  );
  const possessivePlayerMatch = normalizedQuestion.match(
    /\b([a-z0-9._-]+)('?s)?\s+(agents?|rating|acs|k\/d|kd|adr|kpr|apr|fkpr|fdpr|rounds?|kills?\s+per\s+round|assists?\s+per\s+round|first\s+kills?\s+per\s+round|first\s+deaths?\s+per\s+round|headshot|clutch|kast)\b/i
  );
  const doesPlayerPlayMatch = normalizedQuestion.match(/what\s+agents?\s+does\s+([a-z0-9._-]+)\s+play\b/i);

  const comparisonPlayers = sanitizeComparisonPlayers([
    compareMatch?.[1] || versusMatch?.[1],
    compareMatch?.[2] || versusMatch?.[2],
  ]);

  const inferredPlayer =
    comparisonPlayers.length > 0
      ? undefined
      : sanitizePlayerCandidate(
          playerMatch?.[1] ||
            doesPlayerPlayMatch?.[1] ||
            questionPrefixPlayerMatch?.[1] ||
            inRegionPlayerMatch?.[1] ||
            (leadingNameMatch?.[1] && !questionWords.test(leadingNameMatch[1])
              ? leadingNameMatch[1]
              : undefined) ||
            metricBeforePlayerMatch?.[1] ||
            possessivePlayerMatch?.[1]
        );

  const team = parseTeam(normalizedQuestion);
  const agent = parseAgent(normalizedQuestion);
  const role = parseRole(normalizedQuestion);
  const tier = parseTier(normalizedQuestion);
  const eventGroupId = getEventGroupIdForTier(tier);
  const minRounds = parseMinRounds(normalizedQuestion);
  const defaultTimespan = matchedTimespan ?? (comparisonPlayers.length > 0 ? "all" : 30);
  const matchTeam = parsedMatchTeams.matchTeam || parsedMatchTeam;
  const opponentTeam = parsedMatchTeams.opponentTeam;
  const hasDirectMatchIntent =
    Boolean(matchTeam) ||
    Boolean(opponentTeam) ||
    Boolean(parsedMatchStatus) ||
    parsedDatePreset !== null;
  const hasEventIntent =
    !hasDirectMatchIntent &&
    /\b(event|tournament|prize|region|status|schedule|vct|champions tour)\b/i.test(
      normalizedQuestion
    );
  const intent = inferIntent({
    comparisonPlayers,
    inferredPlayer,
    team,
    hasMatchIntent: hasDirectMatchIntent || (!hasEventIntent && eventScheduleQuestion),
    hasEventIntent,
  });
  const entity: ParsedQuery["entity"] =
    intent === "match_lookup"
      ? "match"
      : intent === "event_lookup"
        ? "event"
        : comparisonPlayers.length > 0 || inferredPlayer
          ? "player"
          : team
            ? "team"
            : "general";

  return {
    rawQuestion: question,
    normalizedQuestion,
    intent,
    comparisonPlayers: comparisonPlayers.length > 1 ? comparisonPlayers : undefined,
    metric: matchedMetric,
    entity,
    sort: entity === "match" || entity === "event" ? "asc" : "desc",
    limit: parseLimit(normalizedQuestion),
    filters: {
      region: matchedRegion,
      timespanDays: defaultTimespan,
      tier,
      eventGroupId,
      eventName: null,
      player: inferredPlayer ?? null,
      players: comparisonPlayers,
      role,
      agent: agent ?? null,
      minRounds: minRounds ?? null,
      team: team ?? null,
      matchTeam: matchTeam ?? null,
      opponentTeam: opponentTeam ?? null,
      status: parsedMatchStatus,
      datePreset: parsedDatePreset,
    },
  };
}
