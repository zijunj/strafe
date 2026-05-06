import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIAssistant from "./AIAssistant";

describe("AIAssistant", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  it("renders supporting match rows from context data", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Here are the next upcoming Valorant matches I found.",
        parsedQuery: {
          rawQuestion: "What matches are coming up for VCT 2026?",
          normalizedQuestion: "What matches are coming up for VCT 2026?",
          intent: "match_lookup",
          metric: "general",
          entity: "match",
          sort: "asc",
          limit: 10,
          filters: {
            region: "global",
            timespanDays: 30,
            tier: null,
            eventGroupId: null,
            eventName: null,
            player: null,
            players: [],
            role: null,
            agent: null,
            minRounds: null,
            team: null,
            matchTeam: null,
            opponentTeam: null,
            status: "upcoming",
            datePreset: null,
          },
        },
        supportingData: [],
        retrievalMeta: {
          source: "event_storage",
          appliedRegion: "global",
          appliedTimespanDays: 30,
          appliedEventGroupId: null,
          appliedEventName: "VCT 2026 (4 events)",
          rowCount: 2,
        },
        contextData: {
          event: null,
          matches: [
            {
              vlrMatchId: 645498,
              eventTitle: "VCT 2026: Americas Stage 1",
              eventSeries: "Group Stage: Week 5",
              team1: "KRU Esports",
              team2: "Evil Geniuses",
              score1: null,
              score2: null,
              status: "upcoming",
              scheduledAt: "2026-05-08T21:00:00+00:00",
              dateLabel: null,
              matchUrl: "https://www.vlr.gg/645498",
            },
          ],
        },
        uiHints: {
          intent: "match_lookup",
          title: "Match schedule",
          highlightMetric: "general",
          showSupportingData: false,
          suggestedFollowUps: [],
        },
      }),
    });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<AIAssistant />);

    await userEvent.type(
      screen.getByLabelText("Ask a Valorant stats question"),
      "What matches are coming up for VCT 2026?"
    );
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/openai",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(
      (await screen.findAllByText("VCT 2026: Americas Stage 1")).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("KRU Esports vs Evil Geniuses").length).toBeGreaterThan(0);
  });
});
