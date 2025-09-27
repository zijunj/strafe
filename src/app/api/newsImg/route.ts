import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const res = await axios.get("https://www.vlr.gg/");
    const $ = cheerio.load(res.data);

    const articles = $(".wf-card.news-feature")
      .map((_, el) => {
        const relativeUrl = $(el).attr("href");
        const imgSrc = $(el).find("img").attr("src");
        const title = $(el)
          .find(".news-feature-caption .wf-spoiler-visible")
          .text()
          .trim();

        return {
          url: relativeUrl ? `https://www.vlr.gg${relativeUrl}` : null,
          img: imgSrc ? (imgSrc.startsWith("//") ? `https:${imgSrc}` : imgSrc) : null,
          title: title || null,
        };
      })
      .get();

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json(
      { error: "Failed to scrape news" },
      { status: 500 }
    );
  }
}
