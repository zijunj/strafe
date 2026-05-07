"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface MatchPreviewSectionProps {
  matchId: number;
  team1: string;
  team2: string;
  eventTitle: string;
  matchSeries: string;
  displayDate: string;
  startTime: string;
  hasFinishedScore: boolean;
  team1Score?: string;
  team2Score?: string;
}

type PreviewState =
  | {
      status: "loading" | "success" | "error";
      answer: string;
      source?: string;
      debug?: MatchPreviewDebug | null;
    };

interface PreviewPlayerDebug {
  player: string;
  rating: number;
  acs: number;
  kd: number;
  adr: number;
  roundsPlayed: number;
}

interface TeamPreviewDebug {
  teamName: string;
  timespanDays: 30 | 60 | 90 | "all";
  source?: "recent_matches";
  sampleMatchCount?: number;
  topRatedPlayer?: PreviewPlayerDebug | null;
  topAcsPlayer?: PreviewPlayerDebug | null;
  averageTop3Rating?: number | null;
  averageTop3Acs?: number | null;
}

interface MatchPreviewDebug {
  matchContext?: {
    eventTitle?: string;
    eventSeries?: string;
    displayDate?: string;
    startTime?: string;
    headToHeadSummary?: {
      team1Wins: number;
      team2Wins: number;
      draws: number;
    };
  } | null;
  stakes?: {
    isPlayoff: boolean;
    roundTitle?: string | null;
    stakesSummary?: string;
    winnerPath?: string | null;
    loserPath?: string | null;
    inferredFromBracket?: boolean;
  } | null;
  team1Form?: TeamPreviewDebug | null;
  team2Form?: TeamPreviewDebug | null;
  fallbackReason?: string;
}

interface MatchPreviewResponse {
  answer?: string;
  source?: string;
  debug?: MatchPreviewDebug;
}

