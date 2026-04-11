"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useValorantApiWithCache from "../app/api/Valorant";
import { getMatchStartTime } from "../app/utils/apiFunctions";

interface MatchProps {
  pageView: string;
  setPageView?: (view: string) => void;
  selectedTournament?: string;
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
  status?: string;
  score1?: string | null;
  score2?: string | null;
  region?: string | null;
}

interface TournamentItem {
  title: string;
  tier?: number | null;
  status: string;
  region: string;
  thumb: string;
  dates: string;
  prize: string;
  url_path: string;
}

const MATCHES_PAGE_BATCH_SIZE = 12;

function MatchRow({
  item,
  tournament,
  rowClassName,
  liveLeftColumn = false,
}: {
  item: MatchItem;
  tournament?: TournamentItem;
  rowClassName: string;
  liveLeftColumn?: boolean;
}) {
  const { hour, minute } = getMatchStartTime(item.unix_timestamp);
  const matchPath = item.match_page.replace("https://www.vlr.gg/", "");
  const [id, slug] = matchPath.split("/", 2);

  return (
    <Link
      key={id}
      href={{
        pathname: `/matches/${id}/${slug}`,
      }}
    >
      <div className={rowClassName}>
        {liveLeftColumn ? (
          <div className="flex h-12 w-20 flex-shrink-0 flex-col items-center justify-center text-center">
            <div className="mt-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff4d4f]" />
              <span>Live</span>
            </div>
          </div>
        ) : (
          <div className="relative flex items-start justify-center flex-shrink-0 w-20 h-12 text-center">
            <span className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">
              {hour.toString().padStart(2, "0")}
            </span>
            <span className="absolute top-0 right-0 text-base font-semibold text-[var(--color-text-muted)] -translate-y-1">
              {minute}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {item.status === "live" && !liveLeftColumn ? (
            <div className="mb-2 inline-flex rounded-full bg-[var(--color-primary)] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-black">
              Live
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <img
              src={item.team1_logo || "/valorantLogo.png"}
              alt={item.team1 || "Team"}
              className="h-7 w-7 rounded-full object-contain flex-shrink-0"
            />
            <span className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate">
              {item.team1}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">vs</span>
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

        <div className="min-w-[15%] text-right">
          <span className="text-sm text-[var(--color-text-muted)] truncate">
            {item.region || tournament?.region || ""}
          </span>
        </div>

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
}

export default function Matches({ pageView, selectedTournament }: MatchProps) {
  const upcomingMatchesUrl = "storage/matches?status=upcoming&backgroundSync=0";
  const liveMatchesUrl = "storage/matches?status=live&backgroundSync=0";
  const tournamentsUrl = "storage/events?backgroundSync=0";

  const { data: upcomingMatchData = [], loading: upcomingMatchesLoading } =
    useValorantApiWithCache<MatchItem[]>({
      key: "upcomingMatches-storage",
      url: upcomingMatchesUrl,
      parse: (res) => res.data.segments,
      useCache: false,
    });

  const { data: liveMatchData = [], loading: liveMatchesLoading } =
    useValorantApiWithCache<MatchItem[]>({
      key: "liveMatches-storage",
      url: liveMatchesUrl,
      parse: (res) => res.data.segments,
      useCache: false,
    });

  const { data: tournamentData = [], loading: tournamentsLoading } =
    useValorantApiWithCache<TournamentItem[]>({
      key: "tournaments-storage",
      url: tournamentsUrl,
      parse: (res) => res.data.segments,
      useCache: false,
    });

  const matchData = [...liveMatchData, ...upcomingMatchData].sort((a, b) => {
    const statusPriority = (status?: string) => {
      if (status === "live") {
        return 0;
      }

      if (status === "upcoming") {
        return 1;
      }

      return 2;
    };

    const priorityDiff = statusPriority(a.status) - statusPriority(b.status);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return (
      new Date(a.unix_timestamp).getTime() -
      new Date(b.unix_timestamp).getTime()
    );
  });
  const filteredMatchData = selectedTournament
    ? matchData.filter((match) => match.match_event === selectedTournament)
    : matchData;

  const [visibleCount, setVisibleCount] = useState(MATCHES_PAGE_BATCH_SIZE);
  const liveMatches = filteredMatchData.filter((match) => match.status === "live");
  const nonLiveMatches = filteredMatchData.filter(
    (match) => match.status !== "live",
  );
  const visibleMatchData =
    pageView === "match" ? nonLiveMatches.slice(0, visibleCount) : matchData;
  const totalMatchCount = filteredMatchData.length;

  useEffect(() => {
    if (pageView !== "match") {
      return;
    }

    setVisibleCount(MATCHES_PAGE_BATCH_SIZE);
  }, [pageView, totalMatchCount]);

  if (upcomingMatchesLoading || liveMatchesLoading || tournamentsLoading) {
    return (
      <div className="p-4">
        <p className="body-text">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {pageView === "home-live" &&
        liveMatches.length > 0 &&
        (() => {
          const item = liveMatches[0];
          const matchPath = item.match_page.replace("https://www.vlr.gg/", "");
          const [id, slug] = matchPath.split("/", 2);

          return (
            <Link
              href={{
                pathname: `/matches/${id}/${slug}`,
              }}
              className="block overflow-hidden rounded-2xl border border-[rgba(255,90,90,0.2)] bg-[linear-gradient(90deg,rgba(90,24,24,0.55),rgba(24,24,24,0.94))] shadow-[var(--shadow-card)] transition hover:border-[rgba(255,90,90,0.32)] hover:bg-[linear-gradient(90deg,rgba(110,28,28,0.62),rgba(32,32,32,0.98))]"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white">
                  <span className="h-2 w-2 rounded-full bg-[#ff4d4f]" />
                  <span>Live</span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <img
                      src={item.team1_logo || "/valorantLogo.png"}
                      alt={item.team1 || "Team"}
                      className="h-8 w-8 rounded-full object-contain flex-shrink-0"
                    />
                    <span className="truncate text-[15px] font-bold leading-tight text-[var(--color-text-primary)]">
                      {item.team1}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-[var(--color-text-primary)]">
                    <span className="text-[22px] font-black leading-none">
                      {item.score1 ?? "0"}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      -
                    </span>
                    <span className="text-[22px] font-black leading-none">
                      {item.score2 ?? "0"}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
                    <img
                      src={item.team2_logo || "/valorantLogo.png"}
                      alt={item.team2 || "Team"}
                      className="h-8 w-8 rounded-full object-contain flex-shrink-0"
                    />
                    <span className="truncate text-right text-[15px] font-bold leading-tight text-[var(--color-text-primary)]">
                      {item.team2}
                    </span>
                  </div>
                </div>

                <div className="hidden min-w-0 shrink-0 items-center gap-3 border-l border-[rgba(255,255,255,0.12)] pl-4 lg:flex">
                  <img
                    src={item.tournament_logo || "/valorantLogo.png"}
                    alt={item.match_event || "Tournament"}
                    className="h-9 w-9 object-contain opacity-90"
                  />
                  <div className="min-w-0 max-w-[250px]">
                    <div className="truncate text-[13px] font-bold leading-tight text-[var(--color-text-primary)]">
                      {item.match_event}
                    </div>
                    <div className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                      {item.match_series}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-xl text-[var(--color-text-muted)]">
                  {">"}
                </div>
              </div>
            </Link>
          );
        })()}

      {pageView === "home" && (
        <section className="max-w-7xl mx-auto">
          {Object.entries(
            nonLiveMatches
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

              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);
                const matchPath = item.match_page.replace(
                  "https://www.vlr.gg/",
                  "",
                );
                const [id, slug] = matchPath.split("/", 2);

                return (
                  <Link
                    key={`${id}-${j}`}
                    href={{
                      pathname: `/matches/${id}/${slug}`,
                    }}
                  >
                    <div className="flex items-stretch border-b border-[var(--color-border-subtle)] transition cursor-pointer hover:bg-[var(--color-bg-surface-elevated)]">
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

                      <div className="flex-1 py-2 px-3">
                        {item.status === "live" ? (
                          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[rgba(120,24,24,0.88)] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">
                            <span className="h-2 w-2 rounded-full bg-[#ff4d4f]" />
                            Live
                          </div>
                        ) : null}
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
                  </Link>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {pageView === "match" && (
        <section>
          {liveMatches.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
              <div className="border-b border-[var(--color-border-subtle)] px-5 py-4">
                <h2 className="text-[var(--color-text-primary)] text-lg font-bold">
                  Live Matches
                </h2>
              </div>

              <div className="hidden sm:flex justify-between items-center px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border-b border-[var(--color-border-subtle)]">
                <div className="w-20 text-center">Status</div>
                <div className="flex-1 text-left pl-2">Teams</div>
                <div className="min-w-[34%] text-center">Tournament</div>
                <div className="min-w-[15%] text-right">Region</div>
                <div className="w-10"></div>
              </div>

              {liveMatches.map((item) => {
                const tournament = (tournamentData ?? []).find(
                  (t) => t.title === item.match_event,
                );

                return (
                  <MatchRow
                    key={`live-${item.match_page}`}
                    item={item}
                    tournament={tournament}
                    rowClassName="flex items-center gap-4 px-4 py-3 bg-[linear-gradient(90deg,rgba(90,24,24,0.55),rgba(45,20,20,0.72))] hover:bg-[linear-gradient(90deg,rgba(110,28,28,0.62),rgba(52,23,23,0.8))] transition border-b border-[rgba(255,90,90,0.16)]"
                    liveLeftColumn
                  />
                );
              })}
            </div>
          )}

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
              <h2 className="text-[var(--color-text-primary)] text-lg font-bold px-4 py-3 bg-[var(--color-bg-surface)] rounded-t-lg border-t border-l border-r border-[var(--color-border-default)]">
                {date}
              </h2>

              <div className="hidden sm:flex justify-between items-center px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border-b border-[var(--color-border-subtle)]">
                <div className="w-20 text-center">Time</div>
                <div className="flex-1 text-left pl-2">Teams</div>
                <div className="min-w-[34%] text-center">Tournament</div>
                <div className="min-w-[15%] text-right">Region</div>
                <div className="w-10"></div>
              </div>

              {matches.map((item) => {
                const tournament = (tournamentData ?? []).find(
                  (t) => t.title === item.match_event,
                );

                return (
                  <MatchRow
                    key={item.match_page}
                    item={item}
                    tournament={tournament}
                    rowClassName="flex items-center gap-4 px-4 py-3 bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition border-b border-[var(--color-border-subtle)]"
                  />
                );
              })}
            </div>
          ))}

          {visibleCount < nonLiveMatches.length && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(
                      current + MATCHES_PAGE_BATCH_SIZE,
                      nonLiveMatches.length,
                    ),
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
