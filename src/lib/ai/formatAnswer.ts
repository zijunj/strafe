import type { ParsedQuery } from "./parseQuery";
import type { RetrievedStatRow, RetrievedStatsResult } from "./retrieveStats";

export interface AIFormattedResponse {
  answer: string;
  parsedQuery: ParsedQuery;
  supportingData: RetrievedStatRow[];
  retrievalMeta: RetrievedStatsResult["retrievalMeta"];
}

export function formatAnswer(params: {
  answer: string;
  parsedQuery: ParsedQuery;
  supportingData: RetrievedStatRow[];
  retrievalMeta: RetrievedStatsResult["retrievalMeta"];
}): AIFormattedResponse {
  return {
    answer: params.answer.trim(),
    parsedQuery: params.parsedQuery,
    supportingData: params.supportingData,
    retrievalMeta: params.retrievalMeta,
  };
}
