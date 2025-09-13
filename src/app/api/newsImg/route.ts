import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const res = await axios.get("https://www.vlr.gg/");
    const $ = cheerio.load(res.data);

    const articles = $(".wf-card.news-feature").map((_, el) => {
      const imgSrc = $(el).find("img").attr("src");

      return {
        img: imgSrc ? `https:${imgSrc}` : null,
      };
    }).get();

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: "Failed to scrape news" }, { status: 500 });
  }
}
