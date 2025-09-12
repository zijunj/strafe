import { useEffect, useState } from "react";
import useValorantApiWithCache from "../app/api/Valorant";

interface TournamentItem {
  title: string;
  next_match_time: string;
  region: string;
  dates: string;
  prize_pool: string;
  url_path: string;
}

export default function Tournaments() {
  const { data: tournamentData, loading } = useValorantApiWithCache<
    TournamentItem[]
  >({
    key: "tournaments",
    url: "events",
    parse: (res) => res.data.segments,
  });

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-2">
      {tournamentData?.slice(0, 1).map((item, i) => (
        <article key={i}>
          {/* Title and Badge Row */}
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-extrabold text-white">{item.title}</h2>
            <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              Featured Tournament
            </span>
          </div>

          {/* Sub Info Row */}
          <div className="text-sm text-gray-400 mt-1 flex items-center gap-4">
            <span>🕒 Next match in {item.next_match_time}</span>
            <span>🌍 {item.region}</span>
            <span>📅 {item.dates}</span>
            <span>💰 {item.prize_pool}</span>
          </div>

          {/* Optional Bracket Section */}
          <div className="mt-4 bg-[#1e1e1e] p-4 rounded-md text-sm text-white shadow-inner">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-xs text-gray-400 mb-1">
                  ROUND ROBIN - ROUND 1
                </h4>
                <p className="text-sm">
                  🕔 17:00 • FlyQuest Red vs Hakikimori GC
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-xs text-gray-400 mb-1">
                  ROUND ROBIN - ROUND 7
                </h4>
                <p className="text-sm">
                  🕔 17:00 • FlyQuest Red vs Blue Otter GC
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-xs text-gray-400 mb-1">
                  ROUND ROBIN - ROUND 7
                </h4>
                <p className="text-sm">🕔 19:30 • Hakikimori GC vs ^-^</p>
              </div>
            </div>
          </div>

          {/* Read More */}
          <div className="mt-4">
            <a
              href={item.url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-300 hover:underline text-sm"
            >
              Read more →
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
