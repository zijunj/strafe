import { NextResponse } from "next/server";
import {
  readStoredMatchDetailsByVlrMatchId,
  syncTournamentMatchStorage,
} from "@/lib/vlr-storage/sync";

export async function GET(
  req: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;
    const vlrMatchId = Number(matchId);

    if (!Number.isFinite(vlrMatchId)) {
      return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
    }

    const url = new URL(req.url);
    const shouldSync = url.searchParams.get("sync") === "1";

    if (shouldSync) {
      await syncTournamentMatchStorage({ matchIds: [vlrMatchId] });
    }

    const data = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);

    if (!data) {
      return NextResponse.json(
        { error: "Stored match details not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to read stored match details:", error);
    return NextResponse.json(
      { error: "Failed to read stored match details." },
      { status: 500 }
    );
  }
}
