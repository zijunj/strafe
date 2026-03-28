import { NextRequest, NextResponse } from "next/server";
import { syncAggregatedStats } from "@/lib/ai/syncAggregatedStats";

const SUPPORTED_REGIONS = [
  "ap",
  "br",
  "cn",
  "col",
  "eu",
  "jp",
  "kr",
  "la",
  "la-n",
  "la-s",
  "mn",
  "na",
  "oce",
] as const;

const SUPPORTED_TIMESPANS = [30, 60, 90, "all"] as const;

function isAuthorized(req: NextRequest) {
  const configuredSecret = process.env.AI_SYNC_SECRET;

  if (!configuredSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const syncSecret = req.headers.get("x-sync-secret");

  return bearerToken === configuredSecret || syncSecret === configuredSecret;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const syncAll = body.syncAll === true;

    const rawEventGroupId = body.eventGroupId;
    const numericEventGroupId =
      typeof rawEventGroupId === "string"
        ? Number(rawEventGroupId)
        : rawEventGroupId;

    const eventGroupId =
      rawEventGroupId === null ||
      rawEventGroupId === undefined ||
      rawEventGroupId === "" ||
      rawEventGroupId === "all"
        ? null
        : Number.isInteger(numericEventGroupId)
          ? numericEventGroupId
          : null;

    if (syncAll) {
      const results = [];
      let insertedCount = 0;

      for (const region of SUPPORTED_REGIONS) {
        for (const timespanDays of SUPPORTED_TIMESPANS) {
          const result = await syncAggregatedStats({
            region,
            timespanDays,
            eventGroupId,
          });

          insertedCount += result.insertedCount;
          results.push({
            region,
            timespanDays,
            insertedCount: result.insertedCount,
            sourceUrl: result.sourceUrl,
          });
        }
      }

      return NextResponse.json({
        success: true,
        syncAll: true,
        eventGroupId,
        insertedCount,
        results,
      });
    }

    const region =
      typeof body.region === "string" && body.region.trim()
        ? body.region.trim().toLowerCase()
        : "na";

    const rawTimespan = body.timespanDays;
    const numericTimespan =
      typeof rawTimespan === "string" ? Number(rawTimespan) : rawTimespan;

    const timespanDays =
      rawTimespan === "all" || rawTimespan === 0
        ? "all"
        : numericTimespan === 60 || numericTimespan === 90
          ? numericTimespan
          : 30;

    const result = await syncAggregatedStats({
      region,
      timespanDays,
      eventGroupId,
    });

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      sourceUrl: result.sourceUrl,
      preview: result.rows.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Sync stats error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync aggregated stats.",
      },
      { status: 500 }
    );
  }
}
