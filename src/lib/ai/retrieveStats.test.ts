import type { ParsedQuery } from "./parseQuery";

type Row = Record<string, any>;

const mockTables: Record<string, Row[]> = {
  aggregated_player_stats: [],
  events: [],
  matches: [],
  event_player_stats: [],
};

class MockQueryBuilder {
  private filters: Array<(row: Row) => boolean> = [];
  private limitCount: number | null = null;
  private orderBy:
    | { column: string; ascending: boolean; nullsFirst?: boolean | null }
    | null = null;

  constructor(private readonly tableName: string) {}

  select() {
    return this;
  }

  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) {
    this.orderBy = {
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst ?? null,
    };
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  ilike(column: string, pattern: string) {
    const normalizedPattern = pattern.replace(/%/g, "").toLowerCase();
    this.filters.push((row) =>
      String(row[column] ?? "").toLowerCase().includes(normalizedPattern)
    );
    return this;
  }

  or(expression: string) {
    const clauses = expression.split(",").map((clause) => clause.trim());
    this.filters.push((row) =>
      clauses.some((clause) => {
        const match = clause.match(/^([a-z0-9_]+)\.ilike\.%(.*)%$/i);

        if (!match) {
          return false;
        }

        const [, column, value] = match;
        return String(row[column] ?? "")
          .toLowerCase()
          .includes(value.toLowerCase());
      })
    );
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    let rows = [...(mockTables[this.tableName] ?? [])];

    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows.sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];

        if (aValue == null && bValue == null) {
          return 0;
        }

        if (aValue == null) {
          return 1;
        }

        if (bValue == null) {
          return -1;
        }

        if (aValue < bValue) {
          return ascending ? -1 : 1;
        }

        if (aValue > bValue) {
          return ascending ? 1 : -1;
        }

        return 0;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    return Promise.resolve({ data: rows, error: null }).then(resolve);
  }
}

jest.mock("../supabase/server", () => ({
  createServiceRoleSupabaseClient: jest.fn(() => ({
    from: (tableName: string) => new MockQueryBuilder(tableName),
  })),
}));

