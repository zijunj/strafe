export interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
  comparisonPlayers?: string[];
  metric:
    | "agents"
    | "rating"
    | "acs"
    | "kd"
    | "adr"
    | "hs_percentage"
    | "kpr"
    | "apr"
    | "fkpr"
    | "fdpr"
    | "kast_percentage"
    | "clutch_success_percentage"
    | "rounds_played"
    | "general";
  entity: "player" | "team" | "match" | "general";
  filters: {
    region?: "na" | "emea" | "pacific" | "br" | "global";
    timespanDays?: 30 | 60 | 90 | "all";
    eventGroupId?: number | null;
    player?: string;
    agent?: string;
    minRounds?: number;
    team?: string;
    matchTeam?: string;
    opponentTeam?: string;
    status?: "live" | "upcoming" | "completed";
    datePreset?: "today" | "tomorrow" | "this_week" | "next" | null;
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
  { metric: "rating", patterns: [/\brating\b/i, /\bbest player\b/i] },
  { metric: "acs", patterns: [/\bacs\b/i, /combat score/i] },
  { metric: "kd", patterns: [/\bk\/d\b/i, /\bkd\b/i, /kill.?death/i] },
  { metric: "adr", patterns: [/\badr\b/i, /damage per round/i] },
  {
    metric: "kpr",
    patterns: [/\bkpr\b/i, /kills per round/i, /kill per round/i],
  },
  {
    metric: "apr",
    patterns: [/\bapr\b/i, /assists per round/i, /assist per round/i],
  },
  {
    metric: "fkpr",
    patterns: [/\bfkpr\b/i, /first kills per round/i, /first kill per round/i],
  },
  {
    metric: "fdpr",
    patterns: [
      /\bfdpr\b/i,
      /first deaths per round/i,
      /first death per round/i,
    ],
  },
  {
    metric: "kast_percentage",
    patterns: [/\bkast\b/i, /survived traded/i],
  },
  {
    metric: "hs_percentage",
    patterns: [/\bhs%\b/i, /headshot/i, /headshot percentage/i],
  },
  {
    metric: "clutch_success_percentage",
    patterns: [/\bclutch\b/i, /clutch success/i],
  },
  {
    metric: "rounds_played",
    patterns: [/\brounds played\b/i, /\brounds\b/i],
  },
];

const regionMatchers: Array<{
  region: NonNullable<ParsedQuery["filters"]["region"]>;
  patterns: RegExp[];
}> = [
  { region: "na", patterns: [/north america/i, /\bna\b/i] },
  { region: "emea", patterns: [/\bemea\b/i, /\beu\b/i, /europe/i] },
  { region: "pacific", patterns: [/\bpacific\b/i, /asia.?pacific/i] },
  { region: "br", patterns: [/\bbrazil\b/i, /\bbr\b/i] },
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

  return invalidPlayerTokens.has(normalized.toLowerCase())
    ? undefined
    : normalized;
}

function sanitizeComparisonPlayers(players: Array<string | undefined>): string[] {
  return players
    .map((player) => sanitizePlayerCandidate(player))
    .filter((player): player is string => Boolean(player));
}

function parseMinRounds(question: string): number | undefined {
  const match = question.match(
    /\b(?:at least|min(?:imum)?|over)\s+(\d+)\s+rounds?\b/i
  );

  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseAgent(question: string): string | undefined {
  const agentPattern = validAgents.join("|");
  const match = question.match(
    new RegExp(`\\b(?:on|with|using)\\s+(${agentPattern})\\b`, "i")
  );

  return match?.[1]?.toLowerCase();
}

function parseTeam(question: string): string | undefined {
  const teamMatch =
    question.match(/\bteam\s+([a-z0-9._-]+)\b/i) ||
    question.match(/\bfor\s+team\s+([a-z0-9._-]+)\b/i);

  return teamMatch?.[1];
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

function parseMatchStatus(question: string): "live" | "upcoming" | "completed" | undefined {
  if (/\b(right now|live|playing now)\b/i.test(question)) {
    return "live";
  }

  if (/\b(upcoming|next|happening today|today|tomorrow|this week)\b/i.test(question)) {
    return "upcoming";
  }

  if (/\b(completed|finished|results?)\b/i.test(question)) {
    return "completed";
  }

  return undefined;
}

function parseDatePreset(
  question: string
): "today" | "tomorrow" | "this_week" | "next" | null {
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
  const matchedEventGroupId = null;
  const eventScheduleQuestion = isEventScheduleQuestion(normalizedQuestion);
  const parsedMatchTeams = parseMatchTeams(normalizedQuestion);
  const parsedMatchTeam = parseMatchTeam(normalizedQuestion);
  const parsedMatchStatus = parseMatchStatus(normalizedQuestion);
  const parsedDatePreset = parseDatePreset(normalizedQuestion);

  const compareMatch = normalizedQuestion.match(
    /compare\s+([a-z0-9._-]+)\s+and\s+([a-z0-9._-]+)/i
  );
  const versusMatch = normalizedQuestion.match(
    /\b([a-z0-9._-]+)\s+(?:vs|versus)\s+([a-z0-9._-]+)\b/i
  );

  const playerMatch = eventScheduleQuestion
    ? normalizedQuestion.match(/\bplayer\s+([a-z0-9._-]+)\b/i)
    : normalizedQuestion.match(/\bfor\s+([a-z0-9._-]+)\b/i) ||
      normalizedQuestion.match(/\bplayer\s+([a-z0-9._-]+)\b/i);

  const leadingNameMatch = normalizedQuestion.match(
    /^([a-z0-9._-]+)\s+(agents?|rating|acs|k\/d|kd|adr|rounds?|kills?\s+per\s+round|assists?\s+per\s+round|first\s+kills?\s+per\s+round|first\s+deaths?\s+per\s+round|headshot|clutch|kast)\b/i
  );

  // Exclude common question words from being captured as player names
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

  const doesPlayerPlayMatch = normalizedQuestion.match(
    /what\s+agents?\s+does\s+([a-z0-9._-]+)\s+play\b/i
  );

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
  const minRounds = parseMinRounds(normalizedQuestion);
  const defaultTimespan =
    matchedTimespan ?? (comparisonPlayers.length > 0 ? "all" : 30);
  const matchTeam = parsedMatchTeams.matchTeam || parsedMatchTeam;
  const opponentTeam = parsedMatchTeams.opponentTeam;
  const hasMatchIntent =
    Boolean(matchTeam) ||
    Boolean(opponentTeam) ||
    Boolean(parsedMatchStatus) ||
    parsedDatePreset !== null ||
    eventScheduleQuestion;

  return {
    rawQuestion: question,
    normalizedQuestion,
    comparisonPlayers:
      comparisonPlayers.length > 1 ? comparisonPlayers : undefined,
    metric: matchedMetric,
    entity:
      hasMatchIntent
        ? "match"
        : comparisonPlayers.length > 0 || inferredPlayer
        ? "player"
        : team
          ? "team"
        : "general",
    filters: {
      region: matchedRegion,
      timespanDays: defaultTimespan,
      eventGroupId: matchedEventGroupId,
      player: inferredPlayer,
      agent,
      minRounds,
      team,
      matchTeam,
      opponentTeam,
      status: parsedMatchStatus,
      datePreset: parsedDatePreset,
    },
  };
}
