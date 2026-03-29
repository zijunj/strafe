"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
  comparisonPlayers?: string[];
  metric: string;
  entity: "player" | "team" | "match" | "general";
  filters: {
    region?: string;
    timespanDays?: number | "all";
    eventGroupId?: number | null;
    agent?: string;
    minRounds?: number;
    team?: string;
    player?: string;
  };
}

interface SupportingRecord {
  id: string;
  player: string;
  team: string;
  region: string;
  rating: number;
  acs: number;
  kd: number;
  adr: number;
  hsPercentage: number;
  roundsPlayed: number;
}

interface AIResult {
  answer: string;
  parsedQuery: ParsedQuery;
  supportingData: SupportingRecord[];
  retrievalMeta?: {
    source: "supabase" | "mock" | "event_storage";
    appliedRegion: string;
    appliedTimespanDays: number | "all";
    appliedEventGroupId: number | null;
    appliedEventName?: string | null;
    rowCount: number;
  };
  contextData?: {
    event?: {
      id: number;
      vlrEventId: number;
      title: string;
      status: string;
      region: string | null;
      dates: string | null;
      prize: string | null;
    } | null;
    matches?: Array<{
      vlrMatchId: number;
      eventTitle: string | null;
      eventSeries: string | null;
      team1: string | null;
      team2: string | null;
      score1: string | null;
      score2: string | null;
      status: string;
      scheduledAt: string | null;
      dateLabel: string | null;
      matchUrl: string;
    }>;
  };
  uiHints?: {
    intent: "comparison" | "player_lookup" | "team_lookup" | "leaderboard";
    title: string;
    highlightMetric: string;
    highlightPlayers?: string[];
    highlightTeam?: string;
    showSupportingData: boolean;
    suggestedFollowUps: string[];
  };
}

const suggestedQuestions = [
  {
    label: "Best NA rating",
    prompt: "Who has the best rating in North America?",
  },
  {
    label: "Demon1 vs aspas ACS",
    prompt: "Compare Demon1 and aspas by ACS.",
  },
  {
    label: "Top 30-day ADR",
    prompt: "Which player has the highest ADR over the last 30 days?",
  },
  {
    label: "VCT 2026 schedule",
    prompt: "What matches are coming up for VCT 2026?",
  },
];

function formatTimespan(value?: number | "all") {
  if (!value) {
    return "30 days";
  }

  return value === "all" ? "all time" : `${value} days`;
}

function getFeaturedPlayer(result: AIResult | null) {
  if (!result) {
    return null;
  }

  return (
    result.parsedQuery.filters.player ||
    result.uiHints?.highlightPlayers?.[0] ||
    result.supportingData?.[0]?.player ||
    null
  );
}

function getFeaturedPlayers(result: AIResult | null): string[] {
  if (!result) {
    return [];
  }

  const comparisonPlayers =
    result.uiHints?.highlightPlayers ?? result.parsedQuery.comparisonPlayers;

  if (comparisonPlayers?.length) {
    return comparisonPlayers.slice(0, 2);
  }

  const singlePlayer = getFeaturedPlayer(result);
  return singlePlayer ? [singlePlayer] : [];
}

