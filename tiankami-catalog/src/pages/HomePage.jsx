import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import { isUrl } from "../utils/normalize.js";
import { BRAND } from "../config/branding.js";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import TwitchWidgetInHero from "../components/TwitchWidgetInHero";
import { useCounter } from "../utils/useCounter.js";
import {
  FaStar,
  FaClock,
  FaCalendarAlt,
  FaGamepad,
  FaList,
  FaSkull,
  FaCheckCircle,
  FaEye,
} from "react-icons/fa";

const SectionTitle = ({ icon, color, children }) => (
  <h2 className="text-2xl font-heading flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
    <span className={color}>{icon}</span>
    {children}
  </h2>
);

// ─── Анимированная карточка статистики ───
const StatCard = ({ icon, value, label, color, bgColor }) => {
  const animatedValue = useCounter(value);
  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 border border-white/5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--accent-purple)]/10">
      <div className={`p-3 rounded-full ${bgColor}`}>{icon}</div>
      <div>
        <div className={`text-2xl font-bold font-mono ${color}`}>{animatedValue}</div>
        <div className="text-white/60 text-sm">{label}</div>
      </div>
    </div>
  );
};

// ─── Горизонтальный скролл для топов ───
const TopSection = ({ title, icon, iconColor, games, navigate }) => (
  <section className="animate-fade-in">
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
      <h2 className={`text-2xl font-heading flex items-center gap-2 ${iconColor}`}>
        <span>{icon}</span>
        {title}
      </h2>
      <button
        onClick={() => navigate("/catalog")}
        className="text-sm text-[var(--accent-purple)] hover:text-white transition-colors"
      >
        Все →
      </button>
    </div>
    <div className="flex gap-4 overflow-x-auto snap-x pb-4">
      {games.map((game) => (
        <div key={game.slug} className="snap-start flex-shrink-0 w-64">
          <GameCard
            game={game}
            onClick={() => navigate(`/catalog/${game.slug}`)}
          />
        </div>
      ))}
    </div>
  </section>
);

