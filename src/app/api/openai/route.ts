import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { formatAnswer } from "@/lib/ai/formatAnswer";
import { buildParsedQueryFromPlan, parseQuery, type ParsedQuery } from "@/lib/ai/parseQuery";
import { planQuestion } from "@/lib/ai/queryPlan";
import { retrieveStats } from "@/lib/ai/retrieveStats";

async function generateAnswerFromContext(params: {
  question: string;
  parsedQuery: ReturnType<typeof parseQuery>;
  retrievedStats: Awaited<ReturnType<typeof retrieveStats>>;
}) {
  // Guard: if no data retrieved, don't call LLM
  if (params.retrievedStats.rows.length === 0 && !params.retrievedStats.contextData?.matches?.length) {
    return "I could not find enough data to answer that question.";
  }

  const systemPrompt = `
You are a Valorant stats assistant.
Answer ONLY from the supplied structured data.
Do not invent or assume any players, teams, events, dates, or numbers.
Do not make up stats that are not in the provided data.
If the answer cannot be fully supported by the provided data, respond with:
"I could not find enough data to answer that question."
Keep answers short, factual, and grounded in the data.
`;

  const userPrompt = `
Question:
${params.question}

Parsed query:
${JSON.stringify(params.parsedQuery, null, 2)}

Retrieved context:
${JSON.stringify(params.retrievedStats.contextData, null, 2)}

Retrieved data:
${JSON.stringify(params.retrievedStats.rows, null, 2)}
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 250,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return (
    response.data?.choices?.[0]?.message?.content ??
    "I could not generate an answer for that question."
  );
}

function formatMatchDate(value?: string | null) {
  if (!value) {
    return "an unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "an unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}

function mergeParsedQuery(plannedParsedQuery: ParsedQuery, regexParsedQuery: ParsedQuery): ParsedQuery {
  const plannedPlayers = plannedParsedQuery.filters.players ?? [];
  const regexPlayers = regexParsedQuery.filters.players ?? [];

  return {
    ...plannedParsedQuery,
    comparisonPlayers:
      plannedParsedQuery.comparisonPlayers?.length
        ? plannedParsedQuery.comparisonPlayers
        : regexParsedQuery.comparisonPlayers,
    filters: {
      ...plannedParsedQuery.filters,
      region:
        plannedParsedQuery.filters.region === "global"
          ? regexParsedQuery.filters.region
          : plannedParsedQuery.filters.region,
      player:
        plannedParsedQuery.filters.player ?? regexParsedQuery.filters.player,
      players:
        plannedPlayers.length > 0 ? plannedPlayers : regexPlayers,
      team:
        plannedParsedQuery.filters.team ?? regexParsedQuery.filters.team,
      role:
        plannedParsedQuery.filters.role ?? regexParsedQuery.filters.role,
      agent:
        plannedParsedQuery.filters.agent ?? regexParsedQuery.filters.agent,
      status:
        plannedParsedQuery.filters.status ?? regexParsedQuery.filters.status,
      datePreset:
        plannedParsedQuery.filters.datePreset ?? regexParsedQuery.filters.datePreset,
      timespanDays:
        plannedParsedQuery.filters.timespanDays ?? regexParsedQuery.filters.timespanDays,
      eventName:
        plannedParsedQuery.filters.eventName ?? regexParsedQuery.filters.eventName,
      minRounds:
        plannedParsedQuery.filters.minRounds ?? regexParsedQuery.filters.minRounds,
      opponentTeam:
        plannedParsedQuery.filters.opponentTeam ?? regexParsedQuery.filters.opponentTeam,
      matchTeam:
        plannedParsedQuery.filters.matchTeam ?? regexParsedQuery.filters.matchTeam,
      tier:
        plannedParsedQuery.filters.tier ?? regexParsedQuery.filters.tier,
      eventGroupId:
        plannedParsedQuery.filters.eventGroupId ?? regexParsedQuery.filters.eventGroupId,
    },
  };
}

function buildMatchAnswer(question: string, parsedQuery: ReturnType<typeof parseQuery>, matches: NonNullable<Awaited<ReturnType<typeof retrieveStats>>["contextData"]["matches"]>) {
  if (!matches.length) {
    if (parsedQuery.filters.matchTeam && parsedQuery.filters.opponentTeam) {
      return `I could not find a stored match for ${parsedQuery.filters.matchTeam} vs ${parsedQuery.filters.opponentTeam}.`;
    }

    if (parsedQuery.filters.matchTeam) {
      return `I could not find a stored upcoming or live match for ${parsedQuery.filters.matchTeam}.`;
    }

    if (parsedQuery.filters.status === "live") {
      return "I could not find any live matches right now.";
    }

    if (parsedQuery.filters.datePreset === "today") {
      return "I could not find any stored matches for today.";
    }

    if (parsedQuery.filters.datePreset === "this_week") {
      return "I could not find any stored matches for this week.";
    }

    return "I could not find any stored matches for that question.";
  }

  if (parsedQuery.filters.matchTeam && parsedQuery.filters.opponentTeam) {
    const match = matches[0];
    return `${match.team1} vs ${match.team2} is ${match.status === "live" ? "live right now" : "scheduled for"} ${formatMatchDate(match.scheduledAt)} in ${match.eventTitle}${match.eventSeries ? ` (${match.eventSeries})` : ""}.`;
  }

  if (parsedQuery.filters.matchTeam && parsedQuery.filters.datePreset === "next") {
    const match = matches[0];
    const opponent =
      match.team1?.toLowerCase().includes(parsedQuery.filters.matchTeam.toLowerCase())
        ? match.team2
        : match.team1;
    return `${parsedQuery.filters.matchTeam}'s next match is against ${opponent} on ${formatMatchDate(match.scheduledAt)} in ${match.eventTitle}${match.eventSeries ? ` (${match.eventSeries})` : ""}.`;
  }

  if (parsedQuery.filters.status === "live") {
    const summary = matches
      .slice(0, 3)
      .map((match) => `${match.team1} vs ${match.team2}`)
      .join("; ");
    return `There ${matches.length === 1 ? "is" : "are"} ${matches.length} live ${matches.length === 1 ? "match" : "matches"} right now: ${summary}.`;
  }

  if (parsedQuery.filters.datePreset === "today") {
    const summary = matches
      .slice(0, 4)
      .map((match) => `${match.team1} vs ${match.team2} at ${formatMatchDate(match.scheduledAt)}`)
      .join("; ");
    return `I found ${matches.length} matches happening today. ${summary}.`;
  }

  if (parsedQuery.filters.datePreset === "this_week") {
    const summary = matches
      .slice(0, 4)
      .map((match) => `${match.team1} vs ${match.team2} on ${formatMatchDate(match.scheduledAt)}`)
      .join("; ");
    return `I found ${matches.length} matches scheduled this week. ${summary}.`;
  }

  if (/\b(upcoming|coming up)\b/i.test(question) || /\bwhat matches\b/i.test(question)) {
    const summary = matches
      .slice(0, 4)
      .map((match) => `${match.team1} vs ${match.team2} on ${formatMatchDate(match.scheduledAt)}`)
      .join("; ");
    return `Here are the next upcoming Valorant matches I found: ${summary}.`;
  }

  const match = matches[0];
  return `${match.team1} vs ${match.team2} is ${match.status === "live" ? "live right now" : "scheduled for"} ${formatMatchDate(match.scheduledAt)} in ${match.eventTitle}${match.eventSeries ? ` (${match.eventSeries})` : ""}.`;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A question string is required." },
        { status: 400 }
      );
    }

    const plannedQuery = await planQuestion(question);
    const regexParsedQuery = parseQuery(question);
    const parsedQuery = plannedQuery
      ? mergeParsedQuery(buildParsedQueryFromPlan(plannedQuery, question), regexParsedQuery)
      : regexParsedQuery;

    const retrievedStats = await retrieveStats(parsedQuery);
    const matchAnswer =
      parsedQuery.entity === "match"
        ? buildMatchAnswer(question, parsedQuery, retrievedStats.contextData.matches ?? [])
        : null;

    const answer = matchAnswer
      ? matchAnswer
      : await generateAnswerFromContext({
          question,
          parsedQuery,
          retrievedStats,
        });

    // If no real data was found, don't show supporting data table
    const hasRealData = retrievedStats.rows.length > 0 || retrievedStats.contextData?.matches?.length;
    const supportingDataToReturn = hasRealData ? retrievedStats.rows : [];

    return NextResponse.json(
      formatAnswer({
        answer,
        parsedQuery,
        supportingData: supportingDataToReturn,
        retrievalMeta: retrievedStats.retrievalMeta,
        contextData: retrievedStats.contextData,
      })
    );
  } catch (error: any) {
    console.error("OpenAI API Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch OpenAI response" },
      { status: 500 }
    );
  }
}
