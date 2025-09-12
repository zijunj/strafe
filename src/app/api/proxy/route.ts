// /app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  const targetUrl = `https://vlrggapi.vercel.app/${endpoint}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy fetch error:", err);
    return NextResponse.json({ error: 'Failed to fetch from external API' }, { status: 500 });
  }
}
