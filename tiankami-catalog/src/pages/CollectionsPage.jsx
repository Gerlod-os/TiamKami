import { useEffect, useState } from "react";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { isUrl } from "../utils/normalize.js";
import { Link, useNavigate } from "react-router-dom";
import { BRAND } from "../config/branding.js";
import { FaList } from "react-icons/fa";

const CollectionCard = ({ collection, games }) => {
  const navigate = useNavigate();

  // Находим первую игру подборки в основном списке, чтобы получить обложку
  const firstGame = collection.games.length > 0
    ? games.find((g) => g.title && g.title.toLowerCase().includes(collection.games[0].name.toLowerCase()))
    : null;
  const hasValidImage = firstGame && isUrl(firstGame.image);

  const handleClick = () => {
    // Переход в каталог с фильтром по подборке
    navigate(`/catalog?collection=${encodeURIComponent(collection.name)}`);
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
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20"
    >
      {/* Превью — обложка первой игры */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
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
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />
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
