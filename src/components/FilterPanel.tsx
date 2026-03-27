"use client";

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
  onApply: (region: string, timespan: string, minRating: number) => void;
}

export default function FilterPanel({
  filters,
  setFilters,
  onApply,
}: FilterPanelProps) {
  const [stagedFilters, setStagedFilters] = useState(filters);

  return (
    <div className="card-elevated p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-2">Filter Panel</p>
          <h2 className="card-title">Narrow down the player pool</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
        <div>
          <label htmlFor="eventSeries" className="label mb-2 block">
            Event Series
          </label>
          <select
            id="eventSeries"
            className="select-field"
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
        </div>

        <div>
          <label htmlFor="region" className="label mb-2 block">
            Region
          </label>
          <select
            id="region"
            className="select-field"
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
        </div>

        <div>
          <label htmlFor="minRounds" className="label mb-2 block">
            Min # Rnds
          </label>
          <input
            type="number"
            id="minRounds"
            className="input-field"
            value={stagedFilters.minRounds}
            onChange={(e) =>
              setStagedFilters((prev) => ({
                ...prev,
                minRounds: Number(e.target.value),
              }))
            }
          />
        </div>

        <div>
          <label htmlFor="minRating" className="label mb-2 block">
            Min Opp Rating
          </label>
          <input
            type="number"
            id="minRating"
            className="input-field"
            value={stagedFilters.minRating}
            onChange={(e) =>
              setStagedFilters((prev) => ({
                ...prev,
                minRating: Number(e.target.value),
              }))
            }
          />
        </div>

        <div>
          <label htmlFor="agent" className="label mb-2 block">
            Agent
          </label>
          <select
            id="agent"
            className="select-field"
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
        </div>

        <div>
          <label htmlFor="map" className="label mb-2 block">
            Map
          </label>
          <select
            id="map"
            className="select-field"
            value={stagedFilters.map}
            onChange={(e) =>
              setStagedFilters((prev) => ({ ...prev, map: e.target.value }))
            }
          >
            <option value="all">All</option>
          </select>
        </div>

        <div>
          <label htmlFor="timespan" className="label mb-2 block">
            Timespan
          </label>
          <select
            id="timespan"
            className="select-field"
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
      </div>

      <div className="mt-6">
        <button
          className="btn-primary w-full md:w-auto"
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
