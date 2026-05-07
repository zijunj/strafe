import { render, screen, waitFor } from "@testing-library/react";
import MatchPreviewSection from "./MatchPreviewSection";

describe("MatchPreviewSection", () => {
  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  const defaultProps = {
    matchId: 12345,
    team1: "Sentinels",
    team2: "G2 Esports",
    eventTitle: "VCT 2026: Americas Stage 1",
    matchSeries: "Playoffs: Upper Final",
    displayDate: "May 12",
    startTime: "6:00 PM EDT",
    hasFinishedScore: false,
    team1Score: "",
    team2Score: "",
  };

  it("shows a loading state before rendering the AI preview", () => {
    globalThis.fetch = jest.fn(
      () =>
        new Promise(() => {
          return undefined;
        })
    ) as typeof fetch;

    render(<MatchPreviewSection {...defaultProps} />);

    expect(screen.getByText("Generating preview...")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading match preview")).toBeInTheDocument();
  });

  it("renders the generated match preview on success", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer:
          "Sentinels and G2 meet in the Upper Final with zekken and trent arriving in strong recent form.",
        source: "agent",
        debug: {
          matchContext: {
            eventTitle: "VCT 2026: Americas Stage 1",
            eventSeries: "Playoffs: Upper Final",
            displayDate: "May 12",
            startTime: "6:00 PM EDT",
            headToHeadSummary: {
              team1Wins: 1,
              team2Wins: 2,
              draws: 0,
            },
          },
          stakes: {
            isPlayoff: true,
            roundTitle: "Playoffs: Upper Final",
            stakesSummary:
              "This is an upper-bracket final. The winner reaches the Grand Final, while the loser drops into the lower final.",
            winnerPath: "Winner likely advances to Grand Final against G2 Esports.",
            loserPath: "Loser likely drops to Lower Final against LOUD.",
            inferredFromBracket: true,
          },
          team1Form: {
            teamName: "Sentinels",
            timespanDays: 30,
            source: "recent_matches",
            sampleMatchCount: 4,
            topRatedPlayer: {
              player: "zekken",
              rating: 1.16,
              acs: 244,
              kd: 1.18,
              adr: 156,
              roundsPlayed: 430,
            },
            topAcsPlayer: {
              player: "zekken",
              rating: 1.16,
              acs: 244,
              kd: 1.18,
              adr: 156,
              roundsPlayed: 430,
            },
            averageTop3Rating: 1.1,
            averageTop3Acs: 225,
          },
          team2Form: {
            teamName: "G2 Esports",
            timespanDays: 30,
            source: "recent_matches",
            sampleMatchCount: 5,
            topRatedPlayer: {
              player: "trent",
              rating: 1.13,
              acs: 231,
              kd: 1.11,
              adr: 149,
              roundsPlayed: 421,
            },
            topAcsPlayer: {
              player: "trent",
              rating: 1.13,
              acs: 231,
              kd: 1.11,
              adr: 149,
              roundsPlayed: 421,
            },
            averageTop3Rating: 1.08,
            averageTop3Acs: 218,
          },
        },
      }),
    }) as typeof fetch;

    render(<MatchPreviewSection {...defaultProps} />);

    expect(
      await screen.findByText(
        "Sentinels and G2 meet in the Upper Final with zekken and trent arriving in strong recent form."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Generating preview")).not.toBeInTheDocument();
    expect(screen.getByText("Preview Debug")).toBeInTheDocument();
    expect(screen.getByText("agent")).toBeInTheDocument();
    expect(screen.getByText("Summary: This is an upper-bracket final. The winner reaches the Grand Final, while the loser drops into the lower final.")).toBeInTheDocument();
    expect(screen.getByText("Winner path: Winner likely advances to Grand Final against G2 Esports.")).toBeInTheDocument();
    expect(screen.getByText("Source: recent stored matches (4)")).toBeInTheDocument();
    expect(screen.getByText("Source: recent stored matches (5)")).toBeInTheDocument();
    expect(screen.getByText("Top rated: zekken (1.16 rating, 1.18 K/D, 156 ADR)")).toBeInTheDocument();
    expect(screen.getByText("Top rated: trent (1.13 rating, 1.11 K/D, 149 ADR)")).toBeInTheDocument();
  });

  it("falls back to stored match details when the preview request fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("boom")) as typeof fetch;

    render(<MatchPreviewSection {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Preview fallback shown from stored match details while AI data is unavailable\./
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Sentinels vs G2 Esports will be played on May 12 at 6:00 PM EDT\./
      )
    ).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