// ─── Карточка подборки с мини-превью ───
const CollectionCard = ({ collection, games }) => {
  const firstGame =
    collection.games.length > 0
      ? games.find(
          (g) =>
            g.title &&
            g.title.toLowerCase() === collection.games[0].name.toLowerCase(),
        )
      : null;
  const hasValidImage = firstGame && isUrl(firstGame.image);

  const collectionGames = collection.games
    .slice(0, 4)
    .map((cg) => games.find((g) => g.title?.toLowerCase() === cg.name?.toLowerCase()))
    .filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (window.location.href = "/collections")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = "/collections";
        }
      }}
      aria-label={`Подборка: ${collection.name}`}
      className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--accent-purple)]/20 hover:border-white/20"
    >
      {/* Обложка */}
      <div className="relative h-40 overflow-hidden">
        {hasValidImage ? (
          <img
            src={firstGame.image}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20">
            <FaList className="text-4xl text-[var(--accent-purple)]/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading text-xl text-white font-bold truncate drop-shadow-lg">
            {collection.name}
          </h3>
          <p className="text-xs text-white/70 mt-1">
            {collection.games.length} игр
          </p>
        </div>
      </div>

      {/* Описание */}
      {collection.description && (
        <div className="p-4 pt-3">
          <p className="text-xs text-white/50 line-clamp-2">
            {collection.description}
          </p>
        </div>
      )}

      {/* Мини-карточки игр */}
      {collectionGames.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto snap-x pb-2">
            {collectionGames.map((game, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-20">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-20 h-28 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Главная страница ───
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

  // Мета-теги
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
    setMeta(
      "og:description",
      `Каталог рогаликов ${BRAND.name}: ${games.length} игр с оценками, прогрессом и заметками стримера.`,
    );
    setMeta("og:type", "website");
    setMeta("og:url", BRAND.siteUrl);
    setMeta("og:image", `${BRAND.siteUrl}/assets/hero-CLDdwZDr.png`);
  }, [games.length]);

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
  const totalHours = Math.round(
    games.reduce((sum, g) => sum + (parseFloat(g.hours) || 0), 0),
  );

  // Hero-изображение — последняя сыгранная или случайная из топа
  const heroImageUrl =
    lastPlayed[0]?.image ||
    topRated[0]?.image ||
    `${BRAND.siteUrl}/assets/hero-CLDdwZDr.png`;

  if (loading)
    return <div className="text-center py-20">Загрузка данных...</div>;

  return (
    <div className="space-y-12">
      {/* ═══════ HERO-СЕКЦИЯ ═══════ */}
      <section className="relative rounded-3xl overflow-hidden mb-12">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Двойной градиент */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-bold font-heading text-white mb-4">
            Каталог рогаликов
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-xl">
            {totalGames} игр с оценками, прогрессом и заметками стримера.
          </p>

          <div className="flex flex-wrap gap-6 items-center">
            <TwitchWidgetInHero />
            <div className="flex gap-4 text-sm text-white/60">
              <span>⚔️ {completedGames} пройдено</span>
              <span>🕐 {totalHours} часов</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ СТАТИСТИКА ═══════ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        <StatCard
          icon={<FaGamepad className="text-2xl text-[var(--accent-purple)]" />}
          value={totalGames}
          label="Архив игр"
          color="text-white"
          bgColor="bg-[var(--accent-purple)]/20"
        />
        <StatCard
          icon={<FaCheckCircle className="text-2xl text-emerald-400" />}
          value={completedGames}
          label="Пройдено"
          color="text-emerald-400"
          bgColor="bg-emerald-400/20"
        />
        <StatCard
          icon={<FaSkull className="text-2xl text-red-400" />}
          value={droppedGames}
          label="Дропнутые"
          color="text-red-400"
          bgColor="bg-red-400/20"
        />
        <StatCard
          icon={<FaEye className="text-2xl text-blue-400" />}
          value={reviewGames}
          label="Обзор"
          color="text-blue-400"
          bgColor="bg-blue-400/20"
        />
        <StatCard
          icon={<FaClock className="text-2xl text-amber-400" />}
          value={totalHours}
          label="Часов в играх"
          color="text-amber-400"
          bgColor="bg-amber-400/20"
        />
      </section>

      {/* ═══════ ПОДБОРКИ ═══════ */}
      {collections.length > 0 && (
        <section className="animate-fade-in-delay" style={{ animationDelay: "0.4s" }}>
          <SectionTitle icon={<FaList className="text-[var(--accent-pink)]" />} color="text-[var(--accent-pink)]">
            Подборки от Тиана
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col, idx) => (
              <div key={idx} className="animate-fade-in" style={{ animationDelay: `${0.4 + idx * 100}ms` }}>
                <CollectionCard collection={col} games={games} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ ТОПЫ — ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ ═══════ */}
      <TopSection
        title="Топ по оценкам"
        icon={<FaStar className="text-yellow-400" />}
        iconColor="text-yellow-400"
        games={topRated}
        navigate={navigate}
      />

      <TopSection
        title="Свежие релизы"
        icon={<FaCalendarAlt className="text-blue-400" />}
        iconColor="text-blue-400"
        games={freshReleases}
        navigate={navigate}
      />

      <TopSection
        title="Последние сыгранные"
        icon={<FaGamepad className="text-[var(--accent-purple)]" />}
        iconColor="text-[var(--accent-purple)]"
        games={lastPlayed}
        navigate={navigate}
      />

      <TopSection
        title="Топ по часам"
        icon={<FaClock className="text-amber-400" />}
        iconColor="text-amber-400"
        games={topByHours}
        navigate={navigate}
      />

      {quickViewGame && (
        <GameModal game={quickViewGame} onClose={() => setQuickViewGame(null)} />
      )}
    </div>
  );
};

export default HomePage;
