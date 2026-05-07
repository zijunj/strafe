/**
 * @jest-environment node
 */

import { POST } from "./route";
import axios from "axios";

const mockPlanQuestion = jest.fn();
const mockRetrieveStats = jest.fn();
const mockParseQuery = jest.fn();
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@/lib/ai/queryPlan", () => ({
  planQuestion: (...args: unknown[]) => mockPlanQuestion(...args),
}));

jest.mock("@/lib/ai/retrieveStats", () => ({
  retrieveStats: (...args: unknown[]) => mockRetrieveStats(...args),
}));

jest.mock("@/lib/ai/parseQuery", () => ({
  parseQuery: (...args: unknown[]) => mockParseQuery(...args),
  buildParsedQueryFromPlan: jest.fn(),
}));

jest.mock("@/lib/ai/formatAnswer", () => ({
  formatAnswer: jest.fn(),
}));

describe("POST /api/openai", () => {
  beforeEach(() => {
    mockPlanQuestion.mockReset();
    mockRetrieveStats.mockReset();
    mockParseQuery.mockReset();
    mockedAxios.post = jest.fn();
  });

  it("short-circuits clearly out-of-domain questions before planning and retrieval", async () => {
    mockParseQuery.mockReturnValue({
      rawQuestion: "how is the weather today?",
      normalizedQuestion: "how is the weather today?",
      intent: "leaderboard",
      metric: "general",
      entity: "general",
      sort: "desc",
      limit: 5,
      filters: {
        region: "global",
        timespanDays: 30,
        tier: null,
        eventGroupId: null,
        eventName: null,
        agent: null,
        role: null,
        minRounds: null,
        team: null,
        player: null,
        players: [],
        matchTeam: null,
        opponentTeam: null,
        status: null,
        datePreset: null,
      },
    });

    const request = new Request("http://localhost/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: "how is the weather today?" }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.answer).toBe(
      "I can only answer questions about Valorant players, teams, matches, and events."
    );
    expect(payload.uiHints.title).toBe("Unsupported question");
    expect(payload.supportingData).toEqual([]);
    expect(mockPlanQuestion).not.toHaveBeenCalled();
    expect(mockRetrieveStats).not.toHaveBeenCalled();
    expect(mockParseQuery).toHaveBeenCalledWith("how is the weather today?");
  });

  it("uses the domain classifier for ambiguous questions before planning and retrieval", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";

    mockParseQuery.mockReturnValue({
      rawQuestion: "tell me about paris this weekend",
      normalizedQuestion: "tell me about paris this weekend",
      intent: "leaderboard",
      metric: "general",
      entity: "general",
      sort: "desc",
      limit: 5,
      filters: {
        region: "global",
        timespanDays: 30,
        tier: null,
        eventGroupId: null,
        eventName: null,
        agent: null,
        role: null,
        minRounds: null,
        team: null,
        player: null,
        players: [],
        matchTeam: null,
        opponentTeam: null,
        status: null,
        datePreset: null,
      },
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: "out_of_domain",
            },
          },
        ],
      },
    } as never);

    const request = new Request("http://localhost/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "tell me about paris this weekend",
      }),
    });

    const response = await POST(request as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.answer).toBe(
      "I can only answer questions about Valorant players, teams, matches, and events."
    );
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(mockPlanQuestion).not.toHaveBeenCalled();
    expect(mockRetrieveStats).not.toHaveBeenCalled();

    process.env.OPENAI_API_KEY = originalApiKey;
  });
});
