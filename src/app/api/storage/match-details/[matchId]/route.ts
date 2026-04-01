import { NextResponse } from "next/server";
import {
  readStoredMatchDetailsByVlrMatchId,
  syncStoredMatchDetailByVlrMatchId,
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
      const existingMatch = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);

      if (existingMatch) {
        const synced = await syncStoredMatchDetailByVlrMatchId(vlrMatchId);

        if (!synced) {
          return NextResponse.json(
            {
              error:
                "Failed to sync stored match details from the upstream match detail API.",
            },
            { status: 502 }
          );
        }
      } else {
        await syncTournamentMatchStorage({
          matchIds: [vlrMatchId],
          syncEvents: true,
          syncMatches: true,
          syncEventPlayerStats: false,
          syncMatchDetails: true,
        });
      }
    }

    const data = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);
    const nestedMatchDetails =
      data?.match_details && Array.isArray(data.match_details)
        ? data.match_details[0]
        : data?.match_details;

    if (!data) {
      return NextResponse.json(
        { error: "Stored match details not found." },
        { status: 404 }
      );
    }

    if (shouldSync && !nestedMatchDetails) {
      return NextResponse.json(
        {
          error:
            "Match row exists, but match_details was not written after sync.",
        },
        { status: 502 }
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
