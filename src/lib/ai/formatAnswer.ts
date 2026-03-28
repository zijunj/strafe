import type { ParsedQuery } from "./parseQuery";
import type { RetrievedStatRow, RetrievedStatsResult } from "./retrieveStats";

export interface AIResponseUIHints {
  intent: "comparison" | "player_lookup" | "team_lookup" | "leaderboard";
  title: string;
  highlightMetric: ParsedQuery["metric"];
  highlightPlayers?: string[];
  highlightTeam?: string;
  showSupportingData: boolean;
  suggestedFollowUps: string[];
}

export interface AIFormattedResponse {
  answer: string;
  parsedQuery: ParsedQuery;
  supportingData: RetrievedStatRow[];
  retrievalMeta: RetrievedStatsResult["retrievalMeta"];
  contextData: RetrievedStatsResult["contextData"];
  uiHints: AIResponseUIHints;
}

function buildUIHints(params: {
  parsedQuery: ParsedQuery;
  supportingData: RetrievedStatRow[];
}): AIResponseUIHints {
  const { parsedQuery, supportingData } = params;
  const comparisonPlayers = parsedQuery.comparisonPlayers;
  const team = parsedQuery.filters.team;
  const player = parsedQuery.filters.player;
  const metricLabel =
    parsedQuery.metric === "general"
      ? "stats"
      : parsedQuery.metric.replace(/_/g, " ");

  if (comparisonPlayers?.length) {
    return {
      intent: "comparison",
      title: `Compare ${comparisonPlayers.join(" vs ")}`,
      highlightMetric: parsedQuery.metric,
      highlightPlayers: comparisonPlayers,
      showSupportingData: true,
      suggestedFollowUps: [
        `Who has the better ${metricLabel}?`,
        `Show ${comparisonPlayers[0]} agents`,
      ],
    };
  }

  if (player) {
    return {
      intent: "player_lookup",
      title: `${player} ${metricLabel}`,
      highlightMetric: parsedQuery.metric,
      highlightPlayers: [player],
      showSupportingData: true,
      suggestedFollowUps: [
        `Show ${player} over 90 days`,
        `What agents does ${player} play?`,
      ],
    };
  }

  if (team) {
    return {
      intent: "team_lookup",
      title: `${team} ${metricLabel}`,
      highlightMetric: parsedQuery.metric,
      highlightTeam: team,
      showSupportingData: supportingData.length > 0,
      suggestedFollowUps: [
        `Who has the best rating on ${team}?`,
        `Show ${team} players by ACS`,
      ],
    };
  }

  return {
    intent: "leaderboard",
    title: "Top player stats",
    highlightMetric: parsedQuery.metric,
    showSupportingData: supportingData.length > 0,
    suggestedFollowUps: [
      "Who leads in rating?",
      "Compare two players by ACS",
    ],
  };
}

export function formatAnswer(params: {
  answer: string;
  parsedQuery: ParsedQuery;
  supportingData: RetrievedStatRow[];
  retrievalMeta: RetrievedStatsResult["retrievalMeta"];
  contextData: RetrievedStatsResult["contextData"];
}): AIFormattedResponse {
  return {
    answer: params.answer.trim(),
    parsedQuery: params.parsedQuery,
    supportingData: params.supportingData,
    retrievalMeta: params.retrievalMeta,
    contextData: params.contextData,
    uiHints: buildUIHints(params),
  };
}
