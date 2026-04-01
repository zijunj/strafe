import { NextResponse } from "next/server";
import {
  readStoredMatchDetailsByVlrMatchId,
  syncStoredMatchDetailByVlrMatchId,
  syncTournamentMatchStorage,
} from "@/lib/vlr-storage/sync";

const STALE_THRESHOLD_MINUTES = 15;

interface UpstreamMatchDetailsResponse {
  data?: {
    segments?: Array<{
      match_id?: string;
      date?: string;
      patch?: string;
      status?: string;
      event?: {
        name?: string;
        series?: string;
        logo?: string;
      };
      teams?: Array<{
        name?: string;
        tag?: string;
        logo?: string;
        score?: string;
        is_winner?: boolean;
      }>;
      streams?: Array<{
        name?: string;
        url?: string;
      }>;
      head_to_head?: unknown[];
    }>;
  };
}

function isFresh(lastSyncedAt: string | null | undefined) {
  if (!lastSyncedAt) {
    return false;
  }

  const lastSynced = new Date(lastSyncedAt);
  const diffMinutes = (Date.now() - lastSynced.getTime()) / (1000 * 60);

  return diffMinutes < STALE_THRESHOLD_MINUTES;
}

function getBaseUrl() {
  const baseUrl = process.env.VLR_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("VLR_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

async function fetchUpstreamMatchDetails(vlrMatchId: number) {
  const response = await fetch(
    `${getBaseUrl()}/match/details?match_id=${vlrMatchId}`
  );

  if (!response.ok) {
    throw new Error(
      `Upstream VLR API request failed (${response.status}) for match ${vlrMatchId}`
    );
  }

  const payload = (await response.json()) as UpstreamMatchDetailsResponse;
  return payload.data?.segments?.[0] ?? null;
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
      try {
        if (storedMatch) {
          await syncStoredMatchDetailByVlrMatchId(vlrMatchId);
        } else {
          await syncTournamentMatchStorage({
            matchIds: [vlrMatchId],
            syncEvents: true,
            syncMatches: true,
            syncEventPlayerStats: false,
            syncMatchDetails: true,
          });
        }
        storedMatch = await readStoredMatchDetailsByVlrMatchId(vlrMatchId);
      } catch (syncError) {
        console.warn(
          `Match detail sync failed for ${vlrMatchId}; falling back to upstream detail API.`,
          syncError
        );
      }
    }

    if (!storedMatch) {
      const upstreamMatch = await fetchUpstreamMatchDetails(vlrMatchId);

      if (!upstreamMatch) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      return NextResponse.json({ source: "upstream", data: upstreamMatch });
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
