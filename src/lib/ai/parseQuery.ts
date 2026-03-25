export interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
  metric: "rating" | "acs" | "kd" | "adr" | "hs_percentage" | "general";
  entity: "player" | "team" | "match" | "general";
  filters: {
    region?: "na" | "emea" | "pacific" | "br" | "global";
    timespanDays?: 30 | 60 | 90;
    player?: string;
    team?: string;
  };
}

const metricMatchers: Array<{
  metric: ParsedQuery["metric"];
  patterns: RegExp[];
}> = [
  { metric: "rating", patterns: [/\brating\b/i, /\bbest player\b/i] },
  { metric: "acs", patterns: [/\bacs\b/i, /combat score/i] },
  { metric: "kd", patterns: [/\bk\/d\b/i, /\bkd\b/i, /kill.?death/i] },
  { metric: "adr", patterns: [/\badr\b/i, /damage per round/i] },
  {
    metric: "hs_percentage",
    patterns: [/\bhs%\b/i, /headshot/i, /headshot percentage/i],
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
  { days: 30, patterns: [/30 days/i, /last month/i] },
  { days: 60, patterns: [/60 days/i] },
  { days: 90, patterns: [/90 days/i, /last 3 months/i] },
];

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

  return {
    rawQuestion: question,
    normalizedQuestion,
    metric: matchedMetric,
    entity: compareMatch || playerMatch ? "player" : "general",
    filters: {
      region: matchedRegion,
      timespanDays: matchedTimespan ?? 30,
      player: compareMatch
        ? `${compareMatch[1]}, ${compareMatch[2]}`
        : playerMatch?.[1],
    },
  };
}
