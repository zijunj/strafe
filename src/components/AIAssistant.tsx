"use client";

import { FormEvent, useState } from "react";

interface ParsedQuery {
  rawQuestion: string;
  normalizedQuestion: string;
  metric: string;
  entity: "player" | "team" | "match" | "general";
  filters: {
    region?: string;
    timespanDays?: number;
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
    appliedTimespanDays: number;
    rowCount: number;
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
    <section className="rounded-2xl border border-[#2f2f2f] bg-[#1E1E1E] overflow-hidden">
      <div className="border-b border-[#2f2f2f] px-6 py-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFE44F]">
          AI Search
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-white">
          Ask stats questions like StatMuse
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          This page is now structured around a clean query pipeline: parse the
          question, retrieve relevant stats, generate an answer, and return the
          supporting records used to answer it.
        </p>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-3 md:grid-cols-3">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submitQuestion(suggestion)}
              className="rounded-lg border border-[#3a3a3a] bg-[#242424] px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:border-[#FFE44F] hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="ai-question" className="block text-sm font-semibold text-white">
            Ask a question
          </label>
          <textarea
            id="ai-question"
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Who has the best K/D in EMEA?"
            className="w-full rounded-lg border border-[#3a3a3a] bg-[#151515] px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#FFE44F]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-[#FFE44F] px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl border border-[#5a2b2b] bg-[#2a1717] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-[#2f2f2f] bg-[#151515] p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
            Answer
          </p>
          {result?.retrievalMeta && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#3a3a3a] bg-[#202020] px-3 py-1 font-bold uppercase tracking-[0.08em] text-[#FFE44F]">
                Source: {result.retrievalMeta.source}
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-[#202020] px-3 py-1 font-semibold text-gray-300">
                Region: {result.retrievalMeta.appliedRegion}
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-[#202020] px-3 py-1 font-semibold text-gray-300">
                Timespan: {result.retrievalMeta.appliedTimespanDays} days
              </span>
              <span className="rounded-full border border-[#3a3a3a] bg-[#202020] px-3 py-1 font-semibold text-gray-300">
                Rows: {result.retrievalMeta.rowCount}
              </span>
            </div>
          )}
          <div className="mt-3 min-h-24 text-sm leading-7 text-gray-200">
            {result?.answer || (
              <span className="text-gray-500">
                Ask a question to generate an answer and see the supporting
                data returned by the pipeline.
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-[#2f2f2f] bg-[#151515] p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
              Parsed Query
            </p>
            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-gray-300">
              {JSON.stringify(result?.parsedQuery ?? null, null, 2)}
            </pre>
          </div>

          <div className="rounded-xl border border-[#2f2f2f] bg-[#151515] p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gray-400">
              Supporting Data
            </p>
            <div className="mt-3 space-y-3">
              {(result?.supportingData ?? []).map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-[#2f2f2f] bg-[#202020] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {record.player}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {record.team} • {record.region}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#151515] px-3 py-1 text-xs font-bold text-[#FFE44F]">
                      Rating {record.rating}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <p>ACS: {record.acs}</p>
                    <p>K/D: {record.kd}</p>
                    <p>ADR: {record.adr}</p>
                    <p>HS%: {record.hsPercentage}</p>
                    <p>Rounds: {record.roundsPlayed}</p>
                  </div>
                </article>
              ))}
              {!result?.supportingData?.length && (
                <p className="text-sm text-gray-500">
                  Supporting rows will appear here after a query runs.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
