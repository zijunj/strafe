import {
  buildDeterministicMatchPreview,
  getMatchContext,
  getRecentTeamMatchForm,
} from "./data";
const mockReadStoredMatchDetailsByVlrMatchId = jest.fn();
const mockGetTournamentDetailByVlrEventId = jest.fn();
const mockMatchRows: Record<"team_1_name" | "team_2_name", any[]> = {
  team_1_name: [],
  team_2_name: [],
};
const mockEventRow = { data: null, error: null };

jest.mock("@/lib/vlr-storage/sync", () => ({
  readStoredMatchDetailsByVlrMatchId: (...args: unknown[]) =>
    mockReadStoredMatchDetailsByVlrMatchId(...args),
}));

jest.mock("@/lib/tournaments/detail", () => ({
  getTournamentDetailByVlrEventId: (...args: unknown[]) =>
    mockGetTournamentDetailByVlrEventId(...args),
}));

jest.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: jest.fn(() => ({
    from: jest.fn((tableName: string) => {
      if (tableName === "matches") {
        let eqColumn: "team_1_name" | "team_2_name" | null = null;

        return {
          select: jest.fn(() => ({
            eq: jest.fn((column: "team_1_name" | "team_2_name" | "status") => {
              if (column === "team_1_name" || column === "team_2_name") {
                eqColumn = column;
              }

              return {
                eq: jest.fn(() => ({
                  order: jest.fn(() => ({
                    limit: jest.fn(() =>
                      Promise.resolve({
                        data: eqColumn ? mockMatchRows[eqColumn] : [],
                        error: null,
                      })
                    ),
                  })),
                })),
              };
            }),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          limit: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue(mockEventRow),
          })),
        })),
      };
    }),
  })),
}));

