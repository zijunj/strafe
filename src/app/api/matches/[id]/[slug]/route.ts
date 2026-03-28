import { NextResponse } from "next/server";
import {
  readStoredMatchDetailsByVlrMatchId,
  syncTournamentMatchStorage,
} from "@/lib/vlr-storage/sync";

const STALE_THRESHOLD_MINUTES = 15;

function isFresh(lastSyncedAt: string | null | undefined) {
  if (!lastSyncedAt) {
    return false;
  }

  const lastSynced = new Date(lastSyncedAt);
  const diffMinutes = (Date.now() - lastSynced.getTime()) / (1000 * 60);

  return diffMinutes < STALE_THRESHOLD_MINUTES;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; slug: string }> }
) {
  try {
    const { id } = await context.params;
    const vlrMatchId = Number(id);

    if (!Number.isFinite(vlrMatchId)) {
      return NextResponse.json({ error: "Invalid match id" }, { status: 400 });
    }

    let storedMatch = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);
    const nestedMatchDetails =
      storedMatch?.match_details && Array.isArray(storedMatch.match_details)
        ? storedMatch.match_details[0]
        : storedMatch?.match_details;
    const nestedLastSyncedAt =
      nestedMatchDetails &&
      typeof nestedMatchDetails === "object" &&
      "last_synced_at" in nestedMatchDetails
        ? String(nestedMatchDetails.last_synced_at ?? "")
        : null;

    if (!storedMatch || !isFresh(nestedLastSyncedAt)) {
      await syncTournamentMatchStorage({ matchIds: [vlrMatchId] });
      storedMatch = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);
    }

    if (!storedMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ source: "storage", data: storedMatch });
  } catch (error) {
    console.error("Match detail storage route failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
