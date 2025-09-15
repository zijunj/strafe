import useValorantApiWithCache from "../app/api/Valorant";
import React from "react";
import { getMatchStartTime } from "../app/utils/apiFunctions";

interface MatchProps {
  pageView: string;
  setPageView?: (view: string) => void;
}

interface MatchItem {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  unix_timestamp: string;
  time_until_match: string;
}

export default function Matches({ pageView }: MatchProps) {
  const { data: matchData = [], loading } = useValorantApiWithCache<
    MatchItem[]
  >({
    key: `upcomingMatches`,
    url: `match?q=upcoming`,
    parse: (res) => res.data.segments,
  });

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {pageView === "home" && (
        <section className="max-w-7xl mx-auto ">
          {(matchData ?? [])
            .sort(
              (a, b) =>
                new Date(a.unix_timestamp).getTime() -
                new Date(b.unix_timestamp).getTime()
            )
            .slice(0, 4)
            .map((item, i) => {
              const { hour, minute } = getMatchStartTime(item.unix_timestamp);

              return (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 hover:bg-[#2A2A2A] transition border-b border-[#1a1a1a]"
                >
                  {/* Left: Time */}
                  <div className="flex flex-col items-center justify-center text-gray-400 text-sm w-12">
                    <div className="flex items-start">
                      <span className="text-2xl leading-none">
                        {hour.toString().padStart(2, "0")}
                      </span>
                      <span className="ml-[1px] text-xs">{minute}</span>
                    </div>
                  </div>

                  {/* Center: Teams */}
                  <div className="flex-1 px-2">
                    <div className="flex items-center space-x-2">
                      {/* Team 1 */}
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">
                          {item.team1}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {/* Team 2 */}
                      <div className="flex items-center space-x-1 text-gray-400">
                        <span className="text-sm font-medium">
                          {item.team2}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                const dateObj = new Date(item.unix_timestamp);
                const hour = dateObj.getHours();
                const minute = dateObj.getMinutes().toString().padStart(2, "0");

                return (
                  <div
                    key={j}
                    className="flex justify-between items-center p-3 bg-[#202020] hover:bg-[#2A2A2A] transition border-b border-[#1a1a1a] rounded-b-lg"
                  >
                    {/* Left: Time */}
                    <div className="flex flex-col items-center justify-center text-gray-400 text-sm w-16">
                      <div className="flex items-start">
                        <span className="text-2xl leading-none">
                          {(hour % 12 || 12).toString().padStart(2, "0")}
                        </span>
                        <span className="ml-[1px] text-xs">{minute}</span>
                      </div>
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
                    <div className="text-right text-xs text-gray-400 w-40">
                      <div>{item.match_event}</div>
                      <div>{item.match_series}</div>
                    </div>

                    {/* Right-most Logo + Time */}
                    <div className="flex flex-col items-center text-sm w-20">
                      <img
                        src="/valorant-logo.png"
                        alt="Tournament Logo"
                        className="w-8 h-8 mb-1"
                      />
                      <span className="text-gray-300">{`${(hour % 12 || 12)
                        .toString()
                        .padStart(2, "0")}:${minute}`}</span>
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
