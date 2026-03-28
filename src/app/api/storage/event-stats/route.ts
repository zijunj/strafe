import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const eventId = req.nextUrl.searchParams.get("eventId");
    const vlrEventId = req.nextUrl.searchParams.get("vlrEventId");

    let resolvedEventId = eventId ? Number(eventId) : null;

    if (!resolvedEventId && vlrEventId) {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("vlr_event_id", Number(vlrEventId))
        .maybeSingle();

      if (eventError) {
        throw eventError;
      }

      resolvedEventId = eventRow?.id ?? null;
    }

    if (!resolvedEventId) {
      return NextResponse.json(
        { error: "Pass eventId or vlrEventId." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event_player_stats")
      .select("*")
      .eq("event_id", resolvedEventId)
      .order("rating", { ascending: false, nullsFirst: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("Failed to read stored event player stats:", error);
    return NextResponse.json(
      { error: "Failed to read stored event player stats." },
      { status: 500 }
    );
  }
}
