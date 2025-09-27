"use client";

import useValorantApiWithCache from "@/app/api/Valorant";
import { getMatchStartTime } from "@/app/utils/apiFunctions";

interface MatchItem {
  match_event: string;
  match_series: string;
  match_page: string;
  team1: string;
  team2: string;
  unix_timestamp: string;
  time_until_match: string;
}

interface Props {
  id: string;
  slug: string;
}

export default function MatchDetailClient({ id, slug }: Props) {
  const { data: matches = [], loading } = useValorantApiWithCache<MatchItem[]>({
    key: "upcomingMatches",
    url: "match?q=upcoming",
    parse: (res) => res.data.segments,
  });

  if (loading)
    return <div className="text-gray-400">Loading match info...</div>;
  if (matches.length === 0)
    return <div className="text-gray-400">No match data found.</div>;

  const targetUrl = `https://www.vlr.gg/${id}/${slug}`;
  const match = matches.find(
    (m) => m.match_page === targetUrl || m.match_page?.includes(`${id}/${slug}`)
  );

  if (!match) {
    return <div className="text-gray-400">Match not found for this page.</div>;
  }

  const dateObj = new Date(match.unix_timestamp);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
  });
  const { hour, minute } = getMatchStartTime(match.unix_timestamp);

  return (
    <div className="bg-[#1a1a1a] rounded-lg w-full max-w-sm text-white border border-[#2a2a2a] sticky top-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#2a2a2a]">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Match Info
        </h2>
      </div>

      {/* Tournament Logo */}
      <div className="bg-black p-4 flex items-center justify-center">
        <img
          src="/valorantLogo.png"
          alt="Tournament Logo"
          className="h-16 object-contain"
        />
      </div>

      {/* Tournament Name */}
      <div className="px-6 py-4">
        <p className="text-xs uppercase text-gray-400 mb-1">Tournament</p>
        <p className="text-base font-semibold">{match.match_event}</p>
      </div>

      {/* Match Info Grid */}
      <div className="px-6 pb-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-400">Date</p>
          <p>{formattedDate}</p>
        </div>

        <div className="flex justify-between">
          <p className="text-gray-400">Start time</p>
          <p>
            {hour}:{minute}
          </p>
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

      {/* CTA Button */}
      <div className="bg-[#101010] px-6 py-4 border-t border-[#2a2a2a]">
        <a
          href={match.match_page}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-[#d2ff4d] text-sm font-semibold hover:underline"
        >
          GO TO TOURNAMENT →
        </a>
      </div>
    </div>
  );
}
