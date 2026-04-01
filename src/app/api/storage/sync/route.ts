import { NextRequest, NextResponse } from "next/server";
import { syncTournamentMatchStorage } from "@/lib/vlr-storage/sync";
import { isAuthorizedSyncRequest } from "@/lib/server/syncAuth";

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedSyncRequest(req)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

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
    const matchDetailsLimit =
      typeof body.matchDetailsLimit === "number" &&
      Number.isFinite(body.matchDetailsLimit) &&
      body.matchDetailsLimit > 0
        ? Math.floor(body.matchDetailsLimit)
        : undefined;
    const syncEvents =
      typeof body.syncEvents === "boolean" ? body.syncEvents : true;
    const syncMatches =
      typeof body.syncMatches === "boolean" ? body.syncMatches : true;
    const syncEventPlayerStats =
      typeof body.syncEventPlayerStats === "boolean"
        ? body.syncEventPlayerStats
        : false;
    const syncMatchDetails =
      typeof body.syncMatchDetails === "boolean"
        ? body.syncMatchDetails
        : false;

    const result = await syncTournamentMatchStorage({
      eventIds,
      matchIds,
      matchDetailsLimit,
      includeCompletedEvents: Boolean(body.includeCompletedEvents),
      syncEvents,
      syncMatches,
      syncEventPlayerStats,
      syncMatchDetails,
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
