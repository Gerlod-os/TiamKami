import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import { isUrl } from "../utils/normalize.js";
import { BRAND } from "../config/branding.js";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import TwitchWidget from "../components/TwitchWidget";
import {
  FaStar,
  FaClock,
  FaCalendarAlt,
  FaGamepad,
  FaList,
  FaSkull,
  FaCheckCircle,
  FaEye,
  FaSearchPlus,
} from "react-icons/fa";

const SectionTitle = ({ icon, color, children }) => (
  <h2 className="text-2xl font-heading flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
    <span className={color}>{icon}</span>
    {children}
  </h2>
);

const ShowAllButton = ({ visible, onToggle }) => (
  <button
    onClick={onToggle}
    className="mt-5 px-5 py-2.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5 flex items-center gap-2 mx-auto w-fit"
  >
    {visible ? (
      <>
        <FaSearchPlus size={14} /> Свернуть
      </>
    ) : (
      <>
        <FaSearchPlus size={14} /> Показать все
      </>
    )}
  </button>
);

const CollectionCard = ({ collection, games }) => {
  // Находим первую игру подборки в основном списке, чтобы получить обложку
  const firstGame = collection.games.length > 0
    ? games.find((g) => g.title && g.title.toLowerCase().includes(collection.games[0].name.toLowerCase()))
    : null;
  const hasValidImage = firstGame && isUrl(firstGame.image);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => window.location.href = "/collections"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = "/collections";
        }
      }}
      aria-label={`Подборка: ${collection.name}`}
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20"
    >
      {/* Превью — обложка первой игры */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={firstGame.image}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-pink-900/30">
            <FaList className="text-4xl text-purple-400/50" />
          </div>
        )}
        {/* Затемнение снизу + оверлей при наведении */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-colors duration-300" />
        {/* Бейдж с количеством */}
        <div className="absolute bottom-2 left-3 px-2.5 py-1 bg-purple-600/80 backdrop-blur-sm rounded-lg text-xs font-bold text-white">
          {collection.games.length} игр
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-white font-bold mb-1 truncate">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs text-white/50 mb-3 line-clamp-2">
            {collection.description}
          </p>
        )}
        <ul className="text-xs text-white/70 space-y-1">
          {collection.games.slice(0, 4).map((g, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-purple-400/60">•</span>
              <span className="truncate">{g.name}</span>
            </li>
          ))}
        </ul>
        {collection.games.length > 4 && (
          <p className="text-[10px] text-white/30 mt-2">
            + ещё {collection.games.length - 4}...
          </p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, color, bgColor }) => (
  <div className={`${bgColor} rounded-2xl border p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
    <div className="flex justify-center mb-2">{icon}</div>
    <div className={`text-3xl font-bold font-mono ${color}`}>
      {value}
    </div>
    <div className="text-xs text-white/50 uppercase tracking-wide mt-1">
      {label}
    </div>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewGame, setQuickViewGame] = useState(null);

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

  // Мета-теги для главной страницы
  useEffect(() => {
    document.title = BRAND.siteTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `Каталог рогаликов ${BRAND.name}: ${games.length} игр с оценками, прогрессом и заметками стримера.`,
      );
    }

    const setMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };
    setMeta("og:title", BRAND.siteTitle);
    setMeta("og:description", `Каталог рогаликов ${BRAND.name}: ${games.length} игр с оценками, прогрессом и заметками стримера.`);
    setMeta("og:type", "website");
    setMeta("og:url", BRAND.siteUrl);
  }, []);

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
        {[
          { icon: <FaGamepad className="text-3xl text-purple-400" />, value: totalGames, label: "Архив игр", color: "text-white", border: "border-purple-500/20" },
          { icon: <FaCheckCircle className="text-3xl text-emerald-400" />, value: completedGames, label: "Пройдено", color: "text-emerald-400", border: "border-emerald-500/20" },
          { icon: <FaSkull className="text-3xl text-red-400" />, value: droppedGames, label: "Дропнутые", color: "text-red-400", border: "border-red-500/20" },
          { icon: <FaEye className="text-3xl text-blue-400" />, value: reviewGames, label: "Обзор", color: "text-blue-400", border: "border-blue-500/20" },
          { icon: <FaClock className="text-3xl text-amber-400" />, value: Math.round(totalHours), label: "Часов в играх", color: "text-amber-400", border: "border-amber-500/20" },
        ].map((stat, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <StatCard
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              color={stat.color}
              bgColor="bg-white/5 rounded-2xl border border-white/10 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            />
          </div>
        ))}
      </section>

      {/* Подборки от Тиана */}
      {collections.length > 0 && (
        <section className="animate-fade-in-delay" style={{ animationDelay: "0.4s" }}>
          <SectionTitle icon={<FaList className="text-pink-400" />} color="text-pink-400">
            Подборки от Тиана
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col, idx) => (
              <div key={idx} className="animate-fade-in" style={{ animationDelay: `${0.4 + idx * 100}ms` }}>
                <CollectionCard
                  collection={col}
                  games={games}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Топ-5 по оценкам */}
      <section className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
        <SectionTitle icon={<FaStar className="text-yellow-400" />} color="text-yellow-400">
          Топ по оценкам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllTopRated ? topRated : topRated.slice(0, 5)).map((game, i) => (
            <div key={game.slug} className="animate-fade-in" style={{ animationDelay: `${0.8 + i * 50}ms` }}>
              <GameCard
                game={game}
                onQuickView={() => setQuickViewGame(game)}
                onClick={() => navigate(`/catalog/${game.slug}`)}
              />
            </div>
          ))}
        </div>
        {topRated.length > 5 && (
          <ShowAllButton
            visible={showAllTopRated}
            onToggle={() => setShowAllTopRated(!showAllTopRated)}
          />
        )}
      </section>

      {/* Свежие релизы */}
      <section className="animate-fade-in" style={{ animationDelay: "1s" }}>
        <SectionTitle icon={<FaCalendarAlt className="text-blue-400" />} color="text-blue-400">
          Свежие релизы
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllFreshReleases
            ? freshReleases
            : freshReleases.slice(0, 5)
          ).map((game, i) => (
            <div key={game.slug} className="animate-fade-in" style={{ animationDelay: `${1 + i * 50}ms` }}>
              <GameCard
                game={game}
                onQuickView={() => setQuickViewGame(game)}
                onClick={() => navigate(`/catalog/${game.slug}`)}
              />
            </div>
          ))}
        </div>
        {freshReleases.length > 5 && (
          <ShowAllButton
            visible={showAllFreshReleases}
            onToggle={() => setShowAllFreshReleases(!showAllFreshReleases)}
          />
        )}
      </section>

      {/* Последние сыгранные */}
      <section className="animate-fade-in" style={{ animationDelay: "1.2s" }}>
        <SectionTitle icon={<FaGamepad className="text-purple-400" />} color="text-purple-400">
          Последние сыгранные
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllLastPlayed ? lastPlayed : lastPlayed.slice(0, 5)).map(
            (game, i) => (
              <div key={game.slug} className="animate-fade-in" style={{ animationDelay: `${1.2 + i * 50}ms` }}>
                <GameCard
                  game={game}
                  onQuickView={() => setQuickViewGame(game)}
                  onClick={() => navigate(`/catalog/${game.slug}`)}
                />
              </div>
            ),
          )}
        </div>
        {lastPlayed.length > 5 && (
          <ShowAllButton
            visible={showAllLastPlayed}
            onToggle={() => setShowAllLastPlayed(!showAllLastPlayed)}
          />
        )}
      </section>

      {/* Топ по часам */}
      <section className="animate-fade-in" style={{ animationDelay: "1.4s" }}>
        <SectionTitle icon={<FaClock className="text-amber-400" />} color="text-amber-400">
          Топ по часам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(showAllTopByHours ? topByHours : topByHours.slice(0, 5)).map(
            (game, i) => (
              <div key={game.slug} className="animate-fade-in" style={{ animationDelay: `${1.4 + i * 50}ms` }}>
                <GameCard
                  game={game}
                  onQuickView={() => setQuickViewGame(game)}
                  onClick={() => navigate(`/catalog/${game.slug}`)}
                />
              </div>
            ),
          )}
        </div>
        {topByHours.length > 5 && (
          <ShowAllButton
            visible={showAllTopByHours}
            onToggle={() => setShowAllTopByHours(!showAllTopByHours)}
          />
        )}
      </section>

      {quickViewGame && (
        <GameModal game={quickViewGame} onClose={() => setQuickViewGame(null)} />
      )}
    </div>
  );
};

export default HomePage;