describe("retrieveStats", () => {
  beforeEach(() => {
    for (const tableName of Object.keys(mockTables)) {
      mockTables[tableName] = [];
    }
  });

  it("falls back across shared timespans until both comparison players are present", async () => {
    mockTables.aggregated_player_stats = [
      {
        id: "demon1-30",
        player_name: "Demon1",
        team_name: "ENVY",
        region: "na",
        timespan_days: 30,
        event_group_id: null,
        agents: ["jett"],
        rating: 0.98,
        acs: 189,
        kd: 0.98,
        kast_percentage: 70,
        adr: 124.5,
        hs_percentage: 45,
        kills_per_round: 0.7,
        assists_per_round: 0.2,
        first_kills_per_round: 0.1,
        first_deaths_per_round: 0.1,
        clutch_success_percentage: 10,
        rounds_played: 201,
      },
      {
        id: "demon1-60",
        player_name: "Demon1",
        team_name: "ENVY",
        region: "na",
        timespan_days: 60,
        event_group_id: null,
        agents: ["jett"],
        rating: 1,
        acs: 190,
        kd: 1,
        kast_percentage: 71,
        adr: 130,
        hs_percentage: 40,
        kills_per_round: 0.71,
        assists_per_round: 0.2,
        first_kills_per_round: 0.11,
        first_deaths_per_round: 0.1,
        clutch_success_percentage: 11,
        rounds_played: 250,
      },
      {
        id: "aspas-60",
        player_name: "aspas",
        team_name: "MIBR",
        region: "br",
        timespan_days: 60,
        event_group_id: null,
        agents: ["jett"],
        rating: 1.1,
        acs: 220,
        kd: 1.1,
        kast_percentage: 72,
        adr: 140,
        hs_percentage: 35,
        kills_per_round: 0.75,
        assists_per_round: 0.21,
        first_kills_per_round: 0.12,
        first_deaths_per_round: 0.09,
        clutch_success_percentage: 12,
        rounds_played: 260,
      },
    ];

    const { retrieveStats } = await import("./retrieveStats");

    const parsedQuery: ParsedQuery = {
      rawQuestion: "Compare Demon1 and aspas by ACS.",
      normalizedQuestion: "Compare Demon1 and aspas by ACS.",
      intent: "comparison",
      comparisonPlayers: ["Demon1", "aspas"],
      metric: "acs",
      entity: "player",
      sort: "desc",
      limit: 2,
      filters: {
        region: "global",
        timespanDays: 30,
        tier: null,
        eventGroupId: null,
        eventName: null,
        player: null,
        players: ["Demon1", "aspas"],
        role: null,
        agent: null,
        minRounds: null,
        team: null,
        matchTeam: null,
        opponentTeam: null,
        status: null,
        datePreset: null,
      },
    };

    const result = await retrieveStats(parsedQuery);

    expect(result.retrievalMeta.appliedTimespanDays).toBe(60);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((row) => row.player)).toEqual(["aspas", "Demon1"]);
  });

  it("groups VCT family events for generic match schedule questions", async () => {
    mockTables.events = [
      {
        id: 25,
        vlr_event_id: 2864,
        title: "VCT 2026: China Stage 1",
        status: "ongoing",
        region: "cn",
        dates: "Mar 31—May 10",
        prize: null,
        tier: 1,
      },
      {
        id: 26,
        vlr_event_id: 2863,
        title: "VCT 2026: EMEA Stage 1",
        status: "ongoing",
        region: "de",
        dates: "Apr 1—May 17",
        prize: null,
        tier: 1,
      },
      {
        id: 27,
        vlr_event_id: 2775,
        title: "VCT 2026: Pacific Stage 1",
        status: "ongoing",
        region: "vn",
        dates: "Apr 2—May 17",
        prize: null,
        tier: 1,
      },
      {
        id: 34,
        vlr_event_id: 2860,
        title: "VCT 2026: Americas Stage 1",
        status: "ongoing",
        region: "us",
        dates: "Apr 10—May 25",
        prize: null,
        tier: 1,
      },
    ];

    mockTables.matches = [
      {
        event_id: 999,
        vlr_match_id: 1,
        event_title: "College VALORANT 2025-2026: Peach Belt Conference",
        event_series: "Playoffs: Grand Finals",
        team_1_name: "Converse University",
        team_2_name: "KSU Gold",
        team_1_score: null,
        team_2_score: null,
        status: "upcoming",
        scheduled_at: "2026-05-07T00:00:00+00:00",
        date_label: null,
        match_url: "https://www.vlr.gg/1",
        events: { region: "us" },
      },
      {
        event_id: 34,
        vlr_match_id: 645498,
        event_title: "VCT 2026: Americas Stage 1",
        event_series: "Group Stage: Week 5",
        team_1_name: "KRU Esports",
        team_2_name: "Evil Geniuses",
        team_1_score: null,
        team_2_score: null,
        status: "upcoming",
        scheduled_at: "2026-05-08T21:00:00+00:00",
        date_label: null,
        match_url: "https://www.vlr.gg/645498",
        events: { region: "us" },
      },
      {
        event_id: 26,
        vlr_match_id: 660381,
        event_title: "VCT 2026: EMEA Stage 1",
        event_series: "Playoffs: Upper Round 1",
        team_1_name: "Eternal Fire",
        team_2_name: "Team Heretics",
        team_1_score: null,
        team_2_score: null,
        status: "upcoming",
        scheduled_at: "2026-05-07T15:00:00+00:00",
        date_label: null,
        match_url: "https://www.vlr.gg/660381",
        events: { region: "de" },
      },
    ];

    const { retrieveStats } = await import("./retrieveStats");

    const parsedQuery: ParsedQuery = {
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
    };

    const result = await retrieveStats(parsedQuery);

    expect(result.contextData.matches).toHaveLength(2);
    expect(result.contextData.matches?.map((match) => match.eventTitle)).toEqual([
      "VCT 2026: EMEA Stage 1",
      "VCT 2026: Americas Stage 1",
    ]);
    expect(
      result.contextData.matches?.some((match) =>
        match.eventTitle?.includes("College VALORANT")
      )
    ).toBe(false);
  });
});
