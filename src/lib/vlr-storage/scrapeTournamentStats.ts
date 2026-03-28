import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedTournamentPlayerStat {
  player_name: string | null;
  team_name: string | null;
  agents: string[];
  rounds_played: string | null;
  rating: string | null;
  average_combat_score: string | null;
  kill_deaths: string | null;
  kill_assists_survived_traded: string | null;
  average_damage_per_round: string | null;
  kills_per_round: string | null;
  assists_per_round: string | null;
  first_kills_per_round: string | null;
  first_deaths_per_round: string | null;
  headshot_percentage: string | null;
  clutch_success_percentage: string | null;
}

export async function scrapeTournamentStatsByEventId(
  eventId: number | string
): Promise<ScrapedTournamentPlayerStat[]> {
  const url = `https://www.vlr.gg/event/stats/${eventId}/`;
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(res.data);
  const results: ScrapedTournamentPlayerStat[] = [];

  $("table.wf-table.mod-stats.mod-scroll tbody tr").each((_, el) => {
    const $el = $(el);
    const rawText = $el.find("td.mod-player").text().replace(/\s+/g, " ").trim();
    const parts = rawText.split(" ");
    const team_name = parts.length > 1 ? parts.pop() ?? null : null;
    const player_name = parts.join(" ") || null;

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
      .get()
      .filter((agent): agent is string => Boolean(agent));

    const stats = $el
      .find("td.mod-color-sq")
      .map((_, td) => $(td).text().trim())
      .get();

    const rounds = $el.find("td.mod-rnd").text().trim();

    results.push({
      player_name,
      team_name,
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

  return results;
}
