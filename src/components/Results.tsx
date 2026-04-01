"use client";

import useValorantApiWithCache from "../app/api/Valorant";
import parseTimeCompleted from "../app/utils/apiFunctions";
import { useEffect, useState } from "react";

interface ResultsProps {
  pageView: string;
}

interface MatchResult {
  match_event: string;
  match_series: string;
  match_page: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  team1_logo?: string | null;
  team2_logo?: string | null;
  tournament_logo?: string | null;
  unix_timestamp: string;
  date_label: string;
}

const RESULTS_PAGE_BATCH_SIZE = 12;

export default function Results({ pageView }: ResultsProps) {
  const resultsUrl = "storage/matches?status=completed&backgroundSync=0";

  const { data: resultData, loading } = useValorantApiWithCache<MatchResult[]>({
    key: "results-storage",
    url: resultsUrl,
    parse: (res) => res.data?.segments || [],
  });
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_BATCH_SIZE);
  const sortedResults = [...(resultData || [])].sort(
    (a, b) =>
      parseTimeCompleted(b.date_label).getTime() -
      parseTimeCompleted(a.date_label).getTime(),
  );
  const visibleResults =
    pageView === "match" ? sortedResults.slice(0, visibleCount) : sortedResults;

  useEffect(() => {
    if (pageView !== "match") {
      return;
    }

    setVisibleCount(RESULTS_PAGE_BATCH_SIZE);
  }, [pageView, resultData]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="body-text">Loading...</p>
      </div>
    );
  }

  if (!resultData || resultData.length === 0) {
    return (
      <div className="p-4">
        <p className="body-text">No results found.</p>
      </div>
    );
  }

  return (
    <>
      {pageView === "home" && (
        <section className="max-w-7xl mx-auto">
          {Object.entries(
            visibleResults.slice(0, 10).reduce(
              (acc, item) => {
                const tourneyKey = item.match_event;
                if (!acc[tourneyKey]) acc[tourneyKey] = [];
                acc[tourneyKey].push(item);
                return acc;
              },
              {} as Record<string, MatchResult[]>,
            ),
          ).map(([tournament, matches], i) => (
            <div key={i}>
              {/* Tournament Header */}
              <div className="flex items-center px-3 py-2 bg-[var(--color-bg-surface-elevated)] border-b border-[var(--color-border-subtle)]">
                <img
                  src={matches[0]?.tournament_logo || "/valorantLogo.png"}
                  alt={tournament}
                  className="w-4 h-4 mr-2 object-contain opacity-80"
                />
                <span className="label text-[var(--color-text-primary)] truncate">
                  {tournament}
                </span>
              </div>

              {/* Group matches by date inside each tournament */}
              {Object.entries(
                matches.reduce(
                  (acc, item) => {
                    const dateObj = parseTimeCompleted(item.date_label);
                    const dateKey = dateObj.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push({ ...item, dateObj });
                    return acc;
                  },
                  {} as Record<string, (MatchResult & { dateObj: Date })[]>,
                ),
              ).map(([date, dayMatches], j) => (
                <div key={j}>
                  {/* Date Subheader */}
                  <div className="px-3 py-1 bg-[var(--color-bg-surface)] text-[10px] text-[var(--color-text-muted)] font-medium border-b border-[var(--color-border-subtle)]">
                    {date}
                  </div>

                  {dayMatches.map((item, k) => {
                    const hour = item.dateObj.getHours();
                    const minute = item.dateObj
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");

                    const score1 = Number(item.score1);
                    const score2 = Number(item.score2);
                    const team1Won = score1 > score2;
                    const team2Won = score2 > score1;

                    return (
                      <div
                        key={k}
                        className="flex items-stretch border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface-elevated)] transition cursor-pointer"
                      >
                        {/* Left: Time */}
                        <div className="flex items-center justify-center w-16 border-r border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                          <div className="flex items-start">
                            <span className="text-lg font-bold leading-none">
                              {(hour % 12 || 12).toString().padStart(2, "0")}
                            </span>
                            <span className="text-[10px] font-bold ml-0.5">
                              {minute}
                            </span>
                          </div>
                        </div>

                        {/* Center: Teams + Scores */}
                        <div className="flex-1 py-2 px-3">
                          {/* Team 1 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={item.team1_logo || "/valorantLogo.png"}
                                alt={item.team1 || "Team"}
                                className="w-4 h-4 rounded-full object-contain flex-shrink-0"
                              />
                              <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                                {item.team1}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {team1Won && (
                                <span className="text-[var(--color-success)] text-[9px] font-bold">
                                  WIN
                                </span>
                              )}
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {score1}
                              </span>
                            </div>
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={item.team2_logo || "/valorantLogo.png"}
                                alt={item.team2 || "Team"}
                                className="w-4 h-4 rounded-full object-contain flex-shrink-0"
                              />
                              <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                                {item.team2}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {team2Won && (
                                <span className="text-[var(--color-success)] text-[9px] font-bold">
                                  WIN
                                </span>
                              )}
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {score2}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {pageView === "match" && (
        <section>
          {Object.entries(
            visibleResults.reduce(
              (acc, item) => {
                const dateObj = parseTimeCompleted(item.date_label);
                const dateKey = dateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });

                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push({ ...item, dateObj });
                return acc;
              },
              {} as Record<string, (MatchResult & { dateObj: Date })[]>,
            ),
          ).map(([date, matches], i) => (
            <div key={i} className="mb-6">
              {/* Date Header */}
              <h2 className="text-[var(--color-text-primary)] text-lg font-bold px-4 py-3 bg-[var(--color-bg-surface)] rounded-t-lg border-t border-l border-r border-[var(--color-border-default)]">
                {date}
              </h2>

              {/* Column Headers */}
              <div className="hidden sm:flex justify-between items-center px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border-b border-[var(--color-border-subtle)]">
                <div className="w-20 text-center">Time</div>
                <div className="flex-1 text-left pl-2">Teams</div>
                <div className="w-35 text-left">Score</div>
                <div className="min-w-[34%] text-right">Tournament</div>
                <div className="w-10"></div>
              </div>

              {/* Results under this date */}
              {matches.map((item, j) => {
                const hour = item.dateObj.getHours();
                const minute = item.dateObj
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                const score1 = Number(item.score1);
                const score2 = Number(item.score2);

                const team1Won = score1 > score2;
                const team2Won = score2 > score1;

                return (
                  <div
                    key={j}
                    className="flex items-center gap-4 px-4 py-3 bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition border-b border-[var(--color-border-subtle)]"
                  >
                    {/* Left: Time */}
                    <div className="relative flex items-start justify-center flex-shrink-0 w-20 h-12 text-center">
                      <span className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">
                        {(hour % 12 || 12).toString().padStart(2, "0")}
                      </span>
                      <span className="absolute top-0 right-0 text-base font-semibold text-[var(--color-text-muted)] -translate-y-1">
                        {minute}
                      </span>
                    </div>

                    {/* Center: Teams */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.team1_logo || "/valorantLogo.png"}
                          alt={item.team1 || "Team"}
                          className="h-7 w-7 rounded-full object-contain flex-shrink-0"
                        />
                        <span
                          className={`text-[15px] truncate ${
                            team1Won
                              ? "font-bold text-[var(--color-text-primary)]"
                              : "font-medium text-[var(--color-text-muted)]"
                          }`}
                        >
                          {item.team1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={item.team2_logo || "/valorantLogo.png"}
                          alt={item.team2 || "Team"}
                          className="h-7 w-7 rounded-full object-contain flex-shrink-0"
                        />
                        <span
                          className={`text-[15px] truncate ${
                            team2Won
                              ? "font-bold text-[var(--color-text-primary)]"
                              : "font-medium text-[var(--color-text-muted)]"
                          }`}
                        >
                          {item.team2}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="w-28 flex-shrink-0">
                      <div className="text-sm font-semibold leading-6">
                        <span
                          className={
                            team1Won
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-text-muted)]"
                          }
                        >
                          {team1Won ? "WIN" : team2Won ? "LOSS" : "-"}
                        </span>{" "}
                        <span
                          className={
                            team1Won
                              ? "text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-muted)]"
                          }
                        >
                          {score1}
                        </span>
                      </div>
                      <div className="text-sm font-semibold leading-6">
                        <span
                          className={
                            team2Won
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-text-muted)]"
                          }
                        >
                          {team2Won ? "WIN" : team1Won ? "LOSS" : "-"}
                        </span>{" "}
                        <span
                          className={
                            team2Won
                              ? "text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-muted)]"
                          }
                        >
                          {score2}
                        </span>
                      </div>
                    </div>

                    {/* Tournament */}
                    <div className="min-w-[34%] flex justify-end pr-2">
                      <div className="flex items-center justify-end gap-3 max-w-full">
                        <div className="min-w-0 text-right">
                          <div className="text-[15px] font-semibold text-[var(--color-text-secondary)] truncate">
                            {item.match_event}
                          </div>
                          <div className="text-sm text-[var(--color-text-muted)] truncate">
                            {item.match_series}
                          </div>
                        </div>
                        <img
                          src={item.tournament_logo || "/valorantLogo.png"}
                          alt={item.match_event || "Tournament"}
                          className="w-10 h-10 object-contain opacity-90 flex-shrink-0"
                        />
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-shrink-0 w-10" aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          ))}

          {visibleCount < sortedResults.length && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(
                      current + RESULTS_PAGE_BATCH_SIZE,
                      sortedResults.length
                    )
                  )
                }
                className="btn-tab"
              >
                Load More Results
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
