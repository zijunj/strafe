"use client";

import useValorantApiWithCache from "../app/api/Valorant";
import parseTimeCompleted from "../app/utils/apiFunctions";

interface ResultsProps {
  pageView: string;
}

interface MatchResult {
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  flag1: string;
  flag2: string;
  time_completed: string;
  round_info: string;
  tournament_name: string;
  match_page: string;
  tournament_icon: string;
}

export default function Results({ pageView }: ResultsProps) {
  const { data: resultData, loading } = useValorantApiWithCache<MatchResult[]>({
    key: "results",
    url: `match?q=results`,
    parse: (res) => res.data?.segments || [],
  });

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
            resultData.slice(0, 10).reduce((acc, item) => {
              const tourneyKey = item.tournament_name;
              if (!acc[tourneyKey]) acc[tourneyKey] = [];
              acc[tourneyKey].push(item);
              return acc;
            }, {} as Record<string, MatchResult[]>),
          ).map(([tournament, matches], i) => (
            <div key={i}>
              {/* Tournament Header */}
              <div className="flex items-center px-3 py-2 bg-[var(--color-bg-surface-elevated)] border-b border-[var(--color-border-subtle)]">
                <img
                  src={matches[0].tournament_icon}
                  alt=""
                  className="w-4 h-4 mr-2 opacity-70"
                />
                <span className="label text-[var(--color-text-primary)] truncate">
                  {tournament}
                </span>
              </div>

              {/* Group matches by date inside each tournament */}
              {Object.entries(
                matches.reduce((acc, item) => {
                  const dateObj = parseTimeCompleted(item.time_completed);
                  const dateKey = dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push({ ...item, dateObj });
                  return acc;
                }, {} as Record<string, (MatchResult & { dateObj: Date })[]>),
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
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                              {item.team1}
                            </span>
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
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                              {item.team2}
                            </span>
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
            resultData.slice(0, 10).reduce((acc, item) => {
              const dateObj = parseTimeCompleted(item.time_completed);
              const dateKey = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push({ ...item, dateObj });
              return acc;
            }, {} as Record<string, (MatchResult & { dateObj: Date })[]>),
          ).map(([date, matches], i) => (
            <div key={i} className="mb-6">
              {/* Date Header */}
              <h2 className="text-[var(--color-text-secondary)] text-lg font-semibold px-3 py-2 bg-[var(--color-bg-card)] rounded-t-lg">
                {date}
              </h2>

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
                    className="flex justify-between items-center p-3 bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition border-b border-[var(--color-border-subtle)] last:rounded-b-lg"
                  >
                    {/* Left: Scores */}
                    <div className="flex flex-col items-center justify-center w-12">
                      <span
                        className={`text-xl font-bold ${
                          team1Won
                            ? "text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {score1}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          team2Won
                            ? "text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {score2}
                      </span>
                    </div>

                    {/* Center: Teams */}
                    <div className="flex-1 px-4">
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.flag1}
                          alt={`${item.team1} flag`}
                          className="w-5 h-5"
                        />
                        <span
                          className={`text-sm ${
                            team1Won
                              ? "font-bold text-[var(--color-text-primary)]"
                              : "font-medium text-[var(--color-text-muted)]"
                          }`}
                        >
                          {item.team1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <img
                          src={item.flag2}
                          alt={`${item.team2} flag`}
                          className="w-5 h-5"
                        />
                        <span
                          className={`text-sm ${
                            team2Won
                              ? "font-bold text-[var(--color-text-primary)]"
                              : "font-medium text-[var(--color-text-muted)]"
                          }`}
                        >
                          {item.team2}
                        </span>
                      </div>
                    </div>

                    {/* Right: Tournament Info + Time */}
                    <div className="flex items-center space-x-4 w-60 justify-end">
                      <div className="text-right text-xs text-[var(--color-text-muted)]">
                        <div>{item.tournament_name}</div>
                        <div>{item.round_info}</div>
                      </div>
                      <img
                        src={item.tournament_icon}
                        alt="Tournament Icon"
                        className="w-8 h-8"
                      />
                      <span className="text-[var(--color-text-secondary)] text-sm">
                        {`${(hour % 12 || 12).toString().padStart(2, "0")}:${minute}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
