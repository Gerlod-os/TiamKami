import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchGames } from "../utils/loadData";
import { BRAND } from "../config/branding.js";
import GameDetails from "../components/GameDetails";
import { isUrl } from "../utils/normalize.js";
import { FaChevronRight, FaGamepad } from "react-icons/fa";

const MiniCard = ({ game, onClick }) => {
  const hasValidImage = isUrl(game.image);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex-shrink-0 w-36 sm:w-44 cursor-pointer transition-all duration-200 hover:-translate-y-1"
    >
      <div className="relative h-20 sm:h-28 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">🎮</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <div
          className={`absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg font-bold text-xs ${
            game.rating === 10
              ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950"
              : "bg-black/60 backdrop-blur-sm text-white"
          }`}
        >
          {game.rating || "—"}
        </div>
      </div>
      <p className="mt-1.5 text-xs sm:text-sm text-white font-bold truncate text-center">
        {game.title}
      </p>
    </div>
  );
};

const GamePage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames()
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[GamePage] Ошибка загрузки:', err);
        setLoading(false);
      });
  }, []);

  // Находим игру по слагу
  const game = useMemo(() => {
    const found = games.find((g) => g.slug === slug);
    return found || null;
  }, [games, slug]);

  // Похожие игры — из того же жанра (максимум 4, без текущей)
  const similarGames = useMemo(() => {
    if (!game || !game.genre) return [];
    const gameGenres = game.genre.split(",").map((g) => g.trim());
    return games
      .filter((g) => {
        if (g.slug === slug) return false;
        const gGenres = (g.genre || "").split(",").map((x) => x.trim());
        return gGenres.some((genre) => gameGenres.includes(genre));
      })
      .slice(0, 4);
  }, [games, game, slug]);

  // Мета-теги для соцсетей
  useEffect(() => {
    if (!game) return;

    document.title = `${game.title} — ${BRAND.siteTitle}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", game.notes || game.title);
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
    setMeta("og:title", game.title);
    setMeta("og:description", game.notes || game.title);
    setMeta("og:type", "website");
    setMeta("og:url", `${BRAND.siteUrl}/catalog/${slug}`);
    if (game.image && isUrl(game.image)) {
      setMeta("og:image", game.image);
    }

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", game.title);
    setMeta("twitter:description", game.notes || game.title);
    if (game.image && isUrl(game.image)) {
      setMeta("twitter:image", game.image);
    }

    // JSON-LD разметка для Google
    const oldScript = document.getElementById('json-ld-game');
    if (oldScript) oldScript.remove();

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.title,
      description: game.notes || game.title,
      genre: game.genre,
      gameItem: { '@type': 'GameServer', 'maxPlayers': 1 },
      applicationCategory: 'Game',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: game.rating ? {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        bestRating: 10,
      } : undefined,
      image: isUrl(game.image) ? game.image : undefined,
    };

    const script = document.createElement('script');
    script.id = 'json-ld-game';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup
    return () => {
      document.title = BRAND.siteTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `Каталог рогаликов ${BRAND.name}`,
        );
      }
      ["og:title", "og:description", "og:type", "og:image", "og:url"].forEach((prop) => {
        const meta = document.querySelector(`meta[property="${prop}"]`);
        if (meta) meta.remove();
      });
      ["twitter:card", "twitter:title", "twitter:description", "twitter:image"].forEach((prop) => {
        const meta = document.querySelector(`meta[name="${prop}"]`);
        if (meta) meta.remove();
      });
      const removed = document.getElementById('json-ld-game');
      if (removed) removed.remove();
    };
  }, [game]);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  if (!game) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl mb-4">Игра не найдена</h1>
        <p className="text-white/60 mb-4">Проверьте слаг: {slug}</p>
        <Link to="/catalog" className="text-accent-pink hover:text-white">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero-баннер: обложка-фон + название поверх */}
      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20">
        {game.image && isUrl(game.image) ? (
          <img
            src={game.image}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/30 to-accent-pink/30" />
        )}

        {/* Затемнение — градиент по двум осям */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />

        {/* Хлебные крошки */}
        <div className="relative z-10 px-4 py-3 flex items-center gap-2 text-sm text-white/60">
          <Link to="/" className="hover:text-accent-pink">
            Главная
          </Link>
          <FaChevronRight size={12} />
          <Link to="/catalog" className="hover:text-accent-pink">
            Каталог
          </Link>
          <FaChevronRight size={12} />
          <span className="text-white">{game.title}</span>
        </div>

        {/* Название игры поверх обложки */}
        <div className="relative z-10 px-4 pb-8 md:px-8 md:pb-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white drop-shadow-2xl">
            {game.title}
          </h1>
        </div>
      </div>

      {/* Детали */}
      <div className="max-w-4xl mx-auto">
        <GameDetails game={game} />
      </div>

      {/* Похожие игры — горизонтальный скролл */}
      {similarGames.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="font-heading text-2xl mb-5 text-white flex items-center gap-2">
            <FaGamepad className="text-purple-400" />
            Похожие игры
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {similarGames.map((g) => (
              <div key={g.slug} className="snap-start">
                <MiniCard
                  game={g}
                  onClick={() => navigate(`/catalog/${g.slug}`)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
