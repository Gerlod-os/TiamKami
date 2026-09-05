import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchGames } from "../utils/loadData";
import { BRAND } from "../config/branding.js";
import GameDetails from "../components/GameDetails";
import { isUrl } from "../utils/normalize.js";
import { FaChevronRight, FaGamepad, FaStar } from "react-icons/fa";

const MiniCard = ({ game, onClick }) => {
  const hasValidImage = isUrl(game.image);
  const isPerfectRating = game.rating === 10;

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
      className="group relative flex-shrink-0 w-44 cursor-pointer transition-all duration-300 hover:-translate-y-2"
    >
      <div className="relative h-24 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 group-hover:border-[var(--accent-purple)]/30 transition-colors">
        {hasValidImage ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">🎮</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
        {game.rating && (
          <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 ${isPerfectRating ? 'animate-pulse' : ''}`}>
            <div className="bg-[var(--accent-purple)] text-[var(--bg-primary)] text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-lg">
              <FaStar className="text-[8px]" />
              {game.rating}
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-white/80 font-bold truncate text-center group-hover:text-[var(--accent-purple)] transition-colors">
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
        console.error("[GamePage] Ошибка загрузки:", err);
        setLoading(false);
      });
  }, []);

  const game = useMemo(() => {
    return games.find((g) => g.slug === slug) || null;
  }, [games, slug]);

  const similarGames = useMemo(() => {
    if (!game || !game.genre) return [];
    const gameGenres = game.genre.split(",").map((g) => g.trim());
    return games
      .filter((g) => {
        if (g.slug === slug) return false;
        const gGenres = (g.genre || "").split(",").map((x) => x.trim());
        return gGenres.some((genre) => gameGenres.includes(genre));
      })
      .slice(0, 6);
  }, [games, game, slug]);

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
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", game.title);
    setMeta("twitter:description", game.notes || game.title);
    if (game.image && isUrl(game.image)) {
      setMeta("twitter:image", game.image);
    }

    const oldScript = document.getElementById("json-ld-game");
    if (oldScript) oldScript.remove();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: game.title,
      description: game.notes || game.title,
      genre: game.genre,
      applicationCategory: "Game",
      aggregateRating: game.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: game.rating,
            bestRating: 10,
          }
        : undefined,
      image: isUrl(game.image) ? game.image : undefined,
    };

    const script = document.createElement("script");
    script.id = "json-ld-game";
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.title = BRAND.siteTitle;
      if (metaDescription) {
        metaDescription.setAttribute("content", `Каталог рогаликов ${BRAND.name}`);
      }
      ["og:title", "og:description", "og:type", "og:image", "og:url"].forEach((prop) => {
        const meta = document.querySelector(`meta[property="${prop}"]`);
        if (meta) meta.remove();
      });
      ["twitter:card", "twitter:title", "twitter:description", "twitter:image"].forEach((prop) => {
        const meta = document.querySelector(`meta[name="${prop}"]`);
        if (meta) meta.remove();
      });
      const removed = document.getElementById("json-ld-game");
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
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6 px-1">
        <Link to="/" className="text-white/60 hover:text-[var(--accent-purple)] transition-colors">
          Главная
        </Link>
        <FaChevronRight size={10} className="text-white/30" />
        <Link to="/catalog" className="text-white/60 hover:text-[var(--accent-purple)] transition-colors">
          Каталог
        </Link>
        <FaChevronRight size={10} className="text-white/30" />
        <span className="text-white/90 font-medium">{game.title}</span>
      </div>

      {/* Баннер — на всю ширину */}
      <div className="relative w-full h-[400px] md:h-[450px] overflow-hidden mb-12">
        {game.image && isUrl(game.image) ? (
          <img
            src={game.image}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20" />
        )}
        {/* Затемнение */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
        {/* Название */}
        <div className="absolute inset-0 flex items-end">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white ml-6 md:ml-12 pb-8 md:pb-12 drop-shadow-2xl">
            {game.title}
          </h1>
        </div>
      </div>

      {/* Детали */}
      <div className="max-w-4xl mx-auto">
        <GameDetails game={game} />
      </div>

      {/* Похожие игры */}
      {similarGames.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl md:text-3xl mb-6 text-white flex items-center gap-3">
            <FaGamepad className="text-[var(--accent-purple)]" />
            Похожие игры
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {similarGames.map((g) => (
              <div key={g.slug} className="snap-start flex-shrink-0 w-44">
                <MiniCard game={g} onClick={() => navigate(`/catalog/${g.slug}`)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;