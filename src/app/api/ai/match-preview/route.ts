import { NextRequest, NextResponse } from "next/server";
import { runMatchPreviewAgent } from "@/lib/ai/matchPreview/agent";

interface MatchPreviewRequestBody {
  matchId?: number;
  team1?: string | null;
  team2?: string | null;
  eventTitle?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MatchPreviewRequestBody;
    const matchId =
      typeof body.matchId === "number" && Number.isInteger(body.matchId)
        ? body.matchId
        : null;

    if (!matchId || matchId <= 0) {
      return NextResponse.json(
        { error: "A valid numeric matchId is required." },
        { status: 400 }
      );
    }

    const result = await runMatchPreviewAgent({
      matchId,
      team1: body.team1 ?? null,
      team2: body.team2 ?? null,
      eventTitle: body.eventTitle ?? null,
    });

    return NextResponse.json({
      answer: result.answer,
      source: result.source,
      debug: process.env.NODE_ENV === "production" ? undefined : result.debug,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate the match preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
