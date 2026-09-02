import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { slugify } from "../utils/slugify";
import { parseRuDate } from "../utils/date";
import GameCard from "../components/GameCard";
import {
  FaStar,
  FaClock,
  FaCalendarAlt,
  FaGamepad,
  FaList,
} from "react-icons/fa";

const SectionTitle = ({ icon, children }) => (
  <h2 className="text-2xl font-heading flex items-center gap-2 mb-4">
    {icon}
    {children}
  </h2>
);

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGames(), fetchCollections()])
      .then(([gamesData, collectionsData]) => {
        setGames(gamesData);
        setCollections(collectionsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const topRated = useMemo(() => {
    return [...games]
      .filter((g) => g.rating)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 5);
  }, [games]);

  const freshReleases = useMemo(() => {
    return [...games]
      .filter((g) => g.releaseDate)
      .sort(
        (a, b) =>
          (parseRuDate(b.releaseDate) || 0) - (parseRuDate(a.releaseDate) || 0),
      )
      .slice(0, 5);
  }, [games]);

  const lastPlayed = useMemo(() => {
    return [...games]
      .filter((g) => g.playedDate)
      .sort(
        (a, b) =>
          (parseRuDate(b.playedDate) || 0) - (parseRuDate(a.playedDate) || 0),
      )
      .slice(0, 5);
  }, [games]);

  const topByHours = useMemo(() => {
    return [...games]
      .filter((g) => parseFloat(g.hours) > 0)
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
      .slice(0, 5);
  }, [games]);

  if (loading)
    return <div className="text-center py-20">Загрузка данных...</div>;

  return (
    <div className="space-y-12">
      {/* Подборки от Тиана */}
      {collections.length > 0 && (
        <section className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30">
          <h2 className="text-2xl font-heading mb-4 flex items-center gap-2">
            <FaList className="text-accent-pink" />
            Подборки от Тиана
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.slice(0, 3).map((col, idx) => (
              <div key={idx} className="bg-black/20 rounded-xl p-4">
                <h3 className="font-heading text-lg text-accent-pink mb-2">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-sm text-white/60 mb-2">
                    {col.description}
                  </p>
                )}
                <ul className="text-sm text-white/80 space-y-1">
                  {col.games.slice(0, 5).map((g, i) => (
                    <li key={i}>{g.name}</li>
                  ))}
                </ul>
                {col.games.length > 5 && (
                  <p className="text-xs text-white/40 mt-2">
                    и ещё {col.games.length - 5}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Топ-5 по оценкам */}
      <section>
        <SectionTitle icon={<FaStar className="text-yellow-400" />}>
          Топ-5 по оценкам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topRated.map((game) => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Свежие релизы */}
      <section>
        <SectionTitle icon={<FaCalendarAlt className="text-accent-blue" />}>
          Свежие релизы
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {freshReleases.map((game) => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Последние сыгранные */}
      <section>
        <SectionTitle icon={<FaGamepad className="text-accent-purple" />}>
          Последние сыгранные
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {lastPlayed.map((game) => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Топ по часам */}
      <section>
        <SectionTitle icon={<FaClock className="text-white/70" />}>
          Топ по часам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topByHours.map((game) => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
