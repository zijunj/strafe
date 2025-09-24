"use client";

import FilterPanel from "@/components/FilterPanel";
import Stats from "@/components/Stats";
import { useState } from "react";

export default function StatsPage() {
  const [filters, setFilters] = useState({
    eventSeries: "All",
    region: "na", // default that maps to your API
    minRounds: 200,
    minRating: 1550,
    agent: "All",
    map: "All",
    timespan: "30",
  });
  return (
    <>
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onApply={() => console.log(filters)}
      />
      <Stats filters={filters} />
    </>
  );
}
