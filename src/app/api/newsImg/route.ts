import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isAuthorizedSyncRequest } from "@/lib/server/syncAuth";
import crypto from "node:crypto";

const FEATURED_NEWS_CACHE_KEY = "vlr-homepage-featured";
const NEWS_CACHE_KEY = "vlr-news-list";
const NEWS_FEATURED_STALE_HOURS = 6;
const REMOTE_ASSET_BUCKET =
  process.env.SUPABASE_REMOTE_ASSET_BUCKET || "remote-assets";

type FeaturedArticle = {
  url: string | null;
  img: string | null;
  title: string | null;
  description: string | null;
};

type NewsListArticle = {
  title: string;
  description: string;
  url_path: string;
};

function normalizeVlrUrl(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  return `https://www.vlr.gg${value.startsWith("/") ? value : `/${value}`}`;
}

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

function sanitizeStorageKeyPart(value: string | null | undefined) {
  return (value || "news-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "news-image";
}

function getImageFileExtension(
  remoteUrl: string,
  contentType?: string | null
) {
  const normalizedContentType = contentType?.toLowerCase() || "";

  if (normalizedContentType.includes("svg")) return "svg";
  if (normalizedContentType.includes("png")) return "png";
  if (normalizedContentType.includes("jpeg") || normalizedContentType.includes("jpg")) {
    return "jpg";
  }
  if (normalizedContentType.includes("webp")) return "webp";
  if (normalizedContentType.includes("gif")) return "gif";

  try {
    const pathname = new URL(remoteUrl).pathname.toLowerCase();
    if (pathname.endsWith(".svg")) return "svg";
    if (pathname.endsWith(".png")) return "png";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "jpg";
    if (pathname.endsWith(".webp")) return "webp";
    if (pathname.endsWith(".gif")) return "gif";
  } catch {
    return "png";
  }

  return "png";
}

function isSupabaseStorageUrl(url: string) {
  return url.includes("/storage/v1/object/");
}

async function cacheFeaturedImage(
  remoteUrl: string | null | undefined,
  keyHint: string
) {
  const normalizedUrl = remoteUrl?.trim();

  if (!normalizedUrl) {
    return null;
  }

  if (
    normalizedUrl.startsWith("/") ||
    normalizedUrl.startsWith("data:") ||
    isSupabaseStorageUrl(normalizedUrl)
  ) {
    return normalizedUrl;
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const response = await fetch(normalizedUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(
        `Featured news image fetch failed (${response.status}) for ${normalizedUrl}`
      );
      return normalizedUrl;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return normalizedUrl;
    }

    const hash = crypto
      .createHash("sha1")
      .update(normalizedUrl)
      .digest("hex")
      .slice(0, 16);
    const ext = getImageFileExtension(
      normalizedUrl,
      response.headers.get("content-type")
    );
    const path = `news/${sanitizeStorageKeyPart(keyHint)}-${hash}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(REMOTE_ASSET_BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: response.headers.get("content-type") || `image/${ext}`,
        upsert: true,
      });

    if (uploadError) {
      console.warn(
        `Failed to cache featured news image ${normalizedUrl}: ${uploadError.message}`
      );
      return normalizedUrl;
    }

    const { data } = supabase.storage
      .from(REMOTE_ASSET_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.warn(`Failed to cache featured news image ${normalizedUrl}:`, error);
    return normalizedUrl;
  }
}

async function cacheFeaturedArticleImages(articles: FeaturedArticle[]) {
  return Promise.all(
    articles.map(async (article) => ({
      ...article,
      img:
        (await cacheFeaturedImage(
          article.img,
          article.title || article.url || "featured-article"
        )) || article.img,
    }))
  );
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

async function readCachedNewsArticles() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("news_articles_cache")
    .select("segments")
    .eq("cache_key", NEWS_CACHE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read news list cache: ${error.message}`);
  }

  return Array.isArray(data?.segments) ? (data.segments as NewsListArticle[]) : [];
}

async function scrapeArticleMetadata(
  url: string,
  fallbackTitle?: string | null,
  fallbackDescription?: string | null,
) {
  const articleRes = await axios.get(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
    timeout: 15000,
  });

  const articlePage = cheerio.load(articleRes.data);
  const img =
    articlePage("meta[property='og:image']").attr("content") ||
    articlePage("meta[name='twitter:image']").attr("content") ||
    null;
  const title =
    articlePage("meta[property='og:title']").attr("content") ||
    fallbackTitle ||
    null;
  const description =
    articlePage("meta[property='og:description']").attr("content") ||
    articlePage("meta[name='description']").attr("content") ||
    fallbackDescription ||
    null;

  return {
    url,
    img: img ? normalizeVlrUrl(img) : null,
    title,
    description,
  };
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

  const homepageFeatured = $(".wf-card.news-feature")
    .map((_, el) => {
      const relativeUrl = $(el).attr("href");
      const imgSrc = $(el).find("img").attr("src");
      const title =
        $(el).find(".news-feature-caption > div").first().text().trim() ||
        $(el).find(".news-feature-caption").text().trim();
      const description = $(el)
        .find(".news-feature-caption")
        .contents()
        .toArray()
        .map((node) => $(node).text().trim())
        .filter(Boolean)
        .filter((text) => text !== title)
        .join(" ")
        .trim();

      return {
        url: relativeUrl ? normalizeVlrUrl(relativeUrl) : null,
        img: imgSrc ? normalizeVlrUrl(imgSrc) : null,
        title: title || null,
        description: description || null,
      };
    })
    .get()
    .filter((article) => article.img && article.title) as FeaturedArticle[];

  if (homepageFeatured.length > 0) {
    return cacheFeaturedArticleImages(homepageFeatured);
  }

  const newsListArticles = await readCachedNewsArticles().catch((error) => {
    console.error(error);
    return [];
  });

  const dedupedCandidates = Array.from(
    new Map(
      newsListArticles
        .map((item) => ({
          url: normalizeVlrUrl(item.url_path),
          title: item.title,
          description: item.description,
        }))
        .filter((item) => item.url && item.title)
        .map((item) => [item.url, item]),
    ).values(),
  ).slice(0, 5);

  const fallbackArticles = await Promise.all(
    dedupedCandidates.map(async (item) => {
      try {
        return await scrapeArticleMetadata(
          item.url,
          item.title,
          item.description,
        );
      } catch (error) {
        console.error(
          `Failed to scrape article metadata for ${item.url}:`,
          error,
        );
        return null;
      }
    }),
  );

  const filteredFallbackArticles = fallbackArticles.filter(
    (
      article,
    ): article is {
      url: string;
      img: string;
      title: string;
      description: string | null;
    } => Boolean(article?.url && article?.img && article?.title),
  );

  return cacheFeaturedArticleImages(filteredFallbackArticles);
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
    const cachedArticles = Array.isArray(cached?.articles)
      ? cached.articles
      : [];
    return NextResponse.json({ articles: cachedArticles, source: "cache" });
  }
}