function renderInlinePreviewText(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    const boldMatch = segment.match(/^\*\*(.+)\*\*$/);

    if (boldMatch) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-white">
          {boldMatch[1]}
        </strong>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function renderPreviewParagraphs(answer: string) {
  const paragraphs = answer
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const normalizedParagraphs =
    paragraphs.length > 0 ? paragraphs : [answer.trim()].filter(Boolean);

  return normalizedParagraphs.map((paragraph, index) => (
    <p key={`${paragraph.slice(0, 32)}-${index}`} className="leading-7 text-[15px] text-gray-200">
      {renderInlinePreviewText(paragraph)}
    </p>
  ));
}

function buildHeadToHeadText(
  debug: MatchPreviewDebug,
  team1: string,
  team2: string
) {
  const summary = debug.matchContext?.headToHeadSummary;

  if (!summary) {
    return "No recent head-to-head data";
  }

  return `${team1} ${summary.team1Wins} - ${summary.team2Wins} ${team2}`;
}

function buildPlayerSpotlight(teamForm?: TeamPreviewDebug | null) {
  if (!teamForm?.topRatedPlayer) {
    return "No player form found";
  }

  const player = teamForm.topRatedPlayer;
  return `${player.player}: ${player.rating} rating, ${player.acs} ACS`;
}

function PreviewInsightCard(props: {
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#343434] bg-[#181818] px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
        {props.label}
      </p>
      <div className="mt-2 text-sm font-medium text-gray-100">{props.value}</div>
      {props.secondary ? (
        <div className="mt-1 text-xs leading-5 text-gray-400">{props.secondary}</div>
      ) : null}
    </div>
  );
}

function buildLocalFallbackPreview(props: MatchPreviewSectionProps) {
  const whenLabel = props.startTime
    ? `${props.displayDate} at ${props.startTime}`
    : props.displayDate;

  return `${props.team1} vs ${props.team2} will be played on ${whenLabel}. This is a ${props.matchSeries} match in ${props.eventTitle}.`;
}

function buildRecap(props: MatchPreviewSectionProps) {
  return `${props.team1} vs ${props.team2} finished ${props.team1Score ?? ""} - ${props.team2Score ?? ""} in ${props.eventTitle}. This was a ${props.matchSeries} match.`;
}

export default function MatchPreviewSection(
  props: MatchPreviewSectionProps
) {
  const localFallback = useMemo(() => buildLocalFallbackPreview(props), [props]);
  const recapText = useMemo(() => buildRecap(props), [props]);
  const [preview, setPreview] = useState<PreviewState>({
    status: "loading",
    answer: localFallback,
  });

  useEffect(() => {
    if (props.hasFinishedScore) {
      return;
    }

    const controller = new AbortController();

    setPreview({
      status: "loading",
      answer: localFallback,
    });

    async function loadPreview() {
      try {
        const response = await fetch("/api/ai/match-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchId: props.matchId,
            team1: props.team1,
            team2: props.team2,
            eventTitle: props.eventTitle,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Preview request failed with ${response.status}`);
        }

        const payload = (await response.json()) as MatchPreviewResponse;
        const answer = payload.answer?.trim();

        if (!answer) {
          throw new Error("Preview response was empty.");
        }

        setPreview({
          status: "success",
          answer,
          source: payload.source,
          debug: payload.debug ?? null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load match preview:", error);

        setPreview({
          status: "error",
          answer: localFallback,
          source: "fallback",
        });
      }
    }

    void loadPreview();

    return () => {
      controller.abort();
    };
  }, [
    localFallback,
    props.eventTitle,
    props.hasFinishedScore,
    props.matchId,
    props.team1,
    props.team2,
  ]);

  return (
    <div className="bg-[#202020] p-4 rounded-lg">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="font-semibold">
          {props.hasFinishedScore ? "Match Recap" : "Match Preview"}
        </h3>
        {!props.hasFinishedScore && preview.status === "loading" ? (
          <span className="text-xs uppercase tracking-wide text-yellow-300">
            Generating preview...
          </span>
        ) : null}
      </div>

      {props.hasFinishedScore ? (
        <p className="text-gray-300 text-sm leading-relaxed">{recapText}</p>
      ) : preview.status === "loading" ? (
        <div
          aria-label="Loading match preview"
          className="space-y-2"
        >
          <div className="h-4 w-full animate-pulse rounded bg-[#303030]" />
          <div className="h-4 w-[92%] animate-pulse rounded bg-[#303030]" />
          <div className="h-4 w-[78%] animate-pulse rounded bg-[#303030]" />
        </div>
      ) : (
        <div className="space-y-4">
          {preview.debug ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <PreviewInsightCard
                label="Stakes"
                value={preview.debug.stakes?.roundTitle || props.matchSeries}
                secondary={
                  preview.debug.stakes?.stakesSummary ||
                  "Match importance not inferred yet."
                }
              />
              <PreviewInsightCard
                label="Head-to-Head"
                value={buildHeadToHeadText(preview.debug, props.team1, props.team2)}
                secondary={
                  preview.debug.stakes?.winnerPath ||
                  "No bracket path inferred."
                }
              />
              <PreviewInsightCard
                label={`${props.team1} Form`}
                value={buildPlayerSpotlight(preview.debug.team1Form)}
                secondary={
                  preview.debug.team1Form?.averageTop3Rating !== undefined &&
                  preview.debug.team1Form?.averageTop3Acs !== undefined
                    ? `Top 3 avg: ${preview.debug.team1Form.averageTop3Rating ?? "N/A"} rating, ${preview.debug.team1Form.averageTop3Acs ?? "N/A"} ACS`
                    : "No recent stored form"
                }
              />
              <PreviewInsightCard
                label={`${props.team2} Form`}
                value={buildPlayerSpotlight(preview.debug.team2Form)}
                secondary={
                  preview.debug.team2Form?.averageTop3Rating !== undefined &&
                  preview.debug.team2Form?.averageTop3Acs !== undefined
                    ? `Top 3 avg: ${preview.debug.team2Form.averageTop3Rating ?? "N/A"} rating, ${preview.debug.team2Form.averageTop3Acs ?? "N/A"} ACS`
                    : "No recent stored form"
                }
              />
            </div>
          ) : null}

          <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-4">
            <div className="space-y-3">{renderPreviewParagraphs(preview.answer)}</div>
          </div>
        </div>
      )}

      {!props.hasFinishedScore && preview.status === "error" ? (
        <p className="mt-3 text-xs text-gray-500">
          Preview fallback shown from stored match details while AI data is
          unavailable.
        </p>
      ) : null}

      {!props.hasFinishedScore && preview.debug ? (
        <details className="mt-4 rounded-md border border-[#343434] bg-[#181818]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-200">
            <span>Preview Debug</span>
            <span className="text-xs font-normal uppercase tracking-wide text-gray-400">
              {preview.source ?? "unknown source"}
            </span>
          </summary>

          <div className="border-t border-[#2a2a2a] px-3 py-3 text-xs text-gray-300 space-y-4">
            {preview.debug.fallbackReason ? (
              <p className="text-yellow-300">
                Fallback reason: {preview.debug.fallbackReason}
              </p>
            ) : null}

            {preview.debug.matchContext ? (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Match Context
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>Event: {preview.debug.matchContext.eventTitle ?? "N/A"}</p>
                  <p>Stage: {preview.debug.matchContext.eventSeries ?? "N/A"}</p>
                  <p>Date: {preview.debug.matchContext.displayDate ?? "N/A"}</p>
                  <p>Time: {preview.debug.matchContext.startTime ?? "N/A"}</p>
                  <p className="sm:col-span-2">
                    H2H summary:{" "}
                    {preview.debug.matchContext.headToHeadSummary
                      ? `${props.team1} ${preview.debug.matchContext.headToHeadSummary.team1Wins} - ${preview.debug.matchContext.headToHeadSummary.team2Wins} ${props.team2} (${preview.debug.matchContext.headToHeadSummary.draws} draws)`
                      : "No H2H summary"}
                  </p>
                </div>
              </div>
            ) : null}

            {preview.debug.stakes ? (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Stakes
                </p>
                <div className="space-y-2">
                  <p>
                    Playoff: {preview.debug.stakes.isPlayoff ? "yes" : "no"}
                  </p>
                  {preview.debug.stakes.roundTitle ? (
                    <p>Round: {preview.debug.stakes.roundTitle}</p>
                  ) : null}
                  {preview.debug.stakes.stakesSummary ? (
                    <p>Summary: {preview.debug.stakes.stakesSummary}</p>
                  ) : null}
                  {preview.debug.stakes.winnerPath ? (
                    <p>Winner path: {preview.debug.stakes.winnerPath}</p>
                  ) : null}
                  {preview.debug.stakes.loserPath ? (
                    <p>Loser path: {preview.debug.stakes.loserPath}</p>
                  ) : null}
                  <p>
                    Bracket inference:{" "}
                    {preview.debug.stakes.inferredFromBracket ? "yes" : "no"}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              {[preview.debug.team1Form, preview.debug.team2Form].map(
                (teamForm, index) => (
                  <div
                    key={teamForm?.teamName ?? `team-debug-${index}`}
                    className="rounded-md border border-[#2f2f2f] bg-[#202020] p-3"
                  >
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      {teamForm?.teamName ?? (index === 0 ? props.team1 : props.team2)} form
                    </p>

                    {teamForm ? (
                      <div className="space-y-2">
                        <p>
                          Source:{" "}
                          {`recent stored matches${teamForm.sampleMatchCount ? ` (${teamForm.sampleMatchCount})` : ""}`}
                        </p>
                        <p>
                          Timespan:{" "}
                          {teamForm.timespanDays === "all"
                            ? "all"
                            : `${teamForm.timespanDays} days`}
                        </p>
                        <p>
                          Top 3 averages:{" "}
                          {teamForm.averageTop3Rating ?? "N/A"} rating,{" "}
                          {teamForm.averageTop3Acs ?? "N/A"} ACS
                        </p>
                        <p>
                          Top rated:{" "}
                          {teamForm.topRatedPlayer
                            ? `${teamForm.topRatedPlayer.player} (${teamForm.topRatedPlayer.rating} rating, ${teamForm.topRatedPlayer.kd} K/D${teamForm.topRatedPlayer.adr !== null ? `, ${teamForm.topRatedPlayer.adr} ADR` : ""})`
                            : "No player data"}
                        </p>
                        <p>
                          Top ACS:{" "}
                          {teamForm.topAcsPlayer
                            ? `${teamForm.topAcsPlayer.player} (${teamForm.topAcsPlayer.acs} ACS, ${teamForm.topAcsPlayer.roundsPlayed} rounds)`
                            : "No player data"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No recent team-form stats found.</p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
