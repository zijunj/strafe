"use client";

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
  unix_timestamp: string;
  time_until_match: string;
}

export default function Tournaments({
  pageView,
  tournamentView,
  setTournamentView,
}: TournamentProps) {
  const { data: tournamentData, loading } = useValorantApiWithCache<
    TournamentItem[]
  >({
    key: "tournaments",
    url: "events",
    parse: (res) => res.data.segments,
  });

  const { data: matchData = [] } = useValorantApiWithCache<MatchItem[]>({
    key: `upcomingMatches`,
    url: `match?q=upcoming`,
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
        <div className="">
          {tournamentData?.slice(0, 1).map((tournament, i) => {
            const tournamentMatches =
              matchData?.filter((m) => m.match_event === tournament.title) ||
              [];

            return (
              <article key={i}>
                {/* Tournament Header */}
                <div className="flex items-center justify-between bg-[var(--color-bg-surface)] rounded-t-lg overflow-hidden">
                  {/* Left: Logo + Info */}
                  <div className="flex items-center p-4">
                    <div className="w-14 h-14 bg-[var(--color-bg-surface-elevated)] rounded-lg flex items-center justify-center mr-4 border border-[var(--color-border-subtle)]">
                      <img
                        src={tournament.thumb || "/valorantLogo.png"}
                        alt="logo"
                        className="w-8 h-8 object-contain"
                      />
                    </div>

                    <div>
                      <h2 className="card-title">
                        {tournament.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-1">
                        <span>{tournament.region}</span>
                        <span>{tournament.dates}</span>
                        <span>{tournament.prize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge */}
                  <div className="px-4">
                    <span className="badge-secondary">
                      Featured Tournament
                    </span>
                  </div>
                </div>

                {/* Matches for this tournament */}
                {tournamentMatches.length > 0 && (
                  <div className="mt-4 rounded-lg text-sm text-[var(--color-text-primary)]">
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
                          <div
                            key={j}
                            className="card overflow-hidden"
                          >
                            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-3 py-2 border-b border-[var(--color-border-subtle)]">
                              {match.match_series} • {day}
                            </h4>

                            <div className="flex">
                              <div
                                className="flex flex-col justify-center items-center text-[var(--color-text-muted)] text-sm w-12"
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
                                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition">
                                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                    {match.team1}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-surface-elevated)] transition">
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
              </article>
            );
          })}
        </div>
      )}

      {pageView === "tournament" && (
        <div className="card-elevated">
          <div className="card-header">
            <h2 className="card-title">
              Current Valorant Esports Tournaments
            </h2>
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
              <div className="overflow-x-auto">
                <div className="min-w-[920px]">
                  {filtered.map((tournament, i) => (
                    <article
                      key={i}
                      className="grid grid-cols-[72px_minmax(0,1.9fr)_72px_126px_134px_150px] items-center min-h-[88px] border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-elevated)] hover:bg-[var(--color-bg-card)] transition-colors"
                    >
                      <div className="flex h-full items-center justify-center border-r border-[var(--color-border-default)]">
                        <img
                          src="/valorantLogo.png"
                          alt="Valorant logo"
                          className="h-9 w-9 object-contain opacity-65 grayscale brightness-90 contrast-125"
                        />
                      </div>

                      <div className="flex items-center gap-4 px-5">
                        <div className="flex h-11 w-11 items-center justify-center bg-white/95 rounded">
                          <img
                            src={tournament.thumb || "/valorantLogo.png"}
                            alt={tournament.title}
                            className="h-9 w-9 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold leading-5 text-[var(--color-text-primary)]">
                            {tournament.title}
                          </h3>
                          <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">
                            Valorant
                          </p>
                        </div>
                      </div>

                      <div className="border-l border-[var(--color-border-default)] px-4 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {tournament.region || "-"}
                      </div>

                      <div className="border-l border-[var(--color-border-default)] px-4 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                        {tournament.prize || "-"}
                      </div>

                      <div className="border-l border-[var(--color-border-default)] px-4 text-center text-xs font-semibold text-[var(--color-text-secondary)]">
                        {tournament.dates}
                      </div>

                      <div className="border-l border-[var(--color-border-default)] px-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]" />
                          <div className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]" />
                          <div className="h-9 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]" />
                        </div>
                      </div>
                    </article>
                  ))}
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
            {/* Ongoing */}
            <div>
              <h3 className="label mb-3">Ongoing</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "ongoing")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <a
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-bg-surface)] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tournament.thumb || "/valorantLogo.png"}
                          alt={tournament.title}
                          className="w-10 h-10 object-contain rounded"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                            {tournament.title}
                          </h4>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {tournament.region} • {tournament.dates}
                          </p>
                        </div>
                      </div>
                      <span className="text-[var(--color-text-muted)] text-lg group-hover:text-[var(--color-primary)] transition-colors">
                        ›
                      </span>
                    </a>
                  ))}
              </div>
            </div>

            {/* Upcoming */}
            <div>
              <h3 className="label mb-3">Upcoming</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "upcoming")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <a
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-bg-surface)] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tournament.thumb || "/valorantLogo.png"}
                          alt={tournament.title}
                          className="w-10 h-10 object-contain rounded"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                            {tournament.title}
                          </h4>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {tournament.region} • {tournament.dates}
                          </p>
                        </div>
                      </div>
                      <span className="text-[var(--color-text-muted)] text-lg group-hover:text-[var(--color-primary)] transition-colors">
                        ›
                      </span>
                    </a>
                  ))}
              </div>
            </div>

            {/* Finished */}
            <div>
              <h3 className="label mb-3">Finished</h3>
              <div className="space-y-3">
                {tournamentData
                  ?.filter((t) => t.status === "finished")
                  .slice(0, 4)
                  .map((tournament, i) => (
                    <a
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-bg-surface)] transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tournament.thumb || "/valorantLogo.png"}
                          alt={tournament.title}
                          className="w-10 h-10 object-contain rounded"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                            {tournament.title}
                          </h4>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {tournament.region} • {tournament.dates}
                          </p>
                        </div>
                      </div>
                      <span className="text-[var(--color-text-muted)] text-lg group-hover:text-[var(--color-primary)] transition-colors">
                        ›
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
