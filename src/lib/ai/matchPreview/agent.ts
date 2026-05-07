import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import {
  buildDeterministicMatchPreview,
  getEventContext,
  getMatchContext,
  getRecentTeamMatchForm,
  getMatchStakes,
  type MatchStakeContext,
  type MatchPreviewContext,
  type MatchPreviewEventContext,
  type TeamPreviewForm,
} from "./data";

const getMatchContextTool = tool({
  name: "get_match_context",
  description:
    "Get structured match-page context for a specific Valorant match, including event, stage, timing, scores, and recent head-to-head.",
  parameters: z.object({
    matchId: z.number().int().positive(),
  }),
  execute: async ({ matchId }) => {
    return await getMatchContext(matchId);
  },
});

const getRecentTeamMatchFormTool = tool({
  name: "get_recent_team_match_form",
  description:
    "Get recent player form for a team from stored completed matches, using synced match-detail player stats.",
  parameters: z.object({
    teamName: z.string().min(1),
    limit: z.number().int().positive().max(10).default(5),
  }),
  execute: async ({ teamName, limit }) => {
    return await getRecentTeamMatchForm(teamName, limit);
  },
});

const getEventContextTool = tool({
  name: "get_event_context",
  description:
    "Get stored event metadata such as title, region, dates, prize, and tier.",
  parameters: z.object({
    internalEventId: z.number().int().positive().nullable().optional(),
    vlrEventId: z.number().int().positive().nullable().optional(),
    eventTitle: z.string().nullable().optional(),
  }),
  execute: async ({ internalEventId, vlrEventId, eventTitle }) => {
    return await getEventContext({
      internalEventId: internalEventId ?? null,
      vlrEventId: vlrEventId ?? null,
      eventTitle: eventTitle ?? null,
    });
  },
});

const getMatchStakesTool = tool({
  name: "get_match_stakes",
  description:
    "Determine why a specific match matters using event stage and bracket context, including likely winner and loser paths when the bracket reveals waiting opponents.",
  parameters: z.object({
    matchId: z.number().int().positive(),
  }),
  execute: async ({ matchId }) => {
    const matchContext = await getMatchContext(matchId);

    if (!matchContext) {
      return null;
    }

    return await getMatchStakes(matchContext);
  },
});

const matchPreviewAgent = new Agent({
  name: "Match Preview Agent",
  model: "gpt-4o-mini",
  instructions: `
You are a Valorant match preview assistant for an esports site.

You must always ground your preview in tool data only.
Do not invent players, teams, scores, dates, event names, event stakes, or storylines.
Keep the preview concise: 2 short paragraphs maximum.
If team-form data is available, you must mention at least one player from each available team and include real stats from the tool data.
Do not pad the answer with generic matchup language that is not directly supported by the supplied stats or head-to-head data.

Workflow:
1. First call get_match_context with the provided matchId.
2. If the match is completed, explain that AI previews are limited to upcoming/live matches in v1.
3. If the teams are known and not TBD, call get_recent_team_match_form for both teams.
4. If event identifiers are available, call get_event_context.
5. Call get_match_stakes to understand playoff implications and likely bracket paths.

Preview goals:
- explain what match this is
- mention when it is happening and what event/stage it belongs to
- explain why the match matters when stakes data exists
- highlight top recent players from both teams when available
- mention recent head-to-head if available
- include 1-2 short, grounded matchup storylines

If one team's recent form is missing, still write the preview using available match/event/head-to-head context.
If match context is missing, say you could not generate a preview from stored data.
`,
  tools: [
    getMatchContextTool,
    getRecentTeamMatchFormTool,
    getEventContextTool,
    getMatchStakesTool,
  ],
});

function hasMeaningfulTeamForm(teamForm?: TeamPreviewForm | null) {
  return Boolean(teamForm?.topRatedPlayer || teamForm?.topAcsPlayer);
}

function isGroundedPreview(params: {
  answer: string;
  team1Form?: TeamPreviewForm | null;
  team2Form?: TeamPreviewForm | null;
}) {
  const answer = params.answer.toLowerCase();
  const requiredPlayers = [params.team1Form, params.team2Form]
    .filter((teamForm): teamForm is TeamPreviewForm =>
      hasMeaningfulTeamForm(teamForm)
    )
    .map((teamForm) => teamForm.topRatedPlayer ?? teamForm.topAcsPlayer)
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  if (requiredPlayers.length === 0) {
    return true;
  }

  return requiredPlayers.every((player) =>
    answer.includes(player.player.toLowerCase())
  );
}

