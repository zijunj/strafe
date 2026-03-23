import { Suspense } from "react";
import MatchesPageClient from "./MatchesPagesClient";

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading matches...</div>}>
      <MatchesPageClient />
    </Suspense>
  );
}
