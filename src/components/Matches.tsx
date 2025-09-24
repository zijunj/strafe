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
                  new Date(b.unix_timestamp).getTime()
              )
              .slice(0, 8) // take first 8 to allow multiple tournaments
              .reduce((acc, item) => {
                const key = item.match_event || "Other Tournament";
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, MatchItem[]>)
          ).map(([tournament, matches], i) => (
            <div key={i} className="mb-4">
              {/* Tournament Header */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-[#202020] border-b border-[#1a1a1a]">
                <span className="text-sm font-semibold text-white">
                  {tournament}
                </span>
              </div>

              {/* Matches under this tournament */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);

                return (
                  <div
                    key={j}
                    className="border-b border-[#3c3c3c] border-t border-[#3c3c3c] flex"
                  >
                    {/* Left: Time column (shared across both rows) */}
                    <div
                      className="flex flex-col justify-center items-center text-gray-400 text-sm w-12"
                      style={{
                        background:
                          "linear-gradient(to bottom, #202020 50%, #181818 50%)",
                      }}
                    >
                      <div className="flex items-start">
                        <span className="text-2xl leading-none">
                          {hour.toString().padStart(2, "0")}
                        </span>
                        <span className="ml-[1px] text-xs">{minute}</span>
                      </div>
                    </div>

                    {/* Right: Teams stacked */}
                    <div className="flex-1">
                      {/* Team 1 row (lighter) */}
                      <div className="flex justify-between items-center p-3 bg-[#202020] hover:bg-[#2A2A2A] transition">
                        <span className="text-sm font-medium text-white">
                          {item.team1}
                        </span>
                      </div>

                      {/* Team 2 row (darker) */}
                      <div className="flex justify-between items-center p-3 bg-[#181818] hover:bg-[#2A2A2A] transition">
                        <span className="text-sm font-medium text-gray-400">
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
                  new Date(b.unix_timestamp).getTime()
              )
              // group matches by day
              .reduce((acc, item) => {
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
              }, {} as Record<string, MatchItem[]>)
          ).map(([date, matches], i) => (
            <div key={i} className="mb-6">
              {/* Date Header */}
              <h2 className="text-gray-300 text-lg font-semibold px-3 py-2 bg-[#181818] rounded-t-lg">
                {date}
              </h2>

              {/* Matches under this date */}
              {matches.map((item, j) => {
                const { hour, minute } = getMatchStartTime(item.unix_timestamp);

                // find tournament logo by matching match_event to tournament.title
                const tournament = (tournamentData ?? []).find(
                  (t) => t.title === item.match_event
                );
                const logo = tournament?.thumb || "/valorantLogo.png";
                // generate slug from match info
                const matchPath = item.match_page.replace(
                  "https://www.vlr.gg/",
                  ""
                );
                const [id, slug] = matchPath.split("/", 2);

                return (
                  <Link
                    key={id} // ✅ unique key here
                    href={{
                      pathname: `/matches/${id}/${slug}`,
                    }}
                  >
                    <div
                      key={j}
                      className="flex justify-between items-center p-3 bg-[#202020] hover:bg-[#2A2A2A] transition border-b border-[#1a1a1a] rounded-b-lg"
                    >
                      {/* Left: Logo */}
                      <div className="flex items-center justify-center w-16">
                        <img
                          src="/valorantLogo.png"
                          alt="Valorant Logo"
                          className="w-6 h-6 object-contain"
                        />
                      </div>

                      {/* Center: Teams */}
                      <div className="flex-1 px-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium">
                              {item.team1}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <span className="text-sm font-medium">
                              {item.team2}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Tournament Info */}
                      <div className="text-right w-40">
                        <div className="text-sm font-semibold text-gray-200">
                          {item.match_event}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.match_series}
                        </div>
                      </div>

                      {/* Right-most Logo + Time */}
                      <div className="flex items-center space-x-3 w-28 justify-end">
                        {/* Logo column */}
                        <div className="flex items-center justify-center w-10">
                          <img
                            src={logo}
                            alt={tournament?.title || "Tournament Logo"}
                            className="w-8 h-8"
                          />
                        </div>

                        {/* Time column */}
                        <div className="text-gray-300 text-sm font-medium w-12 text-right">
                          {(hour % 12 || 12).toString().padStart(2, "0")}:
                          {minute}
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
    </>
  );
}