function shouldShowPlayerFeature(result: AIResult | null) {
  if (!result) {
    return false;
  }

  const hasTopPlayerResult = Boolean(result.supportingData?.[0]?.player);

  return (
    result.parsedQuery.entity === "player" ||
    result.uiHints?.intent === "player_lookup" ||
    result.uiHints?.intent === "comparison" ||
    (result.uiHints?.intent === "leaderboard" && hasTopPlayerResult)
  );
}

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDebug, setShowDebug] = useState(true);

  const submitQuestion = async (questionOverride?: string) => {
    const nextQuestion = (questionOverride ?? question).trim();

    if (!nextQuestion) {
      setError("Enter a question to search Valorant stats.");
      return;
    }

    setQuestion(nextQuestion);
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: nextQuestion }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to get AI answer.");
      }

      setResult(payload);
    } catch (err: any) {
      setError(err.message || "Failed to get AI answer.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitQuestion();
  };

  const handlePromptClick = async (prompt: string) => {
    setQuestion(prompt);
    await submitQuestion(prompt);
  };

  const handleQuestionKeyDown = async (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitQuestion();
    }
  };

  const featuredPlayer = getFeaturedPlayer(result);
  const featuredPlayers = getFeaturedPlayers(result);
  const showPlayerFeature = shouldShowPlayerFeature(result);

  return (
    <section className="space-y-4">
      <div className="ai-search-shell content-rise stagger-2">
        <div className="ai-search-panel">
          <div className="ai-search-eyebrow">
            <span className="section-label">Strafe AI</span>
            <span className="badge-muted">Live stats search</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="ai-search-title">Search Valorant stats with questions.</h1>
            <p className="ai-search-subtitle">
              Ask about players, teams, matches, and event context.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="ai-search-form">
            <label htmlFor="ai-question" className="sr-only">
              Ask a Valorant stats question
            </label>
            <div className="ai-search-input-wrap">
              <div className="ai-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <input
                id="ai-question"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleQuestionKeyDown}
                placeholder="Ask anything about Valorant stats..."
                className="ai-search-input"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="ai-search-submit"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          <div className="ai-search-meta">
            <span>Try comparisons, leaderboards, or event questions.</span>
            <span>Enter to search.</span>
          </div>
        </div>
      </div>

      <div className="content-rise stagger-3">
        <div className="ai-prompt-row">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion.prompt}
              type="button"
              onClick={() => handlePromptClick(suggestion.prompt)}
              className="ai-prompt-chip"
            >
              <span className="ai-prompt-chip-label">{suggestion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="content-rise stagger-3 rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="content-rise stagger-4">
        <section className="card ai-answer-card">
          <div className="card-body space-y-4">
            <div className="ai-answer-hero">
              {showPlayerFeature && (
                <div className="ai-answer-player-group">
                  {featuredPlayers.length > 1 ? (
                    <>
                      <div className="ai-answer-player">
                        <div className="ai-answer-player-photo" aria-hidden="true">
                          <img
                            src="/valorantLogo.png"
                            alt=""
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                        <div className="ai-answer-player-meta">
                          <span className="label">Compared player</span>
                          <strong>{featuredPlayers[0]}</strong>
                        </div>
                      </div>

                      <div className="ai-answer-versus">vs</div>

                      <div className="ai-answer-player">
                        <div className="ai-answer-player-photo" aria-hidden="true">
                          <img
                            src="/valorantLogo.png"
                            alt=""
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                        <div className="ai-answer-player-meta">
                          <span className="label">Compared player</span>
                          <strong>{featuredPlayers[1]}</strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="ai-answer-player">
                      <div className="ai-answer-player-photo" aria-hidden="true">
                        <img
                          src="/valorantLogo.png"
                          alt=""
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                      <div className="ai-answer-player-meta">
                        <span className="label">Featured player</span>
                        <strong>
                          {featuredPlayers[0] ?? featuredPlayer ?? "Player result"}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="ai-answer-copy">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="section-label">Answer</p>
                    <h2 className="ai-answer-title">
                      {result?.uiHints?.title || "Ask a question to get started"}
                    </h2>
                  </div>

                  {result?.uiHints?.highlightMetric && (
                    <span className="badge-primary">
                      Metric: {result.uiHints.highlightMetric}
                    </span>
                  )}
                </div>

                <div className="ai-answer-panel">
                  <div className="body-text text-[var(--color-text-primary)]">
                    {result?.answer || (
                      <span className="text-[var(--color-text-muted)]">
                        Ask about player form, event schedules, team leaders, or
                        comparisons.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {result?.retrievalMeta && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge-primary">
                  Source: {result.retrievalMeta.source}
                </span>
                <span className="badge-secondary">
                  {result.retrievalMeta.appliedRegion}
                </span>
                <span className="badge-secondary">
                  {formatTimespan(result.retrievalMeta.appliedTimespanDays)}
                </span>
                <span className="badge-secondary">
                  {result.retrievalMeta.rowCount} rows
                </span>
                {result.retrievalMeta.appliedEventName && (
                  <span className="badge-muted">
                    {result.retrievalMeta.appliedEventName}
                  </span>
                )}
                <span className="badge-muted">
                  Intent: {result?.uiHints?.intent ?? "waiting"}
                </span>
              </div>
            )}

            {(result?.supportingData?.length ?? 0) > 0 && (
              <div className="table-container">
                <table className="data-table ai-results-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Region</th>
                      <th>Rating</th>
                      <th>ACS</th>
                      <th>K/D</th>
                      <th>ADR</th>
                      <th>HS%</th>
                      <th>Rounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result?.supportingData.map((record) => (
                      <tr key={record.id}>
                        <td>{record.player}</td>
                        <td>{record.team}</td>
                        <td>{record.region}</td>
                        <td>{record.rating}</td>
                        <td>{record.acs}</td>
                        <td>{record.kd}</td>
                        <td>{record.adr}</td>
                        <td>{record.hsPercentage}</td>
                        <td>{record.roundsPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result?.uiHints?.suggestedFollowUps?.length ? (
              <div className="space-y-2">
                <p className="label text-[var(--color-primary)]">Follow-ups</p>
                <div className="flex flex-wrap gap-2">
                  {result.uiHints.suggestedFollowUps.map((followUp) => (
                    <button
                      key={followUp}
                      type="button"
                      onClick={() => handlePromptClick(followUp)}
                      className="badge-secondary cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="card content-rise stagger-5">
        <div className="card-header flex items-center justify-between gap-3">
          <div>
            <p className="section-label text-[var(--color-text-muted)]">
              Pipeline Debug
            </p>
            <h2 className="card-title mt-2">Developer visibility</h2>
            <p className="card-subtitle mt-1">
              Parsed query, retrieval context, and raw rows stay visible here for
              validation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDebug((current) => !current)}
            className="badge-secondary cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
          >
            {showDebug ? "Hide" : "Show"}
          </button>
        </div>

        {showDebug && (
          <div className="card-body grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <div>
                <p className="label mb-3 text-[var(--color-primary)]">
                  Parsed Query
                </p>
                <pre className="overflow-x-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.parsedQuery ?? null, null, 2)}
                </pre>
              </div>

              <div>
                <p className="label mb-3 text-[var(--color-primary)]">
                  Retrieval Meta
                </p>
                <pre className="overflow-x-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.retrievalMeta ?? null, null, 2)}
                </pre>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="label mb-3 text-[var(--color-primary)]">
                  Context Data
                </p>
                <pre className="max-h-[260px] overflow-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.contextData ?? null, null, 2)}
                </pre>
              </div>

              <div>
                <p className="label mb-3 text-[var(--color-primary)]">
                  Retrieved Rows
                </p>
                <pre className="max-h-[360px] overflow-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.supportingData ?? [], null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card content-rise stagger-5">
        <div className="card-header">
          <p className="section-label text-[var(--color-text-muted)]">
            Supporting Data
          </p>
          <h2 className="card-title mt-2">Returned player records</h2>
        </div>
        <div className="card-body">
          {!result?.supportingData?.length ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Supporting rows will appear here after a question runs.
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table ai-results-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Region</th>
                    <th>Rating</th>
                    <th>ACS</th>
                    <th>K/D</th>
                    <th>ADR</th>
                    <th>HS%</th>
                    <th>Rounds</th>
                  </tr>
                </thead>
                <tbody>
                  {result.supportingData.map((record) => (
                    <tr key={record.id}>
                      <td>{record.player}</td>
                      <td>{record.team}</td>
                      <td>{record.region}</td>
                      <td>{record.rating}</td>
                      <td>{record.acs}</td>
                      <td>{record.kd}</td>
                      <td>{record.adr}</td>
                      <td>{record.hsPercentage}</td>
                      <td>{record.roundsPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
