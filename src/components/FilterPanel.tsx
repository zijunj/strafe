import React from "react";

// Define the props and filters shape
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
}

export default function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  return (
    <div className="bg-gray-800 text-white p-6 rounded-md shadow-md max-w-6xl mx-auto">
      <div className="grid grid-cols-6 gap-4 mb-4 text-xs text-pink-400 font-semibold">
        <label htmlFor="eventSeries">EVENT SERIES</label>
        <label htmlFor="region">REGION</label>
        <label htmlFor="minRounds">MIN # RNDS</label>
        <label htmlFor="minRating">MIN OPP RATING</label>
        <label htmlFor="agent">AGENT</label>
        <label htmlFor="map">MAP</label>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-4">
        <select
          id="eventSeries"
          className="bg-gray-700 p-2 rounded"
          value={filters.eventSeries}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, eventSeries: e.target.value }))
          }
        >
          <option value="all">All</option>
          {/* Add more event series options here */}
        </select>

        <select
          id="region"
          className="bg-gray-700 p-2 rounded"
          value={filters.region}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, region: e.target.value }))
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
          className="bg-gray-700 p-2 rounded"
          value={filters.minRounds}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minRounds: Number(e.target.value),
            }))
          }
        />

        <input
          type="number"
          id="minRating"
          className="bg-gray-700 p-2 rounded"
          value={filters.minRating}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minRating: Number(e.target.value),
            }))
          }
        />

        <select
          id="agent"
          className="bg-gray-700 p-2 rounded"
          value={filters.agent}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, agent: e.target.value }))
          }
        >
          <option value="all">All</option>
          {/* Add agent options here */}
        </select>

        <select
          id="map"
          className="bg-gray-700 p-2 rounded"
          value={filters.map}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, map: e.target.value }))
          }
        >
          <option value="all">All</option>
          {/* Add map options here */}
        </select>
      </div>

      <div className="grid grid-cols-6 gap-4 text-xs text-pink-400 font-semibold mb-2">
        <label htmlFor="timespan">TIMESPAN</label>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <select
          id="timespan"
          className="bg-gray-700 p-2 rounded"
          value={filters.timespan}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, timespan: e.target.value }))
          }
        >
          <option value="30">Past 30 days</option>
          <option value="60">Past 60 days</option>
          <option value="90">Past 90 days</option>
          <option value="all">All Time</option>
        </select>

        <button
          className="col-span-1 bg-red-500 text-white font-bold p-2 rounded hover:bg-red-600"
          onClick={() => console.log("Filters:", filters)}
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
}
