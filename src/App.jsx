import Layout from "./components/Layout";
import Matches from "./components/Matches";
import Results from "./components/Results";
import Home from "./pages/Home";
import Tournaments from "./components/Tournaments";
import News from "./components/News";
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import MatchPage from "./pages/MatchPage";
import StatsPage from "./pages/StatsPage";
import TournamentPage from "./pages/TournamentPage";
import NewsPage from "./pages/NewsPage";

function App() {
  const [selectedNews, setSelectedNews] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="home" element={<Home />} />
        <Route path="matches" element={<MatchPage />} />
        <Route path="tournaments" element={<TournamentPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
