import { NextResponse } from "next/server";
import { getTournamentDetailByVlrEventId } from "@/lib/tournaments/detail";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; slug: string }> }
) {
  try {
    const { id } = await context.params;
    const vlrEventId = Number(id);

    if (!Number.isFinite(vlrEventId)) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
    }

    const detail = await getTournamentDetailByVlrEventId(vlrEventId);

    if (!detail) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return NextResponse.json({ data: detail });
  } catch (error) {
    console.error("Tournament detail route failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
