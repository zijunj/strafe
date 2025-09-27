import MatchDetailClient from "./MatchDetailClient";

interface MatchDetails {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  unix_timestamp: string;
  local_time: string;
  time_until_match: string;
  head_to_head?: H2HMatch[]; // 👈 new
}

interface H2HMatch {
  event_name: string;
  event_series: string;
  event_logo: string;
  team1_score: string;
  team2_score: string;
  team1_win: boolean;
  team2_win: boolean;
  date: string;
  url: string;
}

export default async function MatchDetailPage(props: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await props.params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/matches/${id}/${slug}`,
    { cache: "no-store" }
  );

  const { data: match }: { data: MatchDetails } = await res.json();

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 text-white grid grid-cols-3 gap-6">
        {/* LEFT COLUMN: main content */}
        <div className="col-span-2 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={match.team1_logo}
                alt={match.team1}
                className="w-12 h-12"
              />
              <div>
                <h2 className="text-xl font-bold">{match.team1}</h2>
                <p className="text-gray-500 text-sm">Rank #47</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">{match.match_series}</p>
              <p className="text-lg font-semibold">{match.local_time}</p>
              <p className="text-xs text-gray-500">{match.time_until_match}</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <h2 className="text-xl font-bold">{match.team2}</h2>
                <p className="text-gray-500 text-sm">Rank #67</p>
              </div>
              <img
                src={match.team2_logo}
                alt={match.team2}
                className="w-12 h-12"
              />
            </div>
          </div>

          {/* Previous Encounters */}
          <div className="bg-[#202020] p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Previous Encounters</h3>

            {match.head_to_head && match.head_to_head.length > 0 ? (
              <div>
                {/* Summary */}
                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                  <div className="flex items-center gap-2">
                    <img
                      src={match.team1_logo}
                      alt={match.team1}
                      className="w-6 h-6"
                    />
                    <span className="text-white">
                      {match.head_to_head.filter((h2h) => h2h.team1_win).length}{" "}
                      Wins
                    </span>
                  </div>

                  <div className="text-gray-400 text-sm">0 Draws</div>

                  <div className="flex items-center gap-2">
                    <span className="text-white">
                      {match.head_to_head.filter((h2h) => h2h.team2_win).length}{" "}
                      Wins
                    </span>
                    <img
                      src={match.team2_logo}
                      alt={match.team2}
                      className="w-6 h-6"
                    />
                  </div>
                </div>

                {/* Matches list */}
                <div className="divide-y divide-gray-700">
                  {match.head_to_head.map((h2h, idx) => (
                    <a
                      key={idx}
                      href={h2h.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-center py-3 hover:bg-[#2a2a2a] px-3 rounded-md"
                    >
                      <div className="w-1/4 text-xs text-gray-400">
                        {h2h.date}
                      </div>

                      <div className="flex-1 flex items-center justify-center gap-3">
                        <span
                          className={`font-bold ${
                            h2h.team1_win ? "text-white" : "text-gray-500"
                          }`}
                        >
                          {match.team1}
                        </span>

                        <div className="flex items-center gap-1 text-sm font-bold">
                          <span
                            className={
                              h2h.team1_win ? "text-white" : "text-gray-400"
                            }
                          >
                            {h2h.team1_score}
                          </span>
                          <span>-</span>
                          <span
                            className={
                              h2h.team2_win ? "text-white" : "text-gray-400"
                            }
                          >
                            {h2h.team2_score}
                          </span>
                        </div>

                        <span
                          className={`font-bold ${
                            h2h.team2_win ? "text-white" : "text-gray-500"
                          }`}
                        >
                          {match.team2}
                        </span>
                      </div>

                      <div className="w-1/4 text-right">
                        <p className="text-sm font-semibold">
                          {h2h.event_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {h2h.event_series}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                No past encounters logged.
              </p>
            )}
          </div>

          {/* Match Preview */}
          <div className="bg-[#202020] p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Match Preview</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {match.team1} vs {match.team2} will be played on{" "}
              <span className="font-bold">{match.local_time}</span>. This is a{" "}
              <span className="font-bold">{match.match_series}</span> match in
              the <span className="font-bold">{match.match_event}</span>. Stay
              tuned for live updates and results.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Match Info Card */}
        <div className="col-span-1">
          <MatchDetailClient id={id} slug={slug} />
        </div>
      </div>
    </>
  );
}
