import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { syncTournamentMatchStorage } from "@/lib/vlr-storage/sync";

const MATCHES_STALE_MINUTES = 15;

interface StoredMatchDetailsPayload {
  teams?: Array<{
    logo?: string | null;
  }>;
}

interface StoredMatchDetailsRow {
  payload?: StoredMatchDetailsPayload | null;
}

interface StoredEventRow {
  thumb?: string | null;
  region?: string | null;
}

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

function refreshMatchesInBackground(syncMatchDetails: boolean) {
  void syncTournamentMatchStorage({
    syncEvents: true,
    syncMatches: true,
    syncEventPlayerStats: false,
    syncMatchDetails,
  }).catch((error) => {
    console.error("Background matches sync failed:", error);
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const eventId = req.nextUrl.searchParams.get("eventId");
    const vlrEventId = req.nextUrl.searchParams.get("vlrEventId");
    const status = req.nextUrl.searchParams.get("status");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";
    const backgroundSyncEnabled =
      req.nextUrl.searchParams.get("backgroundSync") !== "0";
    const syncDetailsInBackground =
      req.nextUrl.searchParams.get("syncDetails") === "1";

    const { data: freshnessRow, error: freshnessError } = await supabase
      .from("matches")
      .select("last_synced_at")
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (freshnessError) {
      throw freshnessError;
    }

    if (
      backgroundSyncEnabled &&
      (forceRefresh || isStale(freshnessRow?.last_synced_at, MATCHES_STALE_MINUTES))
    ) {
      refreshMatchesInBackground(syncDetailsInBackground);
    }

    let query = supabase
      .from("matches")
      .select(
        "id, vlr_match_id, event_id, event_title, event_series, team_1_name, team_2_name, team_1_score, team_2_score, scheduled_at, date_label, match_url, status, last_synced_at, events(thumb, region), match_details(payload)"
      )
      .limit(Number.isFinite(limit) ? limit : 100);

    if (eventId) {
      query = query.eq("event_id", Number(eventId));
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (status === "completed") {
      query = query.order("last_synced_at", {
        ascending: false,
        nullsFirst: false,
      });
    } else {
      query = query.order("scheduled_at", {
        ascending: true,
        nullsFirst: false,
      });
    }

    if (vlrEventId) {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("vlr_event_id", Number(vlrEventId))
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      if (!eventRow) {
        return NextResponse.json({ data: [] });
      }

      query = query.eq("event_id", eventRow.id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    function getNestedMatchDetails(row: {
      match_details?: StoredMatchDetailsRow[] | StoredMatchDetailsRow | null;
    }) {
      return Array.isArray(row.match_details)
        ? row.match_details[0]
        : row.match_details;
    }

    function getNestedEvent(row: {
      events?: StoredEventRow[] | StoredEventRow | null;
    }) {
      return Array.isArray(row.events) ? row.events[0] : row.events;
    }

    const segments = (data ?? []).map((row) => {
      const matchDetails = getNestedMatchDetails(row);
      const event = getNestedEvent(row);
      const teams = matchDetails?.payload?.teams ?? [];

      return {
        id: row.id,
        vlr_match_id: row.vlr_match_id,
        event_id: row.event_id,
        match_event: row.event_title,
        match_series: row.event_series,
        team1: row.team_1_name,
        team2: row.team_2_name,
        team1_logo: teams[0]?.logo || null,
        team2_logo: teams[1]?.logo || null,
        tournament_logo: event?.thumb || null,
        region: event?.region || null,
        score1: row.team_1_score,
        score2: row.team_2_score,
        unix_timestamp: row.scheduled_at,
        date_label: row.date_label,
        match_page: row.match_url,
        status: row.status,
        last_synced_at: row.last_synced_at,
      };
    });

    return NextResponse.json({ data: { segments } });
  } catch (error) {
    console.error("Failed to read stored matches:", error);
    return NextResponse.json(
      { error: "Failed to read stored matches." },
      { status: 500 }
    );
  }
}
