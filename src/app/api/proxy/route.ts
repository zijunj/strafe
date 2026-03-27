// app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.VLR_API_BASE_URL!;

function normalizeStatsEndpoint(endpoint: string): string {
  const parsedUrl = new URL(endpoint, "https://vlr-proxy.local");
  const normalizedPath = parsedUrl.pathname.replace(/^\/+/, "");

  if (normalizedPath === "stats" && !parsedUrl.searchParams.has("event_group_id")) {
    parsedUrl.searchParams.set("event_group_id", "all");
  }

  return `${parsedUrl.pathname}${parsedUrl.search}`;
}

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing endpoint parameter" },
      { status: 400 }
    );
  }

  const normalizedEndpoint = normalizeStatsEndpoint(
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  );

  const targetUrl = `${BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        {
          error: "Upstream returned non-JSON",
          endpoint: normalizedEndpoint,
          status: response.status,
          body: text,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Proxy fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch from external API" },
      { status: 500 }
    );
  }
}