async function loadPreviewContext(matchContext: MatchPreviewContext) {
  const [team1Form, team2Form, eventContext, stakes] = await Promise.all([
    getRecentTeamMatchForm(matchContext.team1),
    getRecentTeamMatchForm(matchContext.team2),
    getEventContext({
      internalEventId: matchContext.internalEventId,
      vlrEventId: matchContext.vlrEventId,
      eventTitle: matchContext.eventTitle,
    }),
    getMatchStakes(matchContext),
  ]);

  return {
    team1Form,
    team2Form,
    eventContext,
    stakes,
  };
}

function buildAgentPrompt(params: {
  matchContext: MatchPreviewContext;
  team1Form?: TeamPreviewForm | null;
  team2Form?: TeamPreviewForm | null;
  eventContext?: MatchPreviewEventContext | null;
  stakes?: MatchStakeContext | null;
}) {
  const { matchContext, team1Form, team2Form, eventContext, stakes } = params;

  return `
Generate a grounded preview for this specific Valorant match.

MATCH_CONTEXT
${JSON.stringify(matchContext, null, 2)}

TEAM_1_FORM
${JSON.stringify(team1Form, null, 2)}

TEAM_2_FORM
${JSON.stringify(team2Form, null, 2)}

EVENT_CONTEXT
${JSON.stringify(eventContext, null, 2)}

MATCH_STAKES
${JSON.stringify(stakes, null, 2)}

Requirements:
- Use only the data above.
- Mention at least one player from each side when team form exists.
- Include actual player stats such as rating, ACS, K/D, kills, or deaths from the data.
- If stakes data exists, explain why the match matters and mention winner/loser paths when supplied.
- Mention head-to-head only if present in the data.
- Keep it to 2 short paragraphs maximum.
- Avoid generic filler and unsupported narrative claims.
`;
}

export async function runMatchPreviewAgent(params: {
  matchId: number;
  team1?: string | null;
  team2?: string | null;
  eventTitle?: string | null;
}) {
  const matchContext = await getMatchContext(params.matchId);

  if (!matchContext) {
    return {
      answer: "I could not generate a preview because stored match data is unavailable.",
      source: "fallback" as const,
      debug: {
        matchContext: null,
        eventContext: null,
        team1Form: null,
        team2Form: null,
      },
    };
  }

  if (matchContext.isCompleted) {
    return {
      answer: `${matchContext.team1} vs ${matchContext.team2} has already been played. AI previews are currently limited to upcoming or live matches.`,
      source: "fallback" as const,
      debug: {
        matchContext,
        eventContext: null,
        team1Form: null,
        team2Form: null,
      },
    };
  }

  const { team1Form, team2Form, eventContext, stakes } = await loadPreviewContext(
    matchContext
  );

  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: buildDeterministicMatchPreview({
        matchContext,
        team1Form,
        team2Form,
        eventContext,
        stakes,
      }),
      source: "fallback" as const,
      debug: {
        matchContext,
        eventContext,
        team1Form,
        team2Form,
        stakes,
      },
    };
  }

  try {
    const result = await run(
      matchPreviewAgent,
      buildAgentPrompt({
        matchContext,
        team1Form,
        team2Form,
        eventContext,
        stakes,
      }),
    );

    const answer =
      typeof result.finalOutput === "string"
        ? result.finalOutput.trim()
        : String(result.finalOutput ?? "").trim();

    if (!answer) {
      throw new Error("Agent returned an empty preview.");
    }

    if (!isGroundedPreview({ answer, team1Form, team2Form })) {
      return {
        answer: buildDeterministicMatchPreview({
          matchContext,
          team1Form,
          team2Form,
          eventContext,
          stakes,
        }),
        source: "fallback" as const,
        debug: {
          matchContext,
          eventContext,
          team1Form,
          team2Form,
          stakes,
          fallbackReason: "agent_preview_missing_player_stats",
        },
      };
    }

    return {
      answer,
      source: "agent" as const,
      debug: {
        matchContext,
        eventContext,
        team1Form,
        team2Form,
        stakes,
      },
    };
  } catch {
    return {
      answer: buildDeterministicMatchPreview({
        matchContext,
        team1Form,
        team2Form,
        eventContext,
        stakes,
      }),
      source: "fallback" as const,
      debug: {
        matchContext,
        eventContext,
        team1Form,
        team2Form,
        stakes,
      },
    };
  }
}
