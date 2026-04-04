import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { syncTournamentMatchStorage } from "@/lib/vlr-storage/sync";

const EVENTS_STALE_MINUTES = 60;

function isStale(lastSyncedAt: string | null | undefined, staleMinutes: number) {
  if (!lastSyncedAt) {
    return true;
  }

  const lastSyncedMs = new Date(lastSyncedAt).getTime();

  if (Number.isNaN(lastSyncedMs)) {
    return true;
  }

  return Date.now() - lastSyncedMs > staleMinutes * 60 * 1000;
}

function normalizeEventStatus(status: string | null | undefined) {
  if (!status) {
    return "upcoming";
  }

  const lowerStatus = status.toLowerCase().trim();

  if (
    lowerStatus === "ongoing" ||
    lowerStatus === "live" ||
    lowerStatus === "in_progress" ||
    lowerStatus === "in-progress"
  ) {
    return "ongoing";
  }

  if (lowerStatus === "completed" || lowerStatus === "finished") {
    return "finished";
  }

  if (lowerStatus === "upcoming" || lowerStatus === "scheduled") {
    return "upcoming";
  }

  return "upcoming";
}

function getStatusPriority(status: string) {
  switch (status) {
    case "ongoing":
      return 0;
    case "upcoming":
      return 1;
    case "finished":
      return 2;
    default:
      return 3;
  }
}

function refreshEventsInBackground() {
  void syncTournamentMatchStorage({
    syncEvents: true,
    syncMatches: true,
    syncEventPlayerStats: false,
    syncMatchDetails: false,
  }).catch((error) => {
    console.error("Background events sync failed:", error);
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const status = req.nextUrl.searchParams.get("status");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
    const backgroundSyncEnabled =
      req.nextUrl.searchParams.get("backgroundSync") !== "0";

    const { data: freshnessRow, error: freshnessError } = await supabase
      .from("events")
      .select("last_synced_at")
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (freshnessError) {
      throw freshnessError;
    }

    if (
      backgroundSyncEnabled &&
      (forceRefresh || isStale(freshnessRow?.last_synced_at, EVENTS_STALE_MINUTES))
    ) {
      refreshEventsInBackground();
    }

    let query = supabase
      .from("events")
      .select(
        "id, vlr_event_id, title, tier, status, region, dates, prize, thumb, event_url, last_synced_at"
      )
      .order("title", { ascending: true })
      .limit(Number.isFinite(limit) ? limit : 100);

    if (status) {
      const normalizedStatus = status === "finished" ? "completed" : status;
      query = query.eq("status", normalizedStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const segments = (data ?? [])
      .map((row) => ({
        id: row.id,
        vlr_event_id: row.vlr_event_id,
        title: row.title,
        tier: row.tier,
        status: normalizeEventStatus(row.status),
        region: row.region,
        dates: row.dates,
        prize: row.prize,
        thumb: row.thumb,
        url_path: row.event_url,
        last_synced_at: row.last_synced_at,
      }))
      .sort((a, b) => {
        const tierPriorityA = a.tier === 1 ? 0 : 1;
        const tierPriorityB = b.tier === 1 ? 0 : 1;
        const tierDiff = tierPriorityA - tierPriorityB;

        if (tierDiff !== 0) {
          return tierDiff;
        }

        const statusPriorityDiff =
          getStatusPriority(a.status) - getStatusPriority(b.status);

        if (statusPriorityDiff !== 0) {
          return statusPriorityDiff;
        }

        return a.title.localeCompare(b.title);
      });

    return NextResponse.json({ data: { segments } });
  } catch (error) {
    console.error("Failed to read stored events:", error);
    return NextResponse.json(
      { error: "Failed to read stored events." },
      { status: 500 }
    );
  }
}
