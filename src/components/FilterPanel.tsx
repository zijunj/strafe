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

  return (
    <div className="bg-gray-800 text-white p-6 rounded-md shadow-md max-w-6xl mx-auto">
      {/* Labels */}
      <div className="grid grid-cols-6 gap-4 mb-4 text-xs text-pink-400 font-semibold">
        <label htmlFor="eventSeries">EVENT SERIES</label>
        <label htmlFor="region">REGION</label>
        <label htmlFor="minRounds">MIN # RNDS</label>
        <label htmlFor="minRating">MIN OPP RATING</label>
        <label htmlFor="agent">AGENT</label>
        <label htmlFor="map">MAP</label>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-6 gap-4 mb-4">
        {/* eventSeries */}
        <select
          id="eventSeries"
          className="bg-gray-700 p-2 rounded"
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

        {/* region */}
        <select
          id="region"
          className="bg-gray-700 p-2 rounded"
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

        {/* minRounds */}
        <input
          type="number"
          id="minRounds"
          className="bg-gray-700 p-2 rounded"
          value={stagedFilters.minRounds}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              minRounds: Number(e.target.value),
            }))
          }
        />

        {/* minRating */}
        <input
          type="number"
          id="minRating"
          className="bg-gray-700 p-2 rounded"
          value={stagedFilters.minRating}
          onChange={(e) =>
            setStagedFilters((prev) => ({
              ...prev,
              minRating: Number(e.target.value),
            }))
          }
        />

        {/* agent */}
        <select
          id="agent"
          className="bg-gray-700 p-2 rounded"
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

        {/* map */}
        <select
          id="map"
          className="bg-gray-700 p-2 rounded"
          value={stagedFilters.map}
          onChange={(e) =>
            setStagedFilters((prev) => ({ ...prev, map: e.target.value }))
          }
        >
          <option value="all">All</option>
        </select>
      </div>

      {/* Timespan row */}
      <div className="grid grid-cols-6 gap-4 text-xs text-pink-400 font-semibold mb-2">
        <label htmlFor="timespan">TIMESPAN</label>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <select
          id="timespan"
          className="bg-gray-700 p-2 rounded col-span-2"
          value={stagedFilters.timespan}
          onChange={(e) =>
            setStagedFilters((prev) => ({ ...prev, timespan: e.target.value }))
          }
        >
          <option value="30">Past 30 days</option>
          <option value="60">Past 60 days</option>
          <option value="90">Past 90 days</option>
          <option value="all">All Time</option>
        </select>

        {/* Apply button */}
        <button
          className="col-span-1 bg-red-500 text-white font-bold p-2 rounded hover:bg-red-600"
          onClick={() => {
            setFilters(stagedFilters); // push all staged values
            onApply(
              stagedFilters.region,
              stagedFilters.timespan,
              stagedFilters.minRating
            ); // pass 3 for API fetch
          }}
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}
