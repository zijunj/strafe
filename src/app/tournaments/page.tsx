import TournamentsPageClient from "./TournamentsPageClient";

export default async function TournamentsPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const initialTournamentView =
    searchParams.tab === "upcoming" ? "upcoming" : "ongoing";

  return (
    <TournamentsPageClient initialTournamentView={initialTournamentView} />
  );
}
