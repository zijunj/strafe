import { parseQuery } from "./parseQuery";

describe("parseQuery", () => {
  it("treats player comparisons as comparison queries", () => {
    const result = parseQuery("Compare Demon1 and aspas by ACS.");

    expect(result.intent).toBe("comparison");
    expect(result.entity).toBe("player");
    expect(result.metric).toBe("acs");
    expect(result.sort).toBe("desc");
    expect(result.comparisonPlayers).toEqual(["Demon1", "aspas"]);
    expect(result.filters.players).toEqual(["Demon1", "aspas"]);
  });

  it("treats VCT schedule questions as ascending event lookups", () => {
    const result = parseQuery("What matches are coming up for VCT 2026?");

    expect(result.intent).toBe("event_lookup");
    expect(result.entity).toBe("event");
    expect(result.sort).toBe("asc");
    expect(result.metric).toBe("general");
  });
});
