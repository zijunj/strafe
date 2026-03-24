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

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {pageView === "home" && (
        <div className="">
          {tournamentData?.slice(0, 1).map((tournament, i) => {
            // Filter matches that belong to this tournament
            const tournamentMatches =
              matchData?.filter((m) => m.match_event === tournament.title) ||
              [];

            return (
              <article key={i}>
                {/* Title and Badge Row */}
                {/* Tournament Header */}
                <div className="flex items-center justify-between bg-[#151515] rounded-md overflow-hidden">
                  {/* Left: Logo + Info */}
                  <div className="flex items-center p-4">
                    {/* Logo */}
                    <div className="w-14 h-14 bg-[#222] rounded flex items-center justify-center mr-4">
                      <img
                        src={tournament.thumb || "/valorantLogo.png"}
                        alt="logo"
                        className="w-8 h-8 object-contain"
                      />
                    </div>

                    {/* Title + Meta */}
                    <div>
                      <h2 className="text-xl font-extrabold text-white">
                        {tournament.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>🌍 {tournament.region}</span>
                        <span>📅 {tournament.dates}</span>
                        <span>💰 {tournament.prize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge */}
                  <div className="px-4">
                    <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                      Featured Tournament
                    </span>
                  </div>
                </div>

                {/* Matches for this tournament */}
                {tournamentMatches.length > 0 && (
                  <div className="mt-4 rounded-md text-sm text-white shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {tournamentMatches.slice(0, 3).map((match, j) => {
                        const dateObj = new Date(match.unix_timestamp);
                        const day = dateObj.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        });
                        const { hour, minute } = getMatchStartTime(
                          match.unix_timestamp
                        );

                        return (
                          <div
                            key={j}
                            className="border border-[#2a2a2a] rounded-md overflow-hidden"
                          >
                            {/* Header row with match series + date */}
                            <h4 className="text-xs font-semibold text-gray-400 bg-[#181818] px-3 py-1">
                              {match.match_series} • {day}
                            </h4>

                            {/* Match body */}
                            <div className="flex">
                              {/* Time column */}
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
                                  <span className="ml-[1px] text-xs">
                                    {minute}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Teams stacked */}
                              <div className="flex-1">
                                {/* Team 1 row (lighter) */}
                                <div className="flex justify-between items-center p-3 bg-[#202020] hover:bg-[#2A2A2A] transition">
                                  <span className="text-sm font-medium text-white">
                                    {match.team1}
                                  </span>
                                </div>

                                {/* Team 2 row (darker) */}
                                <div className="flex justify-between items-center p-3 bg-[#181818] hover:bg-[#2A2A2A] transition">
                                  <span className="text-sm font-medium text-gray-400">
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
        <div className="rounded-2xl overflow-hidden border border-[#383838] bg-[#171717] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="px-6 py-5 bg-[#171717] border-b border-[#343434]">
            <h2 className="text-[13px] font-extrabold tracking-[0.02em] text-white uppercase">
              Current Valorant Esports Tournaments
            </h2>
          </div>

          {/* Tournament Rows or Empty State */}
          {(() => {
            const filtered = tournamentData?.filter((t) =>
              tournamentView === "upcoming"
                ? t.status === "upcoming"
                : t.status === "ongoing"
            );

            if (!filtered || filtered.length === 0) {
              return (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                  No {tournamentView} tournaments planned.{" "}
                  <button
                    onClick={() => {
                      setTournamentView?.("ongoing");
                    }}
                    className="text-white font-semibold hover:underline"
                  >
                    View{" "}
                    {tournamentView === "upcoming" ? "ongoing" : "upcoming"}
                  </button>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <div className="min-w-[920px]">
                  {filtered.map((tournament, i) => (
                    <article
                      key={i}
                      className="grid grid-cols-[72px_minmax(0,1.9fr)_72px_126px_134px_150px] items-center min-h-[88px] border-b border-[#343434] bg-[#1d1d1d] hover:bg-[#212121] transition-colors"
                    >
                      <div className="flex h-full items-center justify-center border-r border-[#343434]">
                        <img
                          src="/valorantLogo.png"
                          alt="Valorant logo"
                          className="h-9 w-9 object-contain opacity-65 grayscale brightness-90 contrast-125"
                        />
                      </div>

                      <div className="flex items-center gap-4 px-5">
                        <div className="flex h-11 w-11 items-center justify-center bg-white/95">
                          <img
                            src={tournament.thumb || "/valorantLogo.png"}
                            alt={tournament.title}
                            className="h-9 w-9 object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-extrabold leading-5 text-white">
                            {tournament.title}
                          </h3>
                          <p className="mt-1 text-[14px] leading-5 text-[#737373]">
                            Valorant
                          </p>
                        </div>
                      </div>

                      <div className="border-l border-[#343434] px-4 text-center text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#6d7680]">
                        {tournament.region || "-"}
                      </div>

                      <div className="border-l border-[#343434] px-4 text-center text-[13px] font-bold text-[#7b7b7b]">
                        {tournament.prize || "-"}
                      </div>

                      <div className="border-l border-[#343434] px-4 text-center text-[13px] font-bold text-[#7b7b7b]">
                        {tournament.dates}
                      </div>

                      <div className="border-l border-[#343434] px-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-9 w-9 rounded-full border border-[#2e2e2e] bg-[#151515]" />
                          <div className="h-9 w-9 rounded-full border border-[#2e2e2e] bg-[#151515]" />
                          <div className="h-9 w-9 rounded-full border border-[#2e2e2e] bg-[#151515]" />
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
        <div className="w-full max-w-sm bg-[#1E1E1E] rounded-lg p-4 border border-[#2a2a2a] ring-1 ring-[#2E2E2E]">
          <h2 className="text-lg font-bold text-white mb-4">TOURNAMENTS</h2>

          {/* 🟢 Ongoing */}
          <div className="mb-6">
            <h3 className="text-sm uppercase text-gray-400 mb-3">ONGOING</h3>
            <div className="space-y-3">
              {tournamentData
                ?.filter((t) => t.status === "ongoing")
                .slice(0, 4)
                .map((tournament, i) => (
                  <a
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#1f1f1f] transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={tournament.thumb || "/valorantLogo.png"}
                        alt={tournament.title}
                        className="w-10 h-10 object-contain rounded"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-yellow-300">
                          {tournament.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {tournament.region} • {tournament.dates}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-lg group-hover:text-yellow-300">
                      ›
                    </span>
                  </a>
                ))}
            </div>
          </div>

          {/* 🟡 Upcoming */}
          <div className="mb-6">
            <h3 className="text-sm uppercase text-gray-400 mb-3">UPCOMING</h3>
            <div className="space-y-3">
              {tournamentData
                ?.filter((t) => t.status === "upcoming")
                .slice(0, 4)
                .map((tournament, i) => (
                  <a
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#1f1f1f] transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={tournament.thumb || "/valorantLogo.png"}
                        alt={tournament.title}
                        className="w-10 h-10 object-contain rounded"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-yellow-300">
                          {tournament.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {tournament.region} • {tournament.dates}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-lg group-hover:text-yellow-300">
                      ›
                    </span>
                  </a>
                ))}
            </div>
          </div>

          {/* 🔴 Finished */}
          <div>
            <h3 className="text-sm uppercase text-gray-400 mb-3">FINISHED</h3>
            <div className="space-y-3">
              {tournamentData
                ?.filter((t) => t.status === "finished")
                .slice(0, 4)
                .map((tournament, i) => (
                  <a
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#1f1f1f] transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={tournament.thumb || "/valorantLogo.png"}
                        alt={tournament.title}
                        className="w-10 h-10 object-contain rounded"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-yellow-300">
                          {tournament.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {tournament.region} • {tournament.dates}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-lg group-hover:text-yellow-300">
                      ›
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
