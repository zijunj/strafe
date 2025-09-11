import useValorantApiWithCache from "../api/Valorant.js";

export default function Stats(props) {
  const { filters } = props;
  const cacheKey = `stats-${filters.region}-${filters.timespan}`;

  const { data: statsData, loading } = useValorantApiWithCache({
    key: cacheKey,
    url: `/api/stats?region=${filters.region}&timespan=${filters.timespan}`,
    parse: (res) => res.data.segments,
  });

  if (loading) return <p>Loading...</p>;
  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Top Player Stats</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {statsData?.slice(0, 5).map((item, i) => (
          <article
            key={i}
            className="bg-gray-800 text-white rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold mb-2">
              {item.player}{" "}
              <span className="text-sm text-gray-400">({item.org})</span>
            </h2>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Rating: {item.rating}</li>
              <li>ACS: {item.average_combat_score}</li>
              <li>K/D: {item.kill_deaths}</li>
              <li>KAST: {item.kill_assists_survived_traded}</li>
              <li>ADR: {item.average_damage_per_round}</li>
              <li>Kills/Round: {item.kills_per_round}</li>
              <li>Assists/Round: {item.assists_per_round}</li>
              <li>First Kills/Round: {item.first_kills_per_round}</li>
              <li>First Deaths/Round: {item.first_deaths_per_round}</li>
              <li>HS%: {item.headshot_percentage}</li>
              <li>Clutch %: {item.clutch_success_percentage}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
