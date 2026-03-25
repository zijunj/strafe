import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { formatAnswer } from "@/lib/ai/formatAnswer";
import { parseQuery } from "@/lib/ai/parseQuery";
import { retrieveStats } from "@/lib/ai/retrieveStats";

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

Retrieved data:
${JSON.stringify(retrievedStats.rows, null, 2)}
`;

    const response = await axios.post(
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
    );

    const answer =
      response.data?.choices?.[0]?.message?.content ??
      "I could not generate an answer for that question.";

    return NextResponse.json(
      formatAnswer({
        answer,
        parsedQuery,
        supportingData: retrievedStats.rows,
        retrievalMeta: retrievedStats.retrievalMeta,
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
