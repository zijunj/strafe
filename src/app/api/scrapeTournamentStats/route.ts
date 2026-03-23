import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

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

    const url = `https://www.vlr.gg/event/stats/${eventId}/`;

    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(res.data);
    const results: any[] = [];

    $("table.wf-table.mod-stats.mod-scroll tbody tr").each((_, el) => {
      const $el = $(el);

      // 🧑‍💻 Player name (clean + split)
      const rawText = $el.find("td.mod-player").text().replace(/\s+/g, " ").trim();

      // Split into name + org (last word = org)
      const parts = rawText.split(" ");
      const org = parts.length > 1 ? parts.pop() : "";
      const player = parts.join(" ");

      // 🔫 Agents
      const agents = $el
        .find("td.mod-agents img")
        .map(
          (_, img) =>
            $(img)
              .attr("src")
              ?.split("/")
              .pop()
              ?.split(".")[0]
        )
        .get();

      // 📊 Stats cells
      const stats = $el
        .find("td.mod-color-sq")
        .map((_, td) => $(td).text().trim())
        .get();

      // 🕐 Rounds played
      const rounds = $el.find("td.mod-rnd").text().trim();

      results.push({
        player: player || null,
        org: org || null,
        agents,
        rounds_played: rounds || null,
        rating: stats[0] || null,
        average_combat_score: stats[1] || null,
        kill_deaths: stats[2] || null,
        kill_assists_survived_traded: stats[3] || null,
        average_damage_per_round: stats[4] || null,
        kills_per_round: stats[5] || null,
        assists_per_round: stats[6] || null,
        first_kills_per_round: stats[7] || null,
        first_deaths_per_round: stats[8] || null,
        headshot_percentage: stats[9] || null,
        clutch_success_percentage: stats[10] || null,
      });
    });

    return NextResponse.json({
      data: { status: 200, segments: results },
    });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json(
      { error: "Failed to scrape event stats" },
      { status: 500 }
    );
  }
}
