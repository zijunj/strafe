// lib/utils/scraper.ts
import * as cheerio from "cheerio";

export interface ScrapedMatch {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  unix_timestamp: string;
  local_time: string;
  time_until_match: string;
  head_to_head: H2HMatch[]; // ✅ new field
}

export interface H2HMatch {
  event_name: string;
  event_series: string;
  event_logo: string;
  team1_score: string;
  team2_score: string;
  team1_win: boolean;
  team2_win: boolean;
  date: string;
  url: string;
}

export async function scrapeMatch(url: string): Promise<ScrapedMatch> {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const match_event = $(".match-header-event div:first-child").text().trim();
  const match_series = $(".match-header-event-series").text().trim();

  const unix_timestamp =
    $(".match-header-date .moment-tz-convert").first().attr("data-utc-ts") || "";

  const local_time = $(".match-header-date .moment-tz-convert").eq(1).text().trim();
  const time_until_match = $(".match-header-vs-note.mod-upcoming").text().trim();

  const team1 = $(".match-header-link.mod-1 .wf-title-med").text().trim();
  const team2 = $(".match-header-link.mod-2 .wf-title-med").text().trim();

  const team1_logo = $(".match-header-link.mod-1 img").attr("src") || "";
  const team2_logo = $(".match-header-link.mod-2 img").attr("src") || "";

  // ✅ Scrape Head-to-Head Section
  const head_to_head: H2HMatch[] = [];
  $(".match-h2h-matches .mod-h2h").each((_, el) => {
    const event_logo =
      $(el).find(".match-h2h-matches-event img").attr("src") || "";

    const event_name = $(el)
      .find(".match-h2h-matches-event-name")
      .text()
      .trim();
    const event_series = $(el)
      .find(".match-h2h-matches-event-series")
      .text()
      .trim();

    const team1_score = $(el).find(".match-h2h-matches-score .rf").text().trim();
    const team2_score = $(el).find(".match-h2h-matches-score .ra").text().trim();

    // Grab both team elements
const teams = $(el).find(".match-h2h-matches-team");

// Check if the first logo has mod-win (team1) and if the second has mod-win (team2)
const team1_win = $(teams[0]).hasClass("mod-win");
const team2_win = $(teams[1]).hasClass("mod-win");

    const date = $(el).find(".match-h2h-matches-date").text().trim();
    const url = "https://www.vlr.gg" + ($(el).attr("href") || "");

    head_to_head.push({
      event_name,
      event_series,
      event_logo: event_logo.startsWith("//") ? `https:${event_logo}` : event_logo,
      team1_score,
      team2_score,
      team1_win,
      team2_win,
      date,
      url,
    });
  });

  return {
    match_event,
    match_series,
    team1,
    team2,
    team1_logo: team1_logo.startsWith("//") ? `https:${team1_logo}` : team1_logo,
    team2_logo: team2_logo.startsWith("//") ? `https:${team2_logo}` : team2_logo,
    unix_timestamp,
    local_time,
    time_until_match,
    head_to_head, // ✅ now included
  };
}
