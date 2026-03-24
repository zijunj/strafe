import React, { useState } from "react";

interface Filters {
  eventSeries: string;
  region: string;
  minRounds: number;
  minRating: number;
  agent: string;
  map: string;
  timespan: string;
}

interface FilterPanelProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onApply: (region: string, timespan: string, minRating: number) => void; // ✅ added minRating
}

export default function FilterPanel({
  filters,
  setFilters,
  onApply,
}: FilterPanelProps) {
  // stage *all* filters locally
  const [stagedFilters, setStagedFilters] = useState(filters);
  const inputClasses =
    "w-full rounded-lg border border-[#353535] bg-[#171717] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#FFE44F]";
  const labelClasses =
    "text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8b8b8b]";

  return (
    <div className="max-w-7xl mx-auto rounded-2xl border border-[#303030] bg-[#1b1b1b] p-6 text-white shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFE44F]">
            Filter Panel
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-white">
            Narrow down the player pool
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <label htmlFor="eventSeries" className={labelClasses}>
          Event Series
        </label>
        <label htmlFor="region" className={labelClasses}>
          Region
        </label>
        <label htmlFor="minRounds" className={labelClasses}>
          Min # Rnds
        </label>
        <label htmlFor="minRating" className={labelClasses}>
          Min Opp Rating
        </label>
        <label htmlFor="agent" className={labelClasses}>
          Agent
        </label>
        <label htmlFor="map" className={labelClasses}>
          Map
        </label>
        <label htmlFor="timespan" className={labelClasses}>
          Timespan
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <select
          id="eventSeries"
          className={inputClasses}
          value={stagedFilters.eventSeries}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              eventSeries: e.target.value,
            }))
          }
        >
          <option value="all">All</option>
        </select>

        <select
          id="region"
          className={inputClasses}
          value={stagedFilters.region}
          onChange={(e) =>
            setStagedFilters((prev) => ({ ...prev, region: e.target.value }))
          }
        >
          <option value="all">All</option>
          <option value="na">North America</option>
          <option value="eu">Europe</option>
          <option value="br">Brazil</option>
          <option value="ap">Asia-Pacific</option>
          <option value="kr">Korea</option>
          <option value="cn">China</option>
          <option value="jp">Japan</option>
          <option value="las">Latin America South</option>
          <option value="lan">Latin America North</option>
          <option value="oce">Oceania</option>
          <option value="mn">MENA</option>
          <option value="gc">Game Changers</option>
          <option value="cg">Collegiate</option>
        </select>

        <input
          type="number"
          id="minRounds"
          className={inputClasses}
          value={stagedFilters.minRounds}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              minRounds: Number(e.target.value),
            }))
          }
        />

        <input
          type="number"
          id="minRating"
          className={inputClasses}
          value={stagedFilters.minRating}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              minRating: Number(e.target.value),
            }))
          }
        />

        <select
          id="agent"
          className={inputClasses}
          value={stagedFilters.agent}
          onChange={(e) =>
            setStagedFilters((prev) => ({ ...prev, agent: e.target.value }))
          }
        >
          <option value="all">All</option>
          <option value="jett">Jett</option>
          <option value="sova">Sova</option>
          <option value="omen">Omen</option>
          <option value="raze">Raze</option>
          <option value="reyna">Reyna</option>
          <option value="sage">Sage</option>
          <option value="cypher">Cypher</option>
          <option value="viper">Viper</option>
          <option value="killjoy">Killjoy</option>
          <option value="breach">Breach</option>
          <option value="skye">Skye</option>
          <option value="yoru">Yoru</option>
          <option value="astra">Astra</option>
          <option value="kayo">KAY/O</option>
          <option value="chamber">Chamber</option>
          <option value="neon">Neon</option>
          <option value="fade">Fade</option>
          <option value="harbor">Harbor</option>
          <option value="gekko">Gekko</option>
          <option value="deadlock">Deadlock</option>
          <option value="iso">Iso</option>
          <option value="clove">Clove</option>
          <option value="vyse">Vyse</option>
        </select>

        <select
          id="map"
          className={inputClasses}
          value={stagedFilters.map}
          onChange={(e) =>
            setStagedFilters((prev) => ({ ...prev, map: e.target.value }))
          }
        >
          <option value="all">All</option>
        </select>

        <select
          id="timespan"
          className={inputClasses}
          value={stagedFilters.timespan}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              timespan: e.target.value,
            }))
          }
        >
          <option value="30">Past 30 days</option>
          <option value="60">Past 60 days</option>
          <option value="90">Past 90 days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="mt-6">
        <button
          className="h-[48px] w-full rounded-lg bg-[#FFE44F] px-6 text-sm font-extrabold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
          onClick={() => {
            setFilters(stagedFilters);
            onApply(
              stagedFilters.region,
              stagedFilters.timespan,
              stagedFilters.minRating
            );
          }}
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}
