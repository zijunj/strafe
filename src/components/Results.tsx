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
          {resultData.slice(0, 4).map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 hover:bg-[#2A2A2A] transition"
            >
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  {item.tournament_name}
                </div>
                <div className="text-white font-semibold text-sm">
                  {item.team1} vs {item.team2}
                  <br />
                  {item.score1} vs {item.score2}
                </div>
              </div>
              <div className="text-right text-gray-400 text-xs">
                <div>{item.time_completed.replace("ago", "").trim()}</div>
              </div>
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
