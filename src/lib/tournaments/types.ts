export interface TournamentInfoCard {
  id: number;
  vlrEventId: number;
  title: string;
  status: string;
  region: string;
  dates: string;
  prize: string;
  thumb: string;
  urlPath: string;
  canonicalSlug: string;
}

export interface TournamentMatchSummary {
  id: number;
  vlrMatchId: number;
  eventId: number;
  eventTitle: string;
  eventSeries: string;
  team1: string;
  team2: string;
  team1Logo: string;
  team2Logo: string;
  tournamentLogo: string;
  score1: string;
  score2: string;
  scheduledAt: string | null;
  dateLabel: string;
  matchUrl: string;
  status: string;
  slug: string;
}

export interface TournamentFeaturedMatch extends TournamentMatchSummary {
  emphasisLabel: string;
}

export interface TournamentBracketMatch {
  id: number;
  vlrMatchId: number;
  label: string;
  team1: string;
  team2: string;
  team1Logo: string;
  team2Logo: string;
  score1: string;
  score2: string;
  status: string;
  matchHref: string;
}

export interface TournamentBracketRound {
  key: string;
  title: string;
  order: number;
  matches: TournamentBracketMatch[];
}

export interface TournamentBracketSection {
  layout: "bracket" | "stage-board";
  rounds: TournamentBracketRound[];
}

export interface TournamentNewsItem {
  title: string;
  description: string;
  date: string;
  author: string;
  url_path: string;
}

export interface TournamentStatsSummaryItem {
  playerName: string;
  teamName: string;
  rating: number | null;
  averageCombatScore: number | null;
  killDeaths: number | null;
  agents: string;
}

export interface TournamentDetail {
  event: TournamentInfoCard;
  matches: TournamentMatchSummary[];
  featuredMatch: TournamentFeaturedMatch | null;
  bracket: TournamentBracketSection;
  news: TournamentNewsItem[];
  statsSummary: TournamentStatsSummaryItem[];
}
