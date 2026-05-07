/**
 * @jest-environment node
 */

import { POST } from "./route";

const mockRunMatchPreviewAgent = jest.fn();

jest.mock("@/lib/ai/matchPreview/agent", () => ({
  runMatchPreviewAgent: (...args: unknown[]) => mockRunMatchPreviewAgent(...args),
}));

describe("POST /api/ai/match-preview", () => {
  beforeEach(() => {
    mockRunMatchPreviewAgent.mockReset();
  });

  it("validates that a numeric matchId is provided", async () => {
    const request = new Request("http://localhost/api/ai/match-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team1: "Sentinels" }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("A valid numeric matchId is required.");
    expect(mockRunMatchPreviewAgent).not.toHaveBeenCalled();
  });

  it("returns the generated preview for a valid matchId", async () => {
    mockRunMatchPreviewAgent.mockResolvedValue({
      answer: "Sentinels and G2 meet in the Upper Final with zekken in strong recent form.",
      source: "agent",
      debug: {
        matchContext: { matchId: 12345 },
      },
    });

    const request = new Request("http://localhost/api/ai/match-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId: 12345,
        team1: "Sentinels",
        team2: "G2 Esports",
        eventTitle: "VCT 2026: Americas Stage 1",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockRunMatchPreviewAgent).toHaveBeenCalledWith({
      matchId: 12345,
      team1: "Sentinels",
      team2: "G2 Esports",
      eventTitle: "VCT 2026: Americas Stage 1",
    });
    expect(payload.answer).toContain("Sentinels and G2 meet");
    expect(payload.source).toBe("agent");
  });
});
