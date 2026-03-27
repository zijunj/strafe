"use client";

import { FormEvent, useState } from "react";

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
    source: "supabase" | "mock";
    appliedRegion: string;
    appliedTimespanDays: number | "all";
    appliedEventGroupId: number | null;
    rowCount: number;
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
  "Who has the best rating in North America?",
  "Compare Demon1 and aspas by ACS.",
  "Which player has the highest ADR over the last 30 days?",
];

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDebug, setShowDebug] = useState(true);

  const submitQuestion = async (questionOverride?: string) => {
    const nextQuestion = (questionOverride ?? question).trim();

    if (!nextQuestion) {
      setError("Enter a question to search the stats.");
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

  return (
    <section className="card">
      <div className="card-header">
        <p className="section-label mb-2">AI Search</p>
        <h2 className="card-title">Ask stats questions like StatMuse</h2>
        <p className="card-subtitle mt-2 max-w-3xl">
          This page is now structured around a clean query pipeline: parse the
          question, retrieve relevant stats, generate an answer, and return the
          supporting records used to answer it.
        </p>
      </div>

      <div className="card-body space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submitQuestion(suggestion)}
              className="btn-secondary text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="ai-question" className="label block">
            Ask a question
          </label>
          <textarea
            id="ai-question"
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Who has the best K/D in EMEA?"
            className="textarea-field resize-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <p className="section-label text-[var(--color-text-muted)]">Answer</p>
          </div>
          <div className="card-body">
            {result?.retrievalMeta && (
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="badge-primary">
                  Source: {result.retrievalMeta.source}
                </span>
                <span className="badge-secondary">
                  Region: {result.retrievalMeta.appliedRegion}
                </span>
                <span className="badge-secondary">
                  Timespan:{" "}
                  {result.retrievalMeta.appliedTimespanDays === "all"
                    ? "all"
                    : `${result.retrievalMeta.appliedTimespanDays} days`}
                </span>
                <span className="badge-secondary">
                  Rows: {result.retrievalMeta.rowCount}
                </span>
                <span className="badge-secondary">
                  Event Group: {result.retrievalMeta.appliedEventGroupId ?? "all"}
                </span>
              </div>
            )}
            {result?.uiHints && (
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="badge-secondary">
                  {result.uiHints.title}
                </span>
                <span className="badge-muted">
                  Metric: {result.uiHints.highlightMetric}
                </span>
              </div>
            )}
            <div className="body-text min-h-24">
              {result?.answer || (
                <span className="text-[var(--color-text-muted)]">
                  Ask a question to generate an answer and see the supporting
                  data returned by the pipeline.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between gap-3">
            <p className="section-label text-[var(--color-text-muted)]">Debug View</p>
            <button
              type="button"
              onClick={() => setShowDebug((current) => !current)}
              className="badge-secondary cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
            >
              {showDebug ? "Hide" : "Show"}
            </button>
          </div>

          {showDebug && (
            <div className="card-body grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="label mb-3 text-[var(--color-primary)]">Parsed Query</p>
                <pre className="overflow-x-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.parsedQuery ?? null, null, 2)}
                </pre>
              </div>

              <div>
                <p className="label mb-3 text-[var(--color-primary)]">Retrieved Rows</p>
                <pre className="max-h-[360px] overflow-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 text-xs leading-6 text-[var(--color-text-secondary)]">
                  {JSON.stringify(result?.supportingData ?? [], null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <p className="section-label text-[var(--color-text-muted)]">Supporting Data</p>
          </div>
          <div className="card-body space-y-3">
            {(result?.supportingData ?? []).map((record) => (
              <article
                key={record.id}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="card-title">{record.player}</h3>
                      <p className="card-subtitle">
                        {record.team} • {record.region}
                      </p>
                    </div>
                    <span className="badge-primary">
                      Rating {record.rating}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[var(--color-text-secondary)]">
                    <p>ACS: {record.acs}</p>
                    <p>K/D: {record.kd}</p>
                    <p>ADR: {record.adr}</p>
                    <p>HS%: {record.hsPercentage}</p>
                    <p>Rounds: {record.roundsPlayed}</p>
                  </div>
                </div>
              </article>
            ))}
            {!result?.supportingData?.length && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Supporting rows will appear here after a query runs.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
