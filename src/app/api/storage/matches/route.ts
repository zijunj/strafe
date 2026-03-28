import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { syncTournamentMatchStorage } from "@/lib/vlr-storage/sync";

const MATCHES_STALE_MINUTES = 15;

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

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const eventId = req.nextUrl.searchParams.get("eventId");
    const vlrEventId = req.nextUrl.searchParams.get("vlrEventId");
    const status = req.nextUrl.searchParams.get("status");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

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
      forceRefresh ||
      isStale(freshnessRow?.last_synced_at, MATCHES_STALE_MINUTES)
    ) {
      await syncTournamentMatchStorage({
        syncEvents: true,
        syncMatches: true,
        syncEventPlayerStats: false,
        syncMatchDetails: false,
      });
    }

    let query = supabase
      .from("matches")
      .select(
        "id, vlr_match_id, event_id, event_title, event_series, team_1_name, team_2_name, team_1_score, team_2_score, scheduled_at, date_label, match_url, status, last_synced_at"
      )
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(Number.isFinite(limit) ? limit : 100);

    if (eventId) {
      query = query.eq("event_id", Number(eventId));
    }

    if (status) {
      query = query.eq("status", status);
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

    const segments = (data ?? []).map((row) => ({
      id: row.id,
      vlr_match_id: row.vlr_match_id,
      event_id: row.event_id,
      match_event: row.event_title,
      match_series: row.event_series,
      team1: row.team_1_name,
      team2: row.team_2_name,
      score1: row.team_1_score,
      score2: row.team_2_score,
      unix_timestamp: row.scheduled_at,
      date_label: row.date_label,
      match_page: row.match_url,
      status: row.status,
      last_synced_at: row.last_synced_at,
    }));

    return NextResponse.json({ data: { segments } });
  } catch (error) {
    console.error("Failed to read stored matches:", error);
    return NextResponse.json(
      { error: "Failed to read stored matches." },
      { status: 500 }
    );
  }
}
