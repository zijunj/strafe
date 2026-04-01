import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isAuthorizedSyncRequest } from "@/lib/server/syncAuth";

const FEATURED_NEWS_CACHE_KEY = "vlr-homepage-featured";
const NEWS_FEATURED_STALE_HOURS = 6;

type FeaturedArticle = {
  url: string | null;
  img: string | null;
  title: string | null;
};

function isStale(lastSyncedAt: string | null | undefined, staleHours: number) {
  if (!lastSyncedAt) {
    return true;
  }

  const lastSyncedMs = new Date(lastSyncedAt).getTime();

  if (Number.isNaN(lastSyncedMs)) {
    return true;
  }

  return Date.now() - lastSyncedMs > staleHours * 60 * 60 * 1000;
}

async function readCachedFeaturedArticles() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("news_featured_cache")
    .select("articles, last_synced_at")
    .eq("cache_key", FEATURED_NEWS_CACHE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read featured news cache: ${error.message}`);
  }

  return data as
    | {
        articles: FeaturedArticle[] | null;
        last_synced_at: string | null;
      }
    | null;
}

async function writeCachedFeaturedArticles(articles: FeaturedArticle[]) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("news_featured_cache").upsert(
    {
      cache_key: FEATURED_NEWS_CACHE_KEY,
      articles,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" }
  );

  if (error) {
    throw new Error(`Failed to write featured news cache: ${error.message}`);
  }
}

async function scrapeFeaturedArticles() {
  const res = await axios.get("https://www.vlr.gg/", {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
    timeout: 15000,
  });
  const $ = cheerio.load(res.data);

  return $(".wf-card.news-feature")
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
    .get()
    .filter((article) => article.img && article.title) as FeaturedArticle[];
}

export async function GET(req: NextRequest) {
  try {
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

    if (forceRefresh && !isAuthorizedSyncRequest(req)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const cached = await readCachedFeaturedArticles().catch((error) => {
      console.error(error);
      return null;
    });
    const cachedArticles = Array.isArray(cached?.articles) ? cached.articles : [];

    if (
      !forceRefresh &&
      cachedArticles.length > 0 &&
      !isStale(cached?.last_synced_at, NEWS_FEATURED_STALE_HOURS)
    ) {
      return NextResponse.json({ articles: cachedArticles, source: "cache" });
    }

    const articles = await scrapeFeaturedArticles();

    if (articles.length > 0) {
      await writeCachedFeaturedArticles(articles).catch((error) => {
        console.error(error);
      });
      return NextResponse.json({ articles, source: "scrape" });
    }

    return NextResponse.json({ articles: cachedArticles, source: "cache" });
  } catch (err) {
    console.error("Scrape error:", err);
    const cached = await readCachedFeaturedArticles().catch(() => null);
    const cachedArticles = Array.isArray(cached?.articles) ? cached.articles : [];
    return NextResponse.json({ articles: cachedArticles, source: "cache" });
  }
}
