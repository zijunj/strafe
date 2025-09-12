"use client";

import Tournaments from "@/components/Tournaments";

export default function TournamentPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto flex items-center">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Ongoing Valorant Tournaments
          </h1>
          <p className="text-gray-300">
            Schedule for ongoing Valorant esports Tournaments.
          </p>
        </div>
      </div>
      <Tournaments />
    </>
  );
}
