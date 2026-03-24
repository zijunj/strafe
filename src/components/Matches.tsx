import useValorantApiWithCache from "../app/api/Valorant";
import React from "react";
import { getMatchStartTime } from "../app/utils/apiFunctions";
import Link from "next/link";
import slugify from "@/app/utils/IdFunctions";

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

export default function Matches({ pageView }: MatchProps) {
  const { data: matchData = [], loading: matchesLoading } =
    useValorantApiWithCache<MatchItem[]>({
      key: "upcomingMatches",
      url: "match?q=upcoming",
      parse: (res) => res.data.segments,
    });

  const { data: tournamentData = [], loading: tournamentsLoading } =
    useValorantApiWithCache<TournamentItem[]>({
      key: "tournaments",
      url: "events",
      parse: (res) => res.data.segments,
    });

  if (matchesLoading || tournamentsLoading) return <p>Loading...</p>;

  return (
    <>
      {pageView === "home" && (
        <section className="max-w-7xl mx-auto">
          {Object.entries(
            (matchData ?? [])
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
              <div className="flex items-center px-3 py-2 bg-[#252525] border-b border-[#2e2e2e]">
                <span className="text-xs font-bold text-white truncate">
                  {tournament}
                </span>
              </div>

              {/* Matches under this tournament */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);
                const timeString = `${hour.toString().padStart(2, "0")}:${minute}`;

                return (
                  <div
                    key={j}
                    className="flex items-stretch border-b border-[#2e2e2e] hover:bg-[#252525] transition cursor-pointer"
                  >
                    {/* Left: Time - Hour large, minutes small */}
                    <div className="flex items-center justify-center w-16 border-r border-[#2e2e2e] text-gray-400">
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
                        <span className="text-xs text-white font-semibold truncate pr-2">
                          {item.team1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-white font-semibold truncate pr-2">
                          {item.team2}
                        </span>
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
        <section className="max-w-7xl mx-auto rounded-lg">
          {Object.entries(
            (matchData ?? [])
              .sort(
                (a, b) =>
                  new Date(a.unix_timestamp).getTime() -
                  new Date(b.unix_timestamp).getTime(),
              )
              // group matches by day
              .reduce(
                (acc, item) => {
                  const dateObj = new Date(item.unix_timestamp);
                  const dateKey = dateObj.toLocaleDateString("en-US", {
                    weekday: "long", // Sunday
                    month: "long", // September
                    day: "numeric", // 14
                    year: "numeric", // 2025
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
              <h2 className="text-white text-lg font-black px-4 py-3 bg-[#151515] rounded-t-lg border-t border-l border-r border-[#2c2c2c]">
                {date}
              </h2>

              {/* Column Headers */}
              <div className="hidden sm:flex justify-between items-center px-4 py-2 text-xs uppercase tracking-wider text-gray-300 bg-[#181818] border-b border-[#2c2c2c]">
                <div className="w-20 text-center">Time</div>
                <div className="flex-1 text-left pl-2">Teams</div>
                <div className="min-w-[34%] text-right">Tournament</div>
                <div className="min-w-[20%] text-right">Region</div>
                <div className="w-10"></div>
              </div>

              {/* Matches under this date */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);

                // find tournament logo by matching match_event to tournament.title
                const tournament = (tournamentData ?? []).find(
                  (t) => t.title === item.match_event,
                );
                const logo = tournament?.thumb || "/valorantLogo.png";
                // generate slug from match info
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
                      className="flex items-center gap-4 px-4 py-3 bg-[#1f1f1f] hover:bg-[#2e2e2e] transition border-b-2 border-[#2d2d2d]"
                    >
                      {/* Time */}
                      <div className="relative flex items-start justify-center flex-shrink-0 w-20 h-12 text-center">
                        <span className="text-3xl font-bold text-gray-100 leading-none">
                          {hour.toString().padStart(2, "0")}
                        </span>
                        <span className="absolute top-0 right-0 text-base font-semibold text-gray-400 -translate-y-1">
                          {minute}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white truncate">
                            {item.team1}
                          </span>
                          <span className="text-sm text-gray-400">vs</span>
                          <span className="text-[15px] font-semibold text-white truncate">
                            {item.team2}
                          </span>
                        </div>
                      </div>

                      {/* Tournament */}
                      <div className="min-w-[34%] text-right">
                        <div className="text-[15px] font-semibold text-gray-200 truncate">
                          {item.match_event}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {item.match_series}
                        </div>
                      </div>

                      {/* Region/Stage/Link text */}
                      <div className="min-w-[20%] text-right">
                        <span className="text-sm text-gray-400 truncate">
                          {tournament?.region || ""}
                        </span>
                      </div>

                      {/* Right-most default Valorant logo */}
                      <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                        <img
                          src="/valorantLogo.png"
                          alt="Valorant Logo"
                          className="w-10 h-10 object-contain opacity-65 grayscale brightness-90 contrast-125"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
