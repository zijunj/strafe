import { NextRequest, NextResponse } from "next/server";
import { syncTournamentMatchStorage } from "@/lib/vlr-storage/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventIds = Array.isArray(body.eventIds)
      ? body.eventIds
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value))
      : undefined;
    const matchIds = Array.isArray(body.matchIds)
      ? body.matchIds
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value))
      : undefined;

    const result = await syncTournamentMatchStorage({
      eventIds,
      matchIds,
      includeCompletedEvents: Boolean(body.includeCompletedEvents),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tournament/match storage sync failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync tournament and match storage.",
      },
      { status: 500 }
    );
  }
}
