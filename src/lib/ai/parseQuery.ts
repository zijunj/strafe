export interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
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
    player?: string;
    team?: string;
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
  "for",
  "by",
  "with",
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
  "has"
]);

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

  const compareMatch = normalizedQuestion.match(
    /compare\s+([a-z0-9._-]+)\s+and\s+([a-z0-9._-]+)/i
  );

  const playerMatch =
    normalizedQuestion.match(/\bfor\s+([a-z0-9._-]+)\b/i) ||
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

  const inferredPlayer =
    compareMatch
      ? `${compareMatch[1]}, ${compareMatch[2]}`
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

  return {
    rawQuestion: question,
    normalizedQuestion,
    metric: matchedMetric,
    entity:
      compareMatch || inferredPlayer
        ? "player"
        : "general",
    filters: {
      region: matchedRegion,
      timespanDays: matchedTimespan ?? 30,
      player: inferredPlayer,
    },
  };
}
