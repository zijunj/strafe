"use client";

import Link from "next/link";
import useValorantApiWithCache from "../app/api/Valorant";
import { getMatchStartTime } from "../app/utils/apiFunctions";

interface TournamentProps {
  pageView: string;
  tournamentView: string;
  setTournamentView?: React.Dispatch<
    React.SetStateAction<"ongoing" | "upcoming">
  >;
}

interface TournamentItem {
  id: number;
  vlr_event_id: number;
  title: string;
  status: string;
  region: string;
  thumb: string;
  dates: string;
  prize: string;
  url_path: string;
}

interface MatchItem {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  team1_logo?: string | null;
  team2_logo?: string | null;
  unix_timestamp: string;
  time_until_match: string;
}

interface TournamentTeamLogo {
  name: string;
  logo: string;
}

function TournamentMetaIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--color-text-muted)]">
      {children}
    </span>
  );
}

function getDateLabel(dates: string, mode: "start" | "end"): string {
  if (!dates) {
    return "-";
  }

  const parts = dates.split(/\s*(?:â€“|–|-)\s*/).map((part) => part.trim());

  if (parts.length === 1) {
    return parts[0];
  }

  return mode === "start" ? parts[0] : parts[parts.length - 1];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTournamentHref(tournament: TournamentItem) {
  const slug =
    tournament.url_path?.split("/").filter(Boolean)[2] ||
    slugify(tournament.title);
  return `/tournaments/${tournament.vlr_event_id}/${slug}`;
}

function getTournamentTeamLogos(matches: MatchItem[], tournamentTitle: string) {
  const seen = new Set<string>();
  const logos: TournamentTeamLogo[] = [];

  for (const match of matches) {
    if (match.match_event !== tournamentTitle) {
      continue;
    }

    const maybeAdd = (name?: string, logo?: string | null) => {
      if (!name || !logo || seen.has(name)) {
        return;
      }

      seen.add(name);
      logos.push({ name, logo });
    };

    maybeAdd(match.team1, match.team1_logo);
    maybeAdd(match.team2, match.team2_logo);

    if (logos.length >= 3) {
      break;
    }
  }

  return logos;
}

function getTournamentTeams(matches: MatchItem[], tournamentTitle: string) {
  const seen = new Set<string>();
  const teams: TournamentTeamLogo[] = [];

  for (const match of matches) {
    if (match.match_event !== tournamentTitle) {
      continue;
    }

    const maybeAdd = (name?: string, logo?: string | null) => {
      if (!name || seen.has(name)) {
        return;
      }

      seen.add(name);
      teams.push({ name, logo: logo || "/valorantLogo.png" });
    };

    maybeAdd(match.team1, match.team1_logo);
    maybeAdd(match.team2, match.team2_logo);
  }

  return teams;
}

function TournamentListRow({
  tournament,
  emphasis = false,
  dateMode = "start",
}: {
  tournament: TournamentItem;
  emphasis?: boolean;
  dateMode?: "start" | "end";
}) {
  return (
    <Link
      href={getTournamentHref(tournament)}
      className="grid grid-cols-[80px_minmax(0,1.8fr)_88px_120px_110px_28px] items-center gap-4 border-t border-[var(--color-border-subtle)] px-4 py-4 transition-colors hover:bg-[var(--color-bg-surface)]"
    >
      <div className="text-sm font-semibold text-[var(--color-text-muted)]">
        {getDateLabel(tournament.dates, dateMode)}
      </div>
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg">
          <img
            src={tournament.thumb || "/valorantLogo.png"}
            alt={tournament.title}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className="min-w-0">
          <h4
            className={`truncate text-sm ${
              emphasis
                ? "font-bold text-[var(--color-text-primary)]"
                : "font-semibold text-[var(--color-text-primary)]"
            }`}
          >
            {tournament.title}
          </h4>
        </div>
      </div>
      <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
        {tournament.region || "-"}
      </div>
      <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
        {tournament.prize || "-"}
      </div>
      <div className="text-sm font-semibold text-[var(--color-text-muted)]">
        {getDateLabel(tournament.dates, "end")}
      </div>
      <div className="text-right text-xl text-[var(--color-text-muted)]">
        {">"}
      </div>
    </Link>
  );
}

function NewsListTournamentRow({ tournament }: { tournament: TournamentItem }) {
  return (
    <Link
      href={getTournamentHref(tournament)}
      className="group flex items-center justify-between rounded-lg p-2 transition hover:bg-[var(--color-bg-surface)]"
    >
      <div className="flex items-center gap-3">
        <img
          src={tournament.thumb || "/valorantLogo.png"}
          alt={tournament.title}
          className="h-10 w-10 rounded object-contain"
        />
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">
            {tournament.title}
          </h4>
          <p className="text-xs text-[var(--color-text-muted)]">
            {tournament.region} - {tournament.dates}
          </p>
        </div>
      </div>
      <span className="text-lg text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-primary)]">
        {">"}
      </span>
    </Link>
  );
}

export default function Tournaments({
  pageView,
  tournamentView,
  setTournamentView,
}: TournamentProps) {
  const tournamentsUrl =
    pageView === "home" ? "storage/events?backgroundSync=0" : "storage/events";
  const matchesUrl =
    pageView === "home"
      ? "storage/matches?status=upcoming&backgroundSync=0"
      : "storage/matches?status=upcoming";

  const { data: tournamentData, loading } = useValorantApiWithCache<
    TournamentItem[]
  >({
    key: "tournaments-storage",
    url: tournamentsUrl,
    parse: (res) => res.data.segments,
  });

  const { data: matchData = [] } = useValorantApiWithCache<MatchItem[]>({
    key: "upcomingMatches-storage",
    url: matchesUrl,
    parse: (res) => res.data.segments,
  });

  if (loading) {
    return (
      <div className="p-4">
        <p className="body-text">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {pageView === "home" && (
        <div>
          {tournamentData?.slice(0, 1).map((tournament, i) => {
            const tournamentMatches =
              matchData?.filter((m) => m.match_event === tournament.title) ||
              [];

            return (
              <article key={i} className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]">
                  <div className="relative overflow-hidden bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]">
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-xl bg-[#3a3a3a] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white">
                        Featured Tournament
                        <span className="text-[13px]">*</span>
                      </span>
                    </div>

                    <div className="absolute right-6 top-2/3 -translate-y-1/2 text-3xl text-[var(--color-text-muted)]">
                      {">"}
                    </div>

                    <Link
                      href={getTournamentHref(tournament)}
                      className="flex items-center p-4 pr-24"
                    >
                      <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-elevated)]">
                        <img
                          src={tournament.thumb || "/valorantLogo.png"}
                          alt="logo"
                          className="h-8 w-8 object-contain"
                        />
                      </div>

                      <div>
                        <h2 className="card-title">{tournament.title}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-muted)]">
                          <span className="inline-flex items-center gap-2">
                            <TournamentMetaIcon>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-4 w-4 fill-current"
                                aria-hidden="true"
                              >
                                <path d="M12 2a6 6 0 0 0-6 6c0 4.4 6 12 6 12s6-7.6 6-12a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5.5Z" />
                              </svg>
                            </TournamentMetaIcon>
                            <span>{tournament.region}</span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <TournamentMetaIcon>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-4 w-4 fill-current"
                                aria-hidden="true"
                              >
                                <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Zm0-4H6v2h12V6Z" />
                              </svg>
                            </TournamentMetaIcon>
                            <span>{tournament.dates}</span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <TournamentMetaIcon>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-4 w-4 fill-current"
                                aria-hidden="true"
                              >
                                <path d="M18 2H6v3H3v3a4 4 0 0 0 4 4h.2A5.99 5.99 0 0 0 11 14.9V18H8v2h8v-2h-3v-3.1A5.99 5.99 0 0 0 16.8 12H17a4 4 0 0 0 4-4V5h-3V2Zm-9 8a2 2 0 0 1-2-2V7h2v3Zm8-2a2 2 0 0 1-2 2V7h2v1Z" />
                              </svg>
                            </TournamentMetaIcon>
                            <span>{tournament.prize}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                  {tournamentMatches.length > 0 && (
                    <div className="mt-4text-sm text-[var(--color-text-primary)]">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        {tournamentMatches.slice(0, 3).map((match, j) => {
                          const dateObj = new Date(match.unix_timestamp);
                          const day = dateObj.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                          });
                          const { hour, minute } = getMatchStartTime(
                            match.unix_timestamp,
                          );

                          return (
                            <div key={j} className="card overflow-hidden">
                              <h4 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
                                {match.match_series} - {day}
                              </h4>

                              <div className="flex">
                                <div
                                  className="flex w-12 flex-col items-center justify-center text-sm text-[var(--color-text-muted)]"
                                  style={{
                                    background:
                                      "linear-gradient(to bottom, #202020 50%, #181818 50%)",
                                  }}
                                >
                                  <div className="flex items-start">
                                    <span className="text-2xl leading-none">
                                      {hour.toString().padStart(2, "0")}
                                    </span>
                                    <span className="ml-[1px] text-xs">
                                      {minute}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center justify-between bg-[var(--color-bg-surface-elevated)] p-3 transition hover:bg-[var(--color-bg-card)]">
                                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                      {match.team1}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between bg-[var(--color-bg-card)] p-3 transition hover:bg-[var(--color-bg-surface-elevated)]">
                                    <span className="text-sm font-medium text-[var(--color-text-muted)]">
                                      {match.team2}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                      Valorant Tournaments
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between bg-[var(--color-bg-surface)] px-4 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Ongoing
                      </p>
                      <Link
                        href="/tournaments"
                        className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)] transition-opacity hover:opacity-80"
                      >
                        View all ongoing tournaments
                      </Link>
                    </div>

                    <div>
                      {tournamentData
                        ?.filter((item) => item.status === "ongoing")
                        .slice(0, 3)
                        .map((item) => (
                          <TournamentListRow
                            key={`ongoing-${item.title}`}
                            tournament={item}
                            emphasis
                            dateMode="start"
                          />
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Upcoming
                      </p>
                      <Link
                        href="/tournaments?tab=upcoming"
                        className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)] transition-opacity hover:opacity-80"
                      >
                        View all upcoming tournaments
                      </Link>
                    </div>

                    <div className="bg-[var(--color-bg-card)]">
                      {tournamentData
                        ?.filter((item) => item.status === "upcoming")
                        .slice(0, 3)
                        .map((item) => (
                          <TournamentListRow
                            key={`upcoming-${item.title}`}
                            tournament={item}
                            dateMode="start"
                          />
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Finished
                      </p>
                    </div>

                    <div className="bg-[var(--color-bg-card)]">
                      {tournamentData
                        ?.filter((item) => item.status === "finished")
                        .slice(0, 4)
                        .map((item) => (
                          <TournamentListRow
                            key={`finished-${item.title}`}
                            tournament={item}
                            dateMode="end"
                          />
                        ))}
                    </div>
                  </div>
                </section>
              </article>
            );
          })}
        </div>
      )}

      {pageView === "tournament" && (
        <div className="card-elevated">
          <div className="card-header">
            <h2 className="card-title">Current Valorant Esports Tournaments</h2>
          </div>

          {(() => {
            const filtered = tournamentData?.filter((t) =>
              tournamentView === "upcoming"
                ? t.status === "upcoming"
                : t.status === "ongoing",
            );

            if (!filtered || filtered.length === 0) {
              return (
                <div className="card-body text-center">
                  <p className="body-text">
                    No {tournamentView} tournaments planned.{" "}
                    <button
                      onClick={() => {
                        setTournamentView?.("ongoing");
                      }}
                      className="link-accent"
                    >
                      View{" "}
                      {tournamentView === "upcoming" ? "ongoing" : "upcoming"}
                    </button>
                  </p>
                </div>
              );
            }

            return (
              <div className="overflow-x-hidden">
                <div className="min-w-0">
                  {filtered.map((tournament, i) =>
                    (() => {
                      const teams = getTournamentTeams(
                        matchData,
                        tournament.title,
                      );
                      const visibleTeams = teams.slice(0, 3);
                      const remainingTeams = Math.max(
                        teams.length - visibleTeams.length,
                        0,
                      );

                      return (
                        <Link
                          key={i}
                          href={getTournamentHref(tournament)}
                          className="grid min-h-[88px] grid-cols-[56px_minmax(0,2.2fr)_54px_82px_100px_172px] items-center border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-elevated)] transition-colors hover:bg-[var(--color-bg-card)]"
                        >
                          <div className="flex h-full items-center justify-center border-r border-[var(--color-border-default)]">
                            <img
                              src="/valorantLogo.png"
                              alt="Valorant logo"
                              className="h-8 w-8 object-contain opacity-65 grayscale brightness-90 contrast-125"
                            />
                          </div>

                          <div className="flex min-w-0 items-center gap-3 px-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded">
                              <img
                                src={tournament.thumb || "/valorantLogo.png"}
                                alt={tournament.title}
                                className="h-8 w-8 object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-[15px] font-bold leading-5 text-[var(--color-text-primary)]">
                                {tournament.title}
                              </h3>
                              <p className="mt-1 truncate text-sm leading-5 text-[var(--color-text-muted)]">
                                Valorant
                              </p>
                            </div>
                          </div>

                          <div className="border-l border-[var(--color-border-default)] px-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                            {tournament.region || "-"}
                          </div>

                          <div className="border-l border-[var(--color-border-default)] px-1 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                            {tournament.prize || "-"}
                          </div>

                          <div className="border-l border-[var(--color-border-default)] px-1 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                            {tournament.dates}
                          </div>

                          <div className="border-l border-[rgba(255,255,255,0.14)] pl-3 pr-3">
                            <div className="flex items-center justify-start gap-2">
                              {visibleTeams.length > 0
                                ? visibleTeams.map((team) => (
                                    <img
                                      key={`${tournament.title}-${team.name}`}
                                      src={team.logo}
                                      alt={team.name}
                                      className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] object-contain p-1"
                                    />
                                  ))
                                : [
                                    <div
                                      key="placeholder-1"
                                      className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                                    />,
                                    <div
                                      key="placeholder-2"
                                      className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                                    />,
                                    <div
                                      key="placeholder-3"
                                      className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                                    />,
                                  ]}
                              {remainingTeams > 0 ? (
                                <span className="ml-1 text-sm font-bold text-[var(--color-text-muted)]">
                                  +{remainingTeams}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      );
                    })(),
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {pageView === "news" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tournaments</h2>
          </div>

          <div className="card-body space-y-6">
            <div>
              <h3 className="label mb-3">Ongoing</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "ongoing")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <NewsListTournamentRow
                      key={`ongoing-${i}`}
                      tournament={tournament}
                    />
                  ))}
              </div>
            </div>

            <div>
              <h3 className="label mb-3">Upcoming</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "upcoming")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <NewsListTournamentRow
                      key={`upcoming-${i}`}
                      tournament={tournament}
                    />
                  ))}
              </div>
            </div>

            <div>
              <h3 className="label mb-3">Finished</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "finished")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <NewsListTournamentRow
                      key={`finished-${i}`}
                      tournament={tournament}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