describe("matchPreview data helpers", () => {
  beforeEach(() => {
    mockReadStoredMatchDetailsByVlrMatchId.mockReset();
    mockGetTournamentDetailByVlrEventId.mockReset();
    mockMatchRows.team_1_name = [];
    mockMatchRows.team_2_name = [];
  });

  it("returns structured match context with event and head-to-head data", async () => {
    mockReadStoredMatchDetailsByVlrMatchId.mockResolvedValue({
      status: "upcoming",
      team_1_name: "Sentinels",
      team_2_name: "G2 Esports",
      events: {
        id: 34,
        vlr_event_id: 2860,
        title: "VCT 2026: Americas Stage 1",
        region: "us",
        prize: "$250,000",
        dates: "Apr 10-May 25",
      },
      match_details: {
        payload: {
          date: "May 12 6:00 PM EDT",
          status: "upcoming",
          format: "Bo3",
          event: {
            name: "VCT 2026: Americas Stage 1",
            series: "Playoffs: Upper Final",
          },
          teams: [
            { name: "Sentinels", score: null },
            { name: "G2 Esports", score: null },
          ],
          maps: [
            {
              players: {
                team1: [{ player: "zekken" }],
                team2: [],
              },
            },
          ],
          head_to_head: [
            {
              event_name: "VCT 2025: Americas Stage 2",
              event_series: "Playoffs",
              team1_score: "2",
              team2_score: "1",
              team1_win: true,
              team2_win: false,
              date: "2025-08-11",
              url: "https://www.vlr.gg/123",
            },
          ],
        },
      },
    });

    const result = await getMatchContext(12345);

    expect(result).toMatchObject({
      matchId: 12345,
      internalEventId: 34,
      vlrEventId: 2860,
      eventTitle: "VCT 2026: Americas Stage 1",
      eventSeries: "Playoffs: Upper Final",
      team1: "Sentinels",
      team2: "G2 Esports",
      displayDate: "May 12",
      startTime: "6:00 PM EDT",
      status: "upcoming",
      eventRegion: "us",
      prizePool: "$250,000",
      format: "Bo3",
      hasSyncedPlayerStats: true,
    });
    expect(result?.headToHeadSummary).toEqual({
      team1Wins: 1,
      team2Wins: 0,
      draws: 0,
    });
    expect(result?.headToHead).toHaveLength(1);
  });

  it("still produces a grounded preview when one team has no recent form", () => {
    const preview = buildDeterministicMatchPreview({
      matchContext: {
        matchId: 123,
        internalEventId: 34,
        vlrEventId: 2860,
        eventTitle: "VCT 2026: Americas Stage 1",
        eventSeries: "Playoffs: Upper Final",
        team1: "Sentinels",
        team2: "G2 Esports",
        displayDate: "May 12",
        startTime: "6:00 PM EDT",
        status: "upcoming",
        isCompleted: false,
        team1Score: "",
        team2Score: "",
        eventRegion: "us",
        prizePool: "$250,000",
        eventDates: "Apr 10-May 25",
        format: "Bo3",
        hasSyncedPlayerStats: true,
        headToHead: [],
        headToHeadSummary: {
          team1Wins: 0,
          team2Wins: 0,
          draws: 0,
        },
      },
      team1Form: {
        teamName: "Sentinels",
        timespanDays: 30,
        source: "recent_matches",
        sampleMatchCount: 3,
        players: [],
        topPlayersByRating: [],
        topPlayersByAcs: [],
        topRatedPlayer: {
          player: "zekken",
          team: "Sentinels",
          rating: 1.16,
          acs: 244,
          kd: 1.18,
          adr: 156,
          kastPercentage: 74,
          hsPercentage: 31,
          firstKillsPerRound: 0.16,
          clutchSuccessPercentage: 13,
          roundsPlayed: 430,
        },
        topAcsPlayer: {
          player: "zekken",
          team: "Sentinels",
          rating: 1.16,
          acs: 244,
          kd: 1.18,
          adr: 156,
          kastPercentage: 74,
          hsPercentage: 31,
          firstKillsPerRound: 0.16,
          clutchSuccessPercentage: 13,
          roundsPlayed: 430,
        },
        averageTop3Rating: 1.1,
        averageTop3Acs: 225,
      },
      team2Form: null,
      eventContext: null,
      stakes: {
        isPlayoff: true,
        roundTitle: "Playoffs: Upper Final",
        stakesSummary:
          "This is an upper-bracket final. The winner reaches the Grand Final, while the loser drops into the lower final.",
        winnerPath: "Winner likely advances to Grand Final against G2 Esports.",
        loserPath: "Loser likely drops to Lower Final against LOUD.",
        inferredFromBracket: true,
      },
    });

    expect(preview).toContain("Sentinels vs G2 Esports is scheduled for May 12 at 6:00 PM EDT");
    expect(preview).toContain("Sentinels's key player is zekken, posting 1.16 rating, 244 ACS, 1.18 K/D, and 156 ADR");
    expect(preview).toContain("Sentinels's top-three core is averaging 1.1 rating and 225 ACS across 3 recent stored matches.");
    expect(preview).toContain("winner reaches the Grand Final");
    expect(preview).toContain("Winner likely advances to Grand Final against G2 Esports.");
    expect(preview).toContain("The event prize pool is $250,000.");
    expect(preview).not.toContain("undefined");
  });

  it("prefers recent stored team match stats when available", async () => {
    mockMatchRows.team_1_name = [
      {
        vlr_match_id: 1,
        team_1_name: "Rex Regum Qeon",
        team_2_name: "Global Esports",
        scheduled_at: "2026-05-01T00:00:00Z",
        status: "completed",
        match_details: {
          payload: {
            maps: [
              {
                players: {
                  team1: [
                    {
                      player: "Monyet",
                      kills: 20,
                      deaths: 15,
                      assists: 6,
                      acs: 245,
                      rating: 1.21,
                    },
                    {
                      player: "Jemkin",
                      kills: 18,
                      deaths: 16,
                      assists: 5,
                      acs: 231,
                      rating: 1.12,
                    },
                  ],
                  team2: [],
                },
              },
            ],
          },
        },
      },
      {
        vlr_match_id: 2,
        team_1_name: "Rex Regum Qeon",
        team_2_name: "DRX",
        scheduled_at: "2026-04-28T00:00:00Z",
        status: "completed",
        match_details: {
          payload: {
            performance: [
              {
                team_name: "Rex Regum Qeon",
                players: [
                  {
                    player: "Monyet",
                    kills: 19,
                    deaths: 14,
                    assists: 4,
                    acs: 238,
                    rating: 1.17,
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    const result = await getRecentTeamMatchForm("Rex Regum Qeon");

    expect(result?.source).toBe("recent_matches");
    expect(result?.sampleMatchCount).toBe(2);
    expect(result?.topRatedPlayer?.player).toBe("Monyet");
    expect(result?.topRatedPlayer?.kills).toBe(39);
    expect(result?.topRatedPlayer?.deaths).toBe(29);
    expect(result?.topRatedPlayer?.sampleMatches).toBe(2);
    expect(result?.topRatedPlayer?.adr).toBeNull();
  });

  it("infers playoff stakes and likely bracket paths from tournament detail", async () => {
    const { getMatchStakes } = await import("./data");

    mockGetTournamentDetailByVlrEventId.mockResolvedValue({
      event: {
        id: 1,
        vlrEventId: 2775,
        title: "VCT 2026: Pacific Stage 1",
        status: "ongoing",
        region: "ap",
        dates: "Apr 2-May 17",
        prize: "$250,000",
        thumb: "/logo.png",
        urlPath: "/event/2775",
        canonicalSlug: "vct-2026-pacific-stage-1",
      },
      matches: [],
      featuredMatch: null,
      news: [],
      statsSummary: [],
      bracket: {
        layout: "bracket",
        rounds: [
          {
            key: "upper-round-1",
            title: "Playoffs: Upper Round 1",
            order: 301,
            matches: [
              {
                id: 1,
                vlrMatchId: 12345,
                label: "Match 1",
                team1: "Rex Regum Qeon",
                team2: "Global Esports",
                team1Logo: "",
                team2Logo: "",
                score1: "",
                score2: "",
                status: "upcoming",
                matchHref: "/matches/12345/test",
              },
            ],
          },
          {
            key: "upper-semifinal",
            title: "Playoffs: Upper Semifinal",
            order: 302,
            matches: [
              {
                id: 2,
                vlrMatchId: 12346,
                label: "Match 2",
                team1: "Paper Rex",
                team2: "TBD",
                team1Logo: "",
                team2Logo: "",
                score1: "",
                score2: "",
                status: "upcoming",
                matchHref: "/matches/12346/test",
              },
            ],
          },
          {
            key: "lower-round-1",
            title: "Playoffs: Lower Round 1",
            order: 321,
            matches: [
              {
                id: 3,
                vlrMatchId: 12347,
                label: "Match 3",
                team1: "Nongshim RedForce",
                team2: "TBD",
                team1Logo: "",
                team2Logo: "",
                score1: "",
                score2: "",
                status: "upcoming",
                matchHref: "/matches/12347/test",
              },
            ],
          },
        ],
      },
    });

    const result = await getMatchStakes({
      matchId: 12345,
      internalEventId: 1,
      vlrEventId: 2775,
      eventTitle: "VCT 2026: Pacific Stage 1",
      eventSeries: "Playoffs: Upper Round 1",
      team1: "Rex Regum Qeon",
      team2: "Global Esports",
      displayDate: "Thursday, May 7",
      startTime: "4:00 AM EDT",
      status: "upcoming",
      isCompleted: false,
      team1Score: "",
      team2Score: "",
      eventRegion: "ap",
      prizePool: "$250,000",
      eventDates: "Apr 2-May 17",
      format: "Bo3",
      hasSyncedPlayerStats: true,
      headToHead: [],
      headToHeadSummary: {
        team1Wins: 0,
        team2Wins: 0,
        draws: 0,
      },
    });

    expect(result?.isPlayoff).toBe(true);
    expect(result?.winnerPath).toBe(
      "Winner likely advances to Playoffs: Upper Semifinal against Paper Rex."
    );
    expect(result?.loserPath).toBe(
      "Loser likely drops to Playoffs: Lower Round 1 against Nongshim RedForce."
    );
    expect(result?.inferredFromBracket).toBe(true);
  });
});
