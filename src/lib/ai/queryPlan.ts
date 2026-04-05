import axios from "axios";
import { z } from "./zod";

export const queryPlanIntentValues = [
  "leaderboard",
  "player_lookup",
  "team_lookup",
  "comparison",
  "match_lookup",
  "event_lookup",
] as const;

export const queryPlanEntityValues = [
  "player",
  "team",
  "match",
  "event",
  "general",
] as const;

export const queryPlanMetricValues = [
  "agents",
  "rating",
  "acs",
  "kd",
  "adr",
  "hs_percentage",
  "kpr",
  "apr",
  "fkpr",
  "fdpr",
  "kast_percentage",
  "clutch_success_percentage",
  "rounds_played",
  "general",
] as const;

export const queryPlanRegionValues = [
  "na",
  "emea",
  "pacific",
  "br",
  "global",
] as const;

export const queryPlanRoleValues = [
  "duelist",
  "controller",
  "initiator",
  "sentinel",
] as const;

export const queryPlanStatusValues = ["live", "upcoming", "completed"] as const;
export const queryPlanDatePresetValues = [
  "today",
  "tomorrow",
  "this_week",
  "next",
] as const;

export const queryPlanSortValues = ["asc", "desc"] as const;
export const queryPlanTierValues = [1, 2, 3, 4, 5] as const;

export const tierEventGroupMap: Partial<
  Record<(typeof queryPlanTierValues)[number], number>
> = {
  1: 86,
};

export function getEventGroupIdForTier(
  tier: (typeof queryPlanTierValues)[number] | null | undefined
) {
  if (tier == null) {
    return null;
  }

  return tierEventGroupMap[tier] ?? null;
}

export const roleAgentMap: Record<
  (typeof queryPlanRoleValues)[number],
  string[]
> = {
  duelist: ["jett", "raze", "reyna", "phoenix", "neon", "yoru", "iso", "waylay"],
  controller: ["astra", "brimstone", "clove", "harbor", "omen", "viper"],
  initiator: ["breach", "fade", "gekko", "kayo", "skye", "sova", "tejo"],
  sentinel: ["chamber", "cypher", "deadlock", "killjoy", "sage", "vyse"],
};

export const queryPlanFiltersSchema = z
  .object({
    region: z.enum(queryPlanRegionValues).default("global"),
    timespanDays: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal("all")]).default(30),
    tier: z.union(queryPlanTierValues.map((value) => z.literal(value)) as [any, any, ...any[]]).nullable().default(null),
    team: z.string().trim().min(1).nullable().default(null),
    player: z.string().trim().min(1).nullable().default(null),
    players: z.array(z.string().trim().min(1)).max(5).default([]),
    role: z.enum(queryPlanRoleValues).nullable().default(null),
    agent: z.string().trim().min(1).nullable().default(null),
    matchTeam: z.string().trim().min(1).nullable().default(null),
    opponentTeam: z.string().trim().min(1).nullable().default(null),
    status: z.enum(queryPlanStatusValues).nullable().default(null),
    datePreset: z.enum(queryPlanDatePresetValues).nullable().default(null),
    minRounds: z.number().int().nonnegative().nullable().default(null),
    eventName: z.string().trim().min(1).nullable().default(null),
  })
  .strict();

export const queryPlanSchema = z
  .object({
    intent: z.enum(queryPlanIntentValues),
    entity: z.enum(queryPlanEntityValues),
    metric: z.enum(queryPlanMetricValues).default("general"),
    sort: z.enum(queryPlanSortValues).default("desc"),
    limit: z.number().int().min(1).max(25).default(10),
    filters: queryPlanFiltersSchema,
  })
  .strict();

export interface QueryPlan {
  intent: (typeof queryPlanIntentValues)[number];
  entity: (typeof queryPlanEntityValues)[number];
  metric: (typeof queryPlanMetricValues)[number];
  sort: (typeof queryPlanSortValues)[number];
  limit: number;
  filters: {
    region: (typeof queryPlanRegionValues)[number];
    timespanDays: 30 | 60 | 90 | "all";
    tier: (typeof queryPlanTierValues)[number] | null;
    team: string | null;
    player: string | null;
    players: string[];
    role: (typeof queryPlanRoleValues)[number] | null;
    agent: string | null;
    matchTeam: string | null;
    opponentTeam: string | null;
    status: (typeof queryPlanStatusValues)[number] | null;
    datePreset: (typeof queryPlanDatePresetValues)[number] | null;
    minRounds: number | null;
    eventName: string | null;
  };
}

const plannerSystemPrompt = `
You convert Valorant esports questions into a structured query plan.
Return JSON only.
Do not answer the user's question.
Do not generate SQL, pseudo-SQL, or database syntax.
Use only the allowed enum values exactly.
If the user asks for "best" players, default metric to "rating".
If the user asks for "top N", use that limit.
If the user asks about duelists/controllers/initiators/sentinels, use the role field.
If the user asks about major tournaments or tier 1 players, set filters.tier to 1.
If the question is about schedules, matches, or "who is playing", use match_lookup.
If the question is about a specific event or tournament context, use event_lookup or match_lookup as appropriate.
If nothing else fits, use general metric and a reasonable intent.
`;

function extractJsonObject(content: string) {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error("Planner returned empty content.");
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("Planner response did not contain a JSON object.");
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

export async function planQuestion(question: string): Promise<QueryPlan | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: plannerSystemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0,
        max_tokens: 350,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content =
      response.data?.choices?.[0]?.message?.content ??
      "";
    const parsed = JSON.parse(extractJsonObject(content));

    return queryPlanSchema.parse(parsed);
  } catch (error) {
    console.error("Planner failed:", error);
    return null;
  }
}
