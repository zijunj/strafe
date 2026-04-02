import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { formatAnswer } from "@/lib/ai/formatAnswer";
import { parseQuery } from "@/lib/ai/parseQuery";
import { retrieveStats } from "@/lib/ai/retrieveStats";

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

  if (/\bupcoming\b/i.test(question)) {
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

    const parsedQuery = parseQuery(question);
    const retrievedStats = await retrieveStats(parsedQuery);
    const matchAnswer =
      parsedQuery.entity === "match"
        ? buildMatchAnswer(question, parsedQuery, retrievedStats.contextData.matches ?? [])
        : null;

    const systemPrompt = `
You are a Valorant stats assistant modeled after a clean stats-search experience.
Answer only from the supplied structured data.
If the answer is not fully supported, say so clearly.
Keep the answer concise, confident, and useful.
`;

    const userPrompt = `
Question:
${question}

Parsed query:
${JSON.stringify(parsedQuery, null, 2)}

Retrieved context:
${JSON.stringify(retrievedStats.contextData, null, 2)}

Retrieved data:
${JSON.stringify(retrievedStats.rows, null, 2)}
`;

    const answer = matchAnswer
      ? matchAnswer
      : (
          await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o-mini",
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
          )
        ).data?.choices?.[0]?.message?.content ??
        "I could not generate an answer for that question.";

    return NextResponse.json(
      formatAnswer({
        answer,
        parsedQuery,
        supportingData: retrievedStats.rows,
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
