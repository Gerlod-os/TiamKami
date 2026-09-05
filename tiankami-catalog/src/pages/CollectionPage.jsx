import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { BRAND } from "../config/branding.js";
import { isUrl } from "../utils/normalize.js";
import { FaChevronRight, FaList, FaStar } from "react-icons/fa";

const CollectionPage = () => {
  const { slug } = useParams();
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
        console.error("[CollectionPage] Ошибка загрузки:", err);
        setLoading(false);
      });
  }, []);

  const collection = useMemo(() => {
    return collections.find((c) => c.slug === slug) || null;
  }, [collections, slug]);

  // Сортируем игры подборки по рангу (сначала с рангом, потом без)
  const orderedGames = useMemo(() => {
    if (!collection) return [];
    const ranked = collection.games.filter((g) => g.rank && g.rank.trim() !== "");
    const unranked = collection.games.filter(
      (g) => !g.rank || g.rank.trim() === "",
    );
    ranked.sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
    return [...ranked, ...unranked];
  }, [collection]);

  // Находим игры из orderedGames в основном списке
  const matchedGames = useMemo(() => {
    return orderedGames.map((colGame) => {
      const game = games.find(
        (g) => (g.title || "").toLowerCase() === colGame.name.toLowerCase(),
      );
      return { ...colGame, game };
    });
  }, [orderedGames, games]);

  const firstGameImage = matchedGames[0]?.game?.image;
  const hasValidImage = firstGameImage && isUrl(firstGameImage);

  // SEO meta tags
  useEffect(() => {
    if (!collection) return;

    document.title = `${collection.name} — ${BRAND.siteTitle}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        collection.description || `Подборка рогаликов: ${collection.name}`,
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
    setMeta("og:title", collection.name);
    setMeta(
      "og:description",
      collection.description || `Подборка рогаликов: ${collection.name}`,
    );
    setMeta("og:type", "website");
    setMeta("og:url", `${BRAND.siteUrl}/collections/${slug}`);
    if (hasValidImage) {
      setMeta("og:image", firstGameImage);
    }
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", collection.name);
    setMeta(
      "twitter:description",
      collection.description || `Подборка рогаликов: ${collection.name}`,
    );
    if (hasValidImage) {
      setMeta("twitter:image", firstGameImage);
    }

    // JSON-LD
    const oldScript = document.getElementById("json-ld-collection");
    if (oldScript) oldScript.remove();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: collection.name,
      description: collection.description || "",
      numberOfItems: collection.games.length,
      itemListElement: orderedGames.slice(0, 10).map((colGame, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "VideoGame",
          name: colGame.name,
        },
      })),
    };

    const script = document.createElement("script");
    script.id = "json-ld-collection";
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.title = BRAND.siteTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `Каталог рогаликов ${BRAND.name}`,
        );
      }
      [
        "og:title",
        "og:description",
        "og:type",
        "og:image",
        "og:url",
      ].forEach((prop) => {
        const meta = document.querySelector(`meta[property="${prop}"]`);
        if (meta) meta.remove();
      });
      ["twitter:card", "twitter:title", "twitter:description", "twitter:image"].forEach(
        (prop) => {
          const meta = document.querySelector(`meta[name="${prop}"]`);
          if (meta) meta.remove();
        },
      );
      const removed = document.getElementById("json-ld-collection");
      if (removed) removed.remove();
    };
  }, [collection, slug, orderedGames, hasValidImage, firstGameImage]);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  if (!collection) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl mb-4">Подборка не найдена</h1>
        <p className="text-white/60 mb-4">
          Проверьте URL или вернитесь к списку подборок.
        </p>
        <Link
          to="/collections"
          className="text-accent-pink hover:text-white inline-block"
        >
          ← Вернуться к подборкам
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
        <Link
          to="/collections"
          className="text-white/60 hover:text-[var(--accent-purple)] transition-colors"
        >
          Подборки
        </Link>
        <FaChevronRight size={10} className="text-white/30" />
        <span className="text-white/90 font-medium">{collection.name}</span>
      </div>

      {/* Баннер */}
      <div className="relative w-full h-[300px] md:h-[350px] overflow-hidden mb-12">
        {hasValidImage ? (
          <img
            src={firstGameImage}
            alt={collection.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-purple)]/30 to-[var(--accent-pink)]/30" />
        )}
        {/* Затемнение */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
        {/* Название подборки */}
        <div className="absolute inset-0 flex items-end">
          <div className="ml-6 md:ml-12 pb-6 md:pb-8">
            <div className="flex items-center gap-2 mb-2">
              <FaList className="text-[var(--accent-purple)]" />
              <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                Подборка
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white drop-shadow-2xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-white/70 mt-2 text-sm md:text-base max-w-xl">
                {collection.description}
              </p>
            )}
            <p className="text-white/50 mt-2 text-xs">
              {collection.games.length} {collection.games.length === 1 ? "игра" : collection.games.length < 5 ? "игры" : "игр"} в подборке
            </p>
          </div>
        </div>
      </div>

      {/* Список игр */}
      <div className="max-w-3xl mx-auto">
        <div className="space-y-3">
          {matchedGames.map(({ name, rank, game }, index) => {
            const hasValidImage = game && isUrl(game.image);
            const isPerfectRating = game?.rating === 10;

            return (
              <div
                key={index}
                className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                {/* Номер / ранг */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-purple)]/20 border border-[var(--accent-purple)]/30">
                  {rank ? (
                    <span className="text-lg font-bold text-[var(--accent-purple)]">
                      {rank}
                    </span>
                  ) : (
                    <FaList className="text-[var(--accent-purple)]/50 text-sm" />
                  )}
                </div>

                {/* Мини-превью игры */}
                {game && (
                  <>
                    <Link
                      to={`/catalog/${game.slug}`}
                      className="flex items-center gap-4 flex-1"
                    >
                      <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
                        {hasValidImage ? (
                          <img
                            src={game.image}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg" aria-hidden="true">🎮</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate group-hover:text-[var(--accent-purple)] transition-colors">
                          {game.title}
                        </h3>
                        {game.genre && (
                          <p className="text-xs text-white/40 mt-0.5 truncate">
                            {game.genre}
                          </p>
                        )}
                      </div>
                    </Link>

                    {/* Рейтинг */}
                    {game.rating && (
                      <div className={`flex-shrink-0 flex items-center gap-1 ${isPerfectRating ? 'animate-pulse' : ''}`}>
                        <div className="bg-[var(--accent-purple)] text-[var(--bg-primary)] text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-lg">
                          <FaStar className="text-[8px]" />
                          {game.rating}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Нет в каталоге */}
                {!game && (
                  <span className="text-white/40 text-sm italic flex-1">
                    {name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Кнопка «Смотреть в каталоге» */}
        <div className="mt-10 text-center">
          <Link
            to={`/catalog?collection=${encodeURIComponent(collection.name)}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-purple)] text-[var(--bg-primary)] font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-purple)]/30 hover:shadow-[var(--accent-purple)]/50 hover:-translate-y-0.5"
          >
            <FaList size={16} />
            Смотреть все игры в каталоге
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
