import { NextRequest, NextResponse } from "next/server";
import { syncAggregatedStats } from "@/lib/ai/syncAggregatedStats";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

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
