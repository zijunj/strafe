"use client";

import Link from "next/link";
import useValorantApiWithCache from "@/app/api/Valorant";
import type {
  TournamentBracketRound,
  TournamentDetail,
  TournamentFeaturedMatch,
  TournamentMatchSummary,
  TournamentNewsItem,
  TournamentStatsSummaryItem,
} from "@/lib/tournaments/types";

interface Props {
  id: string;
  slug: string;
}

function formatMatchDate(dateString: string | null) {
  if (!dateString) {
    return "TBD";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMatchDay(dateString: string | null) {
  if (!dateString) {
    return "TBD";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  switch (status) {
    case "live":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    case "finished":
      return "Finished";
    default:
      return status;
  }
}

function NewsCard({ item }: { item: TournamentNewsItem }) {
  return (
    <a
      href={item.url_path}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4 transition-colors hover:bg-[var(--color-bg-surface-elevated)]"
    >
      <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
        Latest News
      </p>
      <h3 className="mt-3 text-sm font-bold leading-6 text-[var(--color-text-primary)]">
        {item.title}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--color-text-muted)]">
        {item.description}
      </p>
      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        {item.date} • {item.author}
      </p>
    </a>
  );
}

function MatchPill({
  match,
  compact = false,
}: {
  match: TournamentMatchSummary;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/matches/${match.vlrMatchId}/${match.slug}`}
      className={`block rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] transition-colors hover:bg-[var(--color-bg-surface-elevated)] ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            {formatStatus(match.status)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {match.eventSeries}
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatMatchDay(match.scheduledAt)}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={match.team1Logo}
              alt={match.team1}
              className="h-7 w-7 object-contain"
            />
            <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {match.team1}
            </span>
          </div>
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {match.score1 || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={match.team2Logo}
              alt={match.team2}
              className="h-7 w-7 object-contain"
            />
            <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {match.team2}
            </span>
          </div>
          <span className="text-sm font-bold text-[var(--color-text-primary)]">
            {match.score2 || "-"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        {formatMatchDate(match.scheduledAt)}
      </p>
    </Link>
  );
}

function FeaturedMatchCard({
  match,
}: {
  match: TournamentFeaturedMatch | null;
}) {
  if (!match) {
    return (
      <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          No event matches are available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
      <div className="border-b border-[var(--color-border-default)] bg-[linear-gradient(90deg,rgba(210,255,77,0.12),rgba(255,255,255,0.02))] px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
              {match.emphasisLabel}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
              {match.eventSeries}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatMatchDate(match.scheduledAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex items-center gap-4">
          <img
            src={match.team1Logo}
            alt={match.team1}
            className="h-14 w-14 object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-[var(--color-text-primary)]">
              {match.team1}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {match.score1 || (match.status === "upcoming" ? "TBD" : "-")}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {formatStatus(match.status)}
          </p>
          <p className="mt-1 text-3xl font-black text-[var(--color-text-primary)]">
            VS
          </p>
        </div>

        <div className="flex items-center justify-start gap-4 md:justify-end">
          <div className="min-w-0 text-left md:text-right">
            <p className="truncate text-lg font-bold text-[var(--color-text-primary)]">
              {match.team2}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {match.score2 || (match.status === "upcoming" ? "TBD" : "-")}
            </p>
          </div>
          <img
            src={match.team2Logo}
            alt={match.team2}
            className="h-14 w-14 object-contain"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-6 py-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          {match.dateLabel || formatMatchDate(match.scheduledAt)}
        </p>
        <Link
          href={`/matches/${match.vlrMatchId}/${match.slug}`}
          className="text-sm font-bold text-[var(--color-primary)] transition-opacity hover:opacity-80"
        >
          Open match →
        </Link>
      </div>
    </section>
  );
}

function BracketMatchCard({
  match,
  showConnector,
}: {
  match: TournamentBracketRound["matches"][number];
  showConnector: boolean;
}) {
  return (
    <div className="relative">
      {showConnector ? (
        <div className="pointer-events-none absolute -right-6 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-[var(--color-border-default)] xl:block" />
      ) : null}
      <Link
        href={match.matchHref}
        className="block rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3 transition-colors hover:bg-[var(--color-bg-surface-elevated)]"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={match.team1Logo}
                alt={match.team1}
                className="h-5 w-5 object-contain"
              />
              <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {match.team1}
              </span>
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {match.score1 || "-"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={match.team2Logo}
                alt={match.team2}
                className="h-5 w-5 object-contain"
              />
              <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {match.team2}
              </span>
            </div>
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {match.score2 || "-"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function BracketSection({
  layout,
  rounds,
}: {
  layout: TournamentDetail["bracket"]["layout"];
  rounds: TournamentBracketRound[];
}) {
  if (rounds.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Brackets
          </h2>
        </div>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Bracket data will appear here once event matches are available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          Brackets
        </h2>
        <span className="rounded-full border border-[var(--color-border-default)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          {layout === "bracket" ? "Bracket view" : "Stage view"}
        </span>
      </div>

      {layout === "bracket" ? (
        <div className="overflow-x-auto px-6 py-6">
          <div className="flex min-w-max gap-6 xl:gap-12">
            {rounds.map((round, index) => (
              <div key={round.key} className="w-[260px] flex-none">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                  {round.title}
                </p>
                <div className="mt-4 space-y-6">
                  {round.matches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      showConnector={index < rounds.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          {rounds.map((round) => (
            <div
              key={round.key}
              className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                {round.title}
              </p>
              <div className="mt-4 space-y-3">
                {round.matches.map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    showConnector={false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatsCard({ players }: { players: TournamentStatsSummaryItem[] }) {
  if (players.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
      <div className="border-b border-[var(--color-border-default)] px-5 py-4">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
          Top Players
        </h2>
      </div>
      <div className="space-y-3 px-5 py-4">
        {players.map((player) => (
          <div
            key={`${player.playerName}-${player.teamName}`}
            className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                  {player.playerName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {player.teamName}
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--color-primary)]">
                {player.rating?.toFixed(2) ?? "-"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TournamentDetailClient({ id, slug }: Props) {
  const { data, loading, error } = useValorantApiWithCache<TournamentDetail>({
    key: `tournament-detail-${id}`,
    url: `/api/tournaments/${id}/${slug}`,
    parse: (response) => response.data as TournamentDetail,
  });

  if (loading && !data?.event) {
    return (
      <div className="page-shell text-[var(--color-text-primary)]">
        Loading...
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="page-shell">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6 text-[var(--color-text-primary)]">
          Tournament details could not be loaded.
        </div>
      </div>
    );
  }

  const upcomingMatches = data.matches
    .filter((match) => match.status === "live" || match.status === "upcoming")
    .slice(0, 6);
  const latestNews = data.news.slice(0, 3);

  return (
    <div className="page-shell">
      <div className="relative overflow-hidden rounded-[28px] px-6 pb-2 text-[var(--color-text-primary)] md:px-8">
        <div className="absolute -right-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[rgba(210,255,77,0.08)] blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
              <img
                src={data.event.thumb}
                alt={data.event.title}
                className="h-12 w-12 object-contain"
              />
            </div>
            <div className="flex min-h-20 items-center">
              <h1 className="max-w-4xl text-3xl font-black leading-tight md:text-4xl">
                {data.event.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
            <div className="border-b border-[var(--color-border-default)] px-5 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                Tournament Information
              </h2>
            </div>
            <div className="space-y-5 px-5 py-5 text-sm text-[var(--color-text-primary)]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Region
                  </p>
                  <p className="mt-1 font-semibold">{data.event.region}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Dates
                  </p>
                  <p className="mt-1 font-semibold">{data.event.dates}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Prize Pool
                  </p>
                  <p className="mt-1 font-semibold">{data.event.prize}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Status
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatStatus(data.event.status)}
                  </p>
                </div>
              </div>
            </div>
            {data.event.urlPath ? (
              <div className="border-t border-[var(--color-border-default)] p-4">
                <a
                  href={
                    data.event.urlPath.startsWith("http")
                      ? data.event.urlPath
                      : `https://www.vlr.gg${data.event.urlPath}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-[var(--color-primary)] px-4 py-3 text-center text-sm font-bold text-[var(--color-primary)] transition-opacity hover:opacity-80"
                >
                  Open on VLR →
                </a>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
            <div className="border-b border-[var(--color-border-default)] px-5 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                Upcoming Matches
              </h2>
            </div>
            <div className="space-y-3 px-4 py-4">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => (
                  <MatchPill key={match.id} match={match} compact />
                ))
              ) : (
                <p className="px-1 text-sm text-[var(--color-text-muted)]">
                  No live or upcoming matches for this event yet.
                </p>
              )}
            </div>
          </section>

          <StatsCard players={data.statsSummary} />
        </div>

        <div className="space-y-6">
          <FeaturedMatchCard match={data.featuredMatch} />
          <BracketSection
            layout={data.bracket.layout}
            rounds={data.bracket.rounds}
          />
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
            <div className="border-b border-[var(--color-border-default)] px-5 py-4">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                Latest News
              </h2>
            </div>
            <div className="space-y-4 px-4 py-4">
              {latestNews.length > 0 ? (
                latestNews.map((item) => (
                  <NewsCard key={item.url_path} item={item} />
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No recent news articles were available for this event.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
