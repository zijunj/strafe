"use client";

import useValorantApiWithCache from "../app/api/Valorant";
import { getMatchStartTime } from "../app/utils/apiFunctions";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MatchProps {
  pageView: string;
  setPageView?: (view: string) => void;
}

interface MatchItem {
  match_event: string;
  match_series: string;
  match_page: string;
  team1: string;
  team2: string;
  team1_logo?: string | null;
  team2_logo?: string | null;
  tournament_logo?: string | null;
  unix_timestamp: string;
  time_until_match: string;
}

interface TournamentItem {
  title: string;
  status: string;
  region: string;
  thumb: string;
  dates: string;
  prize: string;
  url_path: string;
}

const MATCHES_PAGE_BATCH_SIZE = 12;

export default function Matches({ pageView }: MatchProps) {
  const matchesUrl = "storage/matches?status=upcoming&backgroundSync=0";
  const tournamentsUrl = "storage/events?backgroundSync=0";

  const { data: matchData = [], loading: matchesLoading } =
    useValorantApiWithCache<MatchItem[]>({
      key: "upcomingMatches-storage",
      url: matchesUrl,
      parse: (res) => res.data.segments,
    });

  const { data: tournamentData = [], loading: tournamentsLoading } =
    useValorantApiWithCache<TournamentItem[]>({
      key: "tournaments-storage",
      url: tournamentsUrl,
      parse: (res) => res.data.segments,
    });
  const [visibleCount, setVisibleCount] = useState(MATCHES_PAGE_BATCH_SIZE);
  const visibleMatchData =
    pageView === "match" ? matchData.slice(0, visibleCount) : matchData;

  useEffect(() => {
    if (pageView !== "match") {
      return;
    }

    setVisibleCount(MATCHES_PAGE_BATCH_SIZE);
  }, [matchData, pageView]);

  if (matchesLoading || tournamentsLoading) {
    return (
      <div className="p-4">
        <p className="body-text">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {pageView === "home" && (
        <section className="max-w-7xl mx-auto">
          {Object.entries(
            (visibleMatchData ?? [])
              .sort(
                (a, b) =>
                  new Date(a.unix_timestamp).getTime() -
                  new Date(b.unix_timestamp).getTime(),
              )
              .slice(0, 8)
              .reduce(
                (acc, item) => {
                  const key = item.match_event || "Other Tournament";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                },
                {} as Record<string, MatchItem[]>,
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

              {/* Matches under this tournament */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);

                return (
                  <div
                    key={j}
                    className="flex items-stretch border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-surface-elevated)] transition cursor-pointer"
                  >
                    {/* Left: Time */}
                    <div className="flex items-center justify-center w-16 border-r border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                      <div className="flex items-start">
                        <span className="text-xl font-bold leading-none">
                          {hour.toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs font-bold ml-0.5">
                          {minute}
                        </span>
                      </div>
                    </div>

                    {/* Center: Teams */}
                    <div className="flex-1 py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.team1_logo || "/valorantLogo.png"}
                            alt={item.team1 || "Team"}
                            className="h-5 w-5 rounded-full object-contain flex-shrink-0"
                          />
                          <span className="text-sm text-[var(--color-text-primary)] font-semibold truncate pr-2">
                            {item.team1}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.team2_logo || "/valorantLogo.png"}
                            alt={item.team2 || "Team"}
                            className="h-5 w-5 rounded-full object-contain flex-shrink-0"
                          />
                          <span className="text-sm text-[var(--color-text-primary)] font-semibold truncate pr-2">
                            {item.team2}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {pageView === "match" && (
        <section>
          {Object.entries(
            (visibleMatchData ?? [])
              .sort(
                (a, b) =>
                  new Date(a.unix_timestamp).getTime() -
                  new Date(b.unix_timestamp).getTime(),
              )
              .reduce(
                (acc, item) => {
                  const dateObj = new Date(item.unix_timestamp);
                  const dateKey = dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push(item);
                  return acc;
                },
                {} as Record<string, MatchItem[]>,
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
                <div className="min-w-[34%] text-center">Tournament</div>
                <div className="min-w-[15%] text-right">Region</div>
                <div className="w-10"></div>
              </div>

              {/* Matches under this date */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);

                const tournament = (tournamentData ?? []).find(
                  (t) => t.title === item.match_event,
                );

                const matchPath = item.match_page.replace(
                  "https://www.vlr.gg/",
                  "",
                );
                const [id, slug] = matchPath.split("/", 2);

                return (
                  <Link
                    key={id}
                    href={{
                      pathname: `/matches/${id}/${slug}`,
                    }}
                  >
                    <div
                      key={j}
                      className="flex items-center gap-4 px-4 py-3 bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition border-b border-[var(--color-border-subtle)]"
                    >
                      {/* Time */}
                      <div className="relative flex items-start justify-center flex-shrink-0 w-20 h-12 text-center">
                        <span className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">
                          {hour.toString().padStart(2, "0")}
                        </span>
                        <span className="absolute top-0 right-0 text-base font-semibold text-[var(--color-text-muted)] -translate-y-1">
                          {minute}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.team1_logo || "/valorantLogo.png"}
                            alt={item.team1 || "Team"}
                            className="h-7 w-7 rounded-full object-contain flex-shrink-0"
                          />
                          <span className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
                            {item.team1}
                          </span>
                          <span className="text-sm text-[var(--color-text-muted)]">
                            vs
                          </span>
                          <img
                            src={item.team2_logo || "/valorantLogo.png"}
                            alt={item.team2 || "Team"}
                            className="h-7 w-7 rounded-full object-contain flex-shrink-0"
                          />
                          <span className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
                            {item.team2}
                          </span>
                        </div>
                      </div>

                      {/* Tournament */}
                      <div className="min-w-[34%] flex justify-end">
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

                      {/* Region */}
                      <div className="min-w-[15%] text-right">
                        <span className="text-sm text-[var(--color-text-muted)] truncate">
                          {tournament?.region || ""}
                        </span>
                      </div>

                      {/* Logo */}
                      <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                        <div className="flex items-center -space-x-2">
                          <img
                            src="/valorantLogo.png"
                            alt="Valorant Logo"
                            className="w-10 h-10 object-contain opacity-65 grayscale brightness-90 contrast-125"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}

          {visibleCount < matchData.length && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(current + MATCHES_PAGE_BATCH_SIZE, matchData.length)
                  )
                }
                className="btn-tab"
              >
                Load More Matches
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
