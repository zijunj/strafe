import { NextRequest, NextResponse } from "next/server";
import { syncAggregatedStats } from "@/lib/ai/syncAggregatedStats";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const region =
      typeof body.region === "string" && body.region.trim()
        ? body.region.trim().toLowerCase()
        : "na";

    const timespanDays =
      body.timespanDays === 60 || body.timespanDays === 90
        ? body.timespanDays
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
