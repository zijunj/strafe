"use client";

import useValorantApiWithCache from "../app/api/Valorant";
import parseTimeCompleted from "../app/utils/apiFunctions";

interface ResultsProps {
  pageView: string;
  setPageView?: (view: string) => void;
}

// Type definition for result data
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

  if (loading) return <p className="text-white">Loading...</p>;
  if (!resultData || resultData.length === 0)
    return <p className="text-white">No results found.</p>;

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
            }, {} as Record<string, MatchResult[]>)
          ).map(([tournament, matches], i) => (
            <div key={i} className="mb-6">
              {/* Tournament Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#202020] border-b border-[#1a1a1a]">
                <div className="flex items-center space-x-2">
                  <img
                    src={matches[0].tournament_icon}
                    alt="Tournament Icon"
                    className="w-6 h-6"
                  />
                  <span className="text-sm font-semibold text-white">
                    {tournament}
                  </span>
                </div>
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
                }, {} as Record<string, (MatchResult & { dateObj: Date })[]>)
              ).map(([date, dayMatches], j) => (
                <div key={j}>
                  {/* Date Subheader */}
                  <div className="px-4 py-1 bg-[#181818] text-xs text-gray-400 font-semibold border-b border-[#1a1a1a]">
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
                        className="flex items-center justify-between px-4 py-2 hover:bg-[#2A2A2A] transition border-b border-[#1a1a1a]"
                      >
                        {/* Left: Time */}
                        <div className="w-12 text-gray-400 text-xs">
                          {`${(hour % 12 || 12)
                            .toString()
                            .padStart(2, "0")}:${minute}`}
                        </div>

                        {/* Center: Teams + Scores */}
                        <div className="flex-1 px-2">
                          {/* Team 1 */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm ${
                                team1Won
                                  ? "font-bold text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {item.team1}
                            </span>
                            <div className="flex items-center space-x-1">
                              {team1Won && (
                                <span className="text-green-400 text-[10px] font-bold">
                                  WIN
                                </span>
                              )}
                              <span
                                className={`text-sm ${
                                  team1Won
                                    ? "font-bold text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {score1}
                              </span>
                            </div>
                          </div>

                          {/* Team 2 */}
                          <div className="flex items-center justify-between mt-1">
                            <span
                              className={`text-sm ${
                                team2Won
                                  ? "font-bold text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {item.team2}
                            </span>
                            <div className="flex items-center space-x-1">
                              {team2Won && (
                                <span className="text-green-400 text-[10px] font-bold">
                                  WIN
                                </span>
                              )}
                              <span
                                className={`text-sm ${
                                  team2Won
                                    ? "font-bold text-white"
                                    : "text-gray-400"
                                }`}
                              >
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
        <section className="max-w-7xl mx-auto rounded-lg">
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
            }, {} as Record<string, (MatchResult & { dateObj: Date })[]>)
          ).map(([date, matches], i) => (
            <div key={i} className="mb-6">
              {/* Date Header */}
              <h2 className="text-gray-300 text-lg font-semibold px-3 py-2 bg-[#181818] rounded-t-lg">
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
                    className="flex justify-between items-center p-3 bg-[#202020] hover:bg-[#2A2A2A] transition border-b border-[#1a1a1a] last:rounded-b-lg"
                  >
                    {/* Left: Scores */}
                    <div className="flex flex-col items-center justify-center w-12">
                      <span
                        className={`text-xl font-bold ${
                          team1Won ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {score1}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          team2Won ? "text-white" : "text-gray-400"
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
                              ? "font-bold text-white"
                              : "font-medium text-gray-400"
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
                              ? "font-bold text-white"
                              : "font-medium text-gray-400"
                          }`}
                        >
                          {item.team2}
                        </span>
                      </div>
                    </div>

                    {/* Right: Tournament Info + Time */}
                    <div className="flex items-center space-x-4 w-60 justify-end">
                      <div className="text-right text-xs text-gray-400">
                        <div>{item.tournament_name}</div>
                        <div>{item.round_info}</div>
                      </div>
                      <img
                        src={item.tournament_icon}
                        alt="Tournament Icon"
                        className="w-8 h-8"
                      />
                      <span className="text-gray-300 text-sm">{`${(
                        hour % 12 || 12
                      )
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
