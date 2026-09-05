import { useEffect, useState } from "react";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { isUrl } from "../utils/normalize.js";
import { useNavigate } from "react-router-dom";
import { BRAND } from "../config/branding.js";
import { FaList } from "react-icons/fa";

const CollectionCard = ({ collection, games }) => {
  const navigate = useNavigate();

  // Находим первую игру подборки в основном списке, чтобы получить обложку
  const firstGame = collection.games.length > 0
    ? games.find((g) => g.title && g.title.toLowerCase() === collection.games[0].name.toLowerCase())
    : null;
  const hasValidImage = firstGame && isUrl(firstGame.image);

  const handleClick = () => {
    // Переход на страницу подборки по slug
    navigate(`/collections/${collection.slug}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Подборка: ${collection.name}`}
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--accent-purple)]/10 hover:border-[var(--accent-purple)]/30"
    >
      {/* Превью — обложка первой игры */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={firstGame.image}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20">
            <FaList className="text-5xl text-[var(--accent-purple)]/40" />
          </div>
        )}
        {/* Затемнение снизу + оверлей при наведении */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute inset-0 bg-transparent group-hover:bg-[var(--accent-purple)]/10 transition-colors duration-300" />
        {/* Бейдж с количеством */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-[var(--accent-purple)] backdrop-blur-sm rounded-lg text-xs font-bold text-white shadow-lg">
          {collection.games.length} {collection.games.length === 1 ? "игра" : collection.games.length < 5 ? "игры" : "игр"}
        </div>
        {/* Стрелка при наведении */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 group-hover:bg-[var(--accent-purple)] group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100">
          →
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        <h3 className="font-heading text-lg text-white font-bold mb-1 truncate group-hover:text-[var(--accent-purple)] transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs text-white/50 mb-3 line-clamp-2">
            {collection.description}
          </p>
        )}
        <ul className="text-xs text-white/60 space-y-0.5">
          {collection.games.slice(0, 3).map((g, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-[var(--accent-purple)]/50 text-[8px]">●</span>
              <span className="truncate">{g.name}</span>
              {g.rank && (
                <span className="text-[var(--accent-purple)]/70 ml-auto flex-shrink-0 text-[10px]">
                  #{g.rank}
                </span>
              )}
            </li>
          ))}
        </ul>
        {collection.games.length > 3 && (
          <p className="text-[10px] text-white/30 mt-2">
            + ещё {collection.games.length - 3}...
          </p>
        )}
      </div>
    </div>
  );
};

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [games, setGames] = useState([]);
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

  // Мета-теги для страницы подборок
  useEffect(() => {
    document.title = `Подборки от ${BRAND.name}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `Тематические подборки рогаликов: ${collections.map((c) => c.name).join(", ")}.`,
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
    setMeta("og:title", `Подборки от ${BRAND.name}`);
    setMeta("og:description", `Тематические подборки рогаликов: ${collections.map((c) => c.name).join(", ")}.`);
    setMeta("og:type", "website");
    setMeta("og:url", `${BRAND.siteUrl}/collections`);
    setMeta("og:image", `${BRAND.siteUrl}/assets/hero-CLDdwZDr.png`);
  }, [collections]);

  if (loading)
    return <div className="text-center py-20">Загрузка подборок...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-6">Подборки от Тиана</h1>
      {collections.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/70">Подборок пока нет.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col, idx) => (
            <CollectionCard
              key={idx}
              collection={col}
              games={games}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
