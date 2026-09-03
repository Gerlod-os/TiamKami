import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import GameCard from "../components/GameCard";
import TwitchWidget from "../components/TwitchWidget";
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

const ToggleList = ({ visible, onToggle }) => (
  <button
    onClick={onToggle}
    className="mt-4 text-accent-pink hover:text-white transition-colors text-sm font-medium"
  >
    {visible ? "Свернуть" : "Показать все"}
  </button>
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

  // Один useMemo — один проход по массиву, вместо 4 отдельных копий
  const homeData = useMemo(() => {
    const topRated = [...games]
      .filter((g) => g.rating)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 5);

    const freshReleases = [...games]
      .filter((g) => g.releaseDate)
      .sort(
        (a, b) =>
          (parseRuDate(b.releaseDate) || 0) - (parseRuDate(a.releaseDate) || 0),
      )
      .slice(0, 5);

    const lastPlayed = [...games]
      .filter((g) => g.playedDate)
      .sort(
        (a, b) =>
          (parseRuDate(b.playedDate) || 0) - (parseRuDate(a.playedDate) || 0),
      )
      .slice(0, 5);

    const topByHours = [...games]
      .filter((g) => parseFloat(g.hours) > 0)
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
      .slice(0, 5);

    return { topRated, freshReleases, lastPlayed, topByHours };
  }, [games]);

  const { topRated, freshReleases, lastPlayed, topByHours } = homeData;

  // Статистика
  const totalGames = games.length;
  const completedGames = games.filter((g) => g.status === "Пройдено").length;
  const droppedGames = games.filter((g) => g.status === "Дропнуто").length;
  const reviewGames = games.filter((g) => g.status === "Обзор").length;
  const totalHours = games.reduce(
    (sum, g) => sum + (parseFloat(g.hours) || 0),
    0,
  );

  // Состояние для раскрытия списка
  const [showAllTopRated, setShowAllTopRated] = useState(false);
  const [showAllFreshReleases, setShowAllFreshReleases] = useState(false);
  const [showAllLastPlayed, setShowAllLastPlayed] = useState(false);
  const [showAllTopByHours, setShowAllTopByHours] = useState(false);

  if (loading)
    return <div className="text-center py-20">Загрузка данных...</div>;

  return (
    <div className="space-y-12">
      {/* Twitch: статус и аватарка */}
      <TwitchWidget />

      {/* Статистика */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 rounded-xl border border-accent-purple/30 p-4 text-center">
          <div className="text-3xl font-bold text-white font-mono">
            {totalGames}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
            Архив игр
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-emerald-900/30 p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            {completedGames}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
            Пройдено
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-red-900/30 p-4 text-center">
          <div className="text-3xl font-bold text-red-400 font-mono">
            {droppedGames}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
            Дропнутые
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-blue-900/30 p-4 text-center">
          <div className="text-3xl font-bold text-blue-400 font-mono">
            {reviewGames}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
            Обзор
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-purple-900/30 p-4 text-center">
          <div className="text-3xl font-bold text-purple-400 font-mono">
            {Math.round(totalHours)}
          </div>
          <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
            Часов в играх
          </div>
        </div>
      </section>

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
          Топ по оценкам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllTopRated ? topRated : topRated.slice(0, 5)).map((game) => (
            <Link to={`/catalog/${game.slug}`} key={game.slug}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
        {topRated.length > 5 && (
          <ToggleList
            visible={showAllTopRated}
            onToggle={() => setShowAllTopRated(!showAllTopRated)}
          />
        )}
      </section>

      {/* Свежие релизы */}
      <section>
        <SectionTitle icon={<FaCalendarAlt className="text-accent-blue" />}>
          Свежие релизы
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllFreshReleases
            ? freshReleases
            : freshReleases.slice(0, 5)
          ).map((game) => (
            <Link to={`/catalog/${game.slug}`} key={game.slug}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
        {freshReleases.length > 5 && (
          <ToggleList
            visible={showAllFreshReleases}
            onToggle={() => setShowAllFreshReleases(!showAllFreshReleases)}
          />
        )}
      </section>

      {/* Последние сыгранные */}
      <section>
        <SectionTitle icon={<FaGamepad className="text-accent-purple" />}>
          Последние сыгранные
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllLastPlayed ? lastPlayed : lastPlayed.slice(0, 5)).map(
            (game) => (
              <Link to={`/catalog/${game.slug}`} key={game.slug}>
                <GameCard game={game} />
              </Link>
            ),
          )}
        </div>
        {lastPlayed.length > 5 && (
          <ToggleList
            visible={showAllLastPlayed}
            onToggle={() => setShowAllLastPlayed(!showAllLastPlayed)}
          />
        )}
      </section>

      {/* Топ по часам */}
      <section>
        <SectionTitle icon={<FaClock className="text-white/70" />}>
          Топ по часам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllTopByHours ? topByHours : topByHours.slice(0, 5)).map(
            (game) => (
              <Link to={`/catalog/${game.slug}`} key={game.slug}>
                <GameCard game={game} />
              </Link>
            ),
          )}
        </div>
        {topByHours.length > 5 && (
          <ToggleList
            visible={showAllTopByHours}
            onToggle={() => setShowAllTopByHours(!showAllTopByHours)}
          />
        )}
      </section>
    </div>
  );
};

export default HomePage;
