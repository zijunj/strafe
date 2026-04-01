import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isAuthorizedSyncRequest } from "@/lib/server/syncAuth";

const NEWS_CACHE_KEY = "vlr-news-list";
const NEWS_STALE_MINUTES = 60;

interface UpstreamNewsSegment {
  title: string;
  description: string;
  date: string;
  author: string;
  url_path: string;
}

interface UpstreamNewsResponse {
  data?: {
    segments?: UpstreamNewsSegment[];
  };
}

function getBaseUrl() {
  const baseUrl = process.env.VLR_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("VLR_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function isStale(lastSyncedAt: string | null | undefined, staleMinutes: number) {
  if (!lastSyncedAt) {
    return true;
  }

  const lastSyncedMs = new Date(lastSyncedAt).getTime();

  if (Number.isNaN(lastSyncedMs)) {
    return true;
  }

  return Date.now() - lastSyncedMs > staleMinutes * 60 * 1000;
}

async function readCachedNewsSegments() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("news_articles_cache")
    .select("segments, last_synced_at")
    .eq("cache_key", NEWS_CACHE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read news cache: ${error.message}`);
  }

  return data as
    | {
        segments: UpstreamNewsSegment[] | null;
        last_synced_at: string | null;
      }
    | null;
}

async function writeCachedNewsSegments(segments: UpstreamNewsSegment[]) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("news_articles_cache").upsert(
    {
      cache_key: NEWS_CACHE_KEY,
      segments,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" }
  );

  if (error) {
    throw new Error(`Failed to write news cache: ${error.message}`);
  }
}

async function fetchNewsSegmentsFromUpstream() {
  const response = await fetch(`${getBaseUrl()}/news`, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Upstream news request failed (${response.status})`);
  }

  const payload = (await response.json()) as UpstreamNewsResponse;
  return payload.data?.segments ?? [];
}

export async function GET(req: NextRequest) {
  try {
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1";

    if (forceRefresh && !isAuthorizedSyncRequest(req)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const cached = await readCachedNewsSegments().catch((error) => {
      console.error(error);
      return null;
    });
    const cachedSegments = Array.isArray(cached?.segments) ? cached.segments : [];

    if (
      !forceRefresh &&
      cachedSegments.length > 0 &&
      !isStale(cached?.last_synced_at, NEWS_STALE_MINUTES)
    ) {
      return NextResponse.json({
        data: { segments: cachedSegments },
        source: "cache",
      });
    }

    const segments = await fetchNewsSegmentsFromUpstream();

    if (segments.length > 0) {
      await writeCachedNewsSegments(segments).catch((error) => {
        console.error(error);
      });

      return NextResponse.json({
        data: { segments },
        source: "upstream",
      });
    }

    return NextResponse.json({
      data: { segments: cachedSegments },
      source: "cache",
    });
  } catch (error) {
    console.error("Failed to read stored news:", error);
    const cached = await readCachedNewsSegments().catch(() => null);
    const cachedSegments = Array.isArray(cached?.segments) ? cached.segments : [];

    return NextResponse.json({
      data: { segments: cachedSegments },
      source: "cache",
    });
  }
}
