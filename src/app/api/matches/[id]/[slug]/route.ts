import { NextResponse } from "next/server";
import { supabase } from "@/app/supabaseClient";
import { scrapeMatch } from "@/app/utils/scraperMatch";

const STALE_THRESHOLD_MINUTES = 15;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; slug: string }> }
) {
  try {
    const { id, slug } = await context.params;

    // Ensure numeric id
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid match id" }, { status: 400 });
    }

    // 1. Check Supabase
    const { data: match, error } = await supabase
      .from("matches")
      .select("*")
      .eq("id", numericId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("DB error:", error.message);
    }

    // 2. If found + fresh → return cached
    if (match) {
      const lastUpdated = new Date(match.inserted_at);
      const now = new Date();
      const diffMins = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

      if (diffMins < STALE_THRESHOLD_MINUTES) {
        return NextResponse.json({ source: "cache", data: match });
      }
    }

    // 3. Otherwise scrape fresh
    const url = `https://www.vlr.gg/${id}/${slug}`;
    const scraped = await scrapeMatch(url);

    const { head_to_head, ...matchData } = scraped;


    // 4. Upsert into Supabase
    const { error: upsertError } = await supabase
      .from("matches")
      .upsert(
        {
          vlr_id: id, // ✅ store numeric VLR ID here
          slug,
          ...matchData,
          inserted_at: new Date().toISOString(),
        },
        { onConflict: "vlr_id" } // ✅ not "id"
      );

    if (scraped.head_to_head) {
    const h2hRows = scraped.head_to_head.map(m => ({
      match_vlr_id: id,
      event_name: m.event_name,
      event_series: m.event_series,
      event_logo: m.event_logo,
      team1_score: m.team1_score,
      team2_score: m.team2_score,
      team1_win: m.team1_win,
      team2_win: m.team2_win,
      date: m.date,
      url: m.url,
    }));

   // clear old rows for this match before inserting new ones
  await supabase.from("match_h2h").delete().eq("match_vlr_id", id);

  await supabase.from("match_h2h").insert(h2hRows);
    }


    if (upsertError) {
      console.error("DB upsert error:", upsertError.message);
      return NextResponse.json(
        { error: "Failed to update database", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ source: "scraper", data: scraped });
  } catch (err: any) {
    console.error("Internal error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
