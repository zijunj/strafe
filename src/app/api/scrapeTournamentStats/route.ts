import { NextRequest, NextResponse } from "next/server";
import { scrapeTournamentStatsByEventId } from "@/lib/vlr-storage/scrapeTournamentStats";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required 'event_id' query parameter." },
        { status: 400 }
      );
    }

    const scrapedRows = await scrapeTournamentStatsByEventId(eventId);
    const segments = scrapedRows.map((row) => ({
      player: row.player_name,
      org: row.team_name,
      agents: row.agents,
      rounds_played: row.rounds_played,
      rating: row.rating,
      average_combat_score: row.average_combat_score,
      kill_deaths: row.kill_deaths,
      kill_assists_survived_traded: row.kill_assists_survived_traded,
      average_damage_per_round: row.average_damage_per_round,
      kills_per_round: row.kills_per_round,
      assists_per_round: row.assists_per_round,
      first_kills_per_round: row.first_kills_per_round,
      first_deaths_per_round: row.first_deaths_per_round,
      headshot_percentage: row.headshot_percentage,
      clutch_success_percentage: row.clutch_success_percentage,
    }));

    return NextResponse.json({
      data: { status: 200, segments },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape event stats" },
      { status: 500 }
    );
  }
}
