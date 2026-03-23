"use client";

import useValorantApiWithCache from "@/app/api/Valorant";
import { getMatchStartTime } from "@/app/utils/apiFunctions";

interface MatchDetailsApiResponse {
  data: {
    status: number;
    segments: MatchDetailsApiSegment[];
  };
}

interface MatchDetailsApiSegment {
  match_id: string;
  event: {
    name: string;
    series: string;
    logo: string;
  };
  date: string;
  patch: string;
  status: string;
  teams: {
    name: string;
    tag: string;
    logo: string;
    score: string;
    is_winner: boolean;
  }[];
  streams: {
    name: string;
    url: string;
  }[];
  head_to_head?: H2HMatch[];
}

interface MatchDetails {
  match_event: string;
  match_series: string;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  display_date: string;
  start_time: string;
  head_to_head?: H2HMatch[];
  team1_score?: string;
  team2_score?: string;
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

interface Props {
  id: string;
  slug: string;
}

export default function MatchDetailClient({ id, slug }: Props) {
  const { data: match, loading: matchLoading } =
    useValorantApiWithCache<MatchDetails>({
      key: `match-detail-${id}`,
      url: `match/details?match_id=${id}`,
      parse: (res: MatchDetailsApiResponse) => {
        const segment = res.data?.segments?.[0];

        if (!segment) {
          throw new Error("Match details not found");
        }

        return {
          match_event: segment.event.name,
          match_series: segment.event.series,
          team1: segment.teams?.[0]?.name || "Unknown Team",
          team2: segment.teams?.[1]?.name || "Unknown Team",
          team1_logo: segment.teams?.[0]?.logo || "/valorantLogo.png",
          team2_logo: segment.teams?.[1]?.logo || "/valorantLogo.png",
          display_date: getDisplayDate(segment.date),
          start_time: getStartTime(segment.date),
          head_to_head: segment.head_to_head || [],
          team1_score: segment.teams?.[0]?.score || "",
          team2_score: segment.teams?.[1]?.score || "",
        };
      },
    });

  if (matchLoading || !match) {
    return <div className="max-w-7xl mx-auto p-6 text-white">Loading...</div>;
  }

  function normalizeMatchDate(raw: string): string {
    if (!raw) return "";

    // Fix missing space between day and time:
    // "February 123:00 AM" -> "February 12 3:00 AM"
    return raw.replace(/(\d{1,2})(\d{1,2}:\d{2}\s?[AP]M)/, "$1 $2");
  }

  function getDisplayDate(raw: string): string {
    const normalized = normalizeMatchDate(raw);

    // Everything before the time
    return normalized.replace(/\s\d{1,2}:\d{2}\s?[AP]M.*$/, "").trim();
  }

  function getStartTime(raw: string): string {
    const normalized = normalizeMatchDate(raw);

    // Capture just the time, optionally timezone after it
    const match = normalized.match(/(\d{1,2}:\d{2}\s?[AP]M(?:\s?[A-Z]{3,4})?)/);
    return match ? match[1].trim() : "";
  }

  return (
    <div className="max-w-7xl mx-auto p-6 text-white grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-[#1a1a1a] p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <img
              src={match.team1_logo || "/valorantLogo.png"}
              alt={match.team1 || "Team"}
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-xl font-bold">{match.team1}</h2>
              <p className="text-gray-500 text-sm">Rank #47</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">{match.match_series}</p>
            <p className="text-lg font-semibold">{match.display_date}</p>
            <p className="text-lg font-semibold">{match.start_time}</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <h2 className="text-xl font-bold">{match.team2}</h2>
              <p className="text-gray-500 text-sm">Rank #67</p>
            </div>
            <img
              src={match.team2_logo || "/valorantLogo.png"}
              alt={match.team2 || "Team"}
              className="w-12 h-12"
            />
          </div>
        </div>

        <div className="bg-[#202020] p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Previous Encounters</h3>

          {match.head_to_head && match.head_to_head.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <div className="flex items-center gap-2">
                  <img
                    src={match.team1_logo || "/valorantLogo.png"}
                    alt={match.team1 || "Team"}
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
                    src={match.team2_logo || "/valorantLogo.png"}
                    alt={match.team2 || "Team"}
                    className="w-6 h-6"
                  />
                </div>
              </div>

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
                      <p className="text-sm font-semibold">{h2h.event_name}</p>
                      <p className="text-xs text-gray-400">
                        {h2h.event_series}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No past encounters logged.</p>
          )}
        </div>

        <div className="bg-[#202020] p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Match Preview</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {match.team1} vs {match.team2} will be played on{" "}
            <span className="font-bold">{match.display_date}</span>. This is a{" "}
            <span className="font-bold">{match.match_series}</span> match in the{" "}
            <span className="font-bold">{match.match_event}</span>. Stay tuned
            for live updates and results.
          </p>
        </div>
      </div>

      <div className="col-span-1">
        <div className="bg-[#1a1a1a] rounded-lg w-full max-w-sm text-white border border-[#2a2a2a] sticky top-8">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Match Info
            </h2>
          </div>

          <div className="bg-black p-4 flex items-center justify-center">
            <img
              src="/valorantLogo.png"
              alt="Tournament Logo"
              className="h-16 object-contain"
            />
          </div>

          <div className="px-6 py-4">
            <p className="text-xs uppercase text-gray-400 mb-1">Tournament</p>
            <p className="text-base font-semibold">{match.match_event}</p>
          </div>

          <div className="px-6 pb-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <p className="text-gray-400">Date</p>
              <p>{match.display_date}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Start time</p>
              <p>{match.start_time}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Stage</p>
              <p>{match.match_series}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Location</p>
              <p>EU</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Prize pool</p>
              <p>$2,250,000</p>
            </div>

            <div className="flex justify-between">
              <p className="text-gray-400">Format</p>
              <p>Best of 3</p>
            </div>
          </div>

          <div className="bg-[#101010] px-6 py-4 border-t border-[#2a2a2a]">
            <a
              href={`https://www.vlr.gg/${id}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[#d2ff4d] text-sm font-semibold hover:underline"
            >
              GO TO TOURNAMENT →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
