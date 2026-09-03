import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGames } from "../utils/loadData";
import { BRAND } from "../config/branding.js";
import GameDetails from "../components/GameDetails";
import { isUrl } from "../utils/normalize.js";
import { FaChevronRight } from "react-icons/fa";

const genreColors = [
  "bg-pink-300/30 text-pink-200",
  "bg-purple-300/30 text-purple-200",
  "bg-blue-300/30 text-blue-200",
];

const GameCardInline = ({ game, imageError, setImageError }) => {
  const genres = (game.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const isPerfectRating = game.rating === 10;
  const hasValidImage = isUrl(game.image) && !imageError;

  return (
    <div className="max-w-4xl mx-auto bg-white/5 rounded-2xl overflow-hidden border border-white/10">
      {/* Обложка */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl" aria-hidden="true">🎮</span>
          </div>
        )}

        {/* Затемнение снизу */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Бейдж рейтинга */}
        <div
          className={`absolute top-3 right-3 flex items-center justify-center w-12 h-12 rounded-xl font-heading font-bold text-lg shadow-lg ${
            isPerfectRating
              ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950"
              : "bg-black/50 backdrop-blur-sm text-white"
          }`}
        >
          {game.rating || "—"}
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-3">
        <h2 className="font-heading text-lg text-white font-bold truncate">
          {game.title}
        </h2>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((genre, index) => (
              <span
                key={genre}
                className={`px-3 py-1 rounded-full text-xs font-medium ${genreColors[index % genreColors.length]}`}
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GamePage = () => {
  const { slug } = useParams();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardImageError, setCardImageError] = useState(false);

  useEffect(() => {
    console.log('[GamePage] Загрузка игр...');
    fetchGames()
      .then((data) => {
        console.log('[GamePage] Загружено игр:', data.length);
        console.log('[GamePage] Первые 3 слага:', data.slice(0, 3).map((g) => g.slug));
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[GamePage] Ошибка загрузки:', err);
        setLoading(false);
      });
  }, []);

  // Находим игру по слагу (мемоизируем)
  // Слоги теперь хранятся в данных (normalizeGames), slugify не нужен
  const game = useMemo(() => {
    console.log('[GamePage] Поиск игры по slug:', slug);
    console.log('[GamePage] Все доступные слаги:', games.map((g) => g.slug).slice(0, 5));
    const found = games.find((g) => g.slug === slug);
    console.log('[GamePage] Найдено:', found ? found.title : 'НЕ НАЙДЕНО');
    return found || null;
  }, [games, slug]);

  // Мета-теги для соцсетей
  useEffect(() => {
    if (!game) return;

    // Устанавливаем мета-теги
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
    if (game.image && isUrl(game.image)) {
      setMeta("og:image", game.image);
    }

    // Cleanup: восстанавливаем дефолтные мета-теги
    return () => {
      document.title = BRAND.siteTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `Каталог рогаликов ${BRAND.name}`,
        );
      }
      // Удаляем только те og: мета-теги, что создали мы
      ["og:title", "og:description", "og:type", "og:image"].forEach((prop) => {
        const meta = document.querySelector(`meta[property="${prop}"]`);
        if (meta) meta.remove();
      });
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
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20">
        {game.image && isUrl(game.image) ? (
          <img
            src={game.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setCardImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/30 to-accent-pink/30" />
        )}

        {/* Затемнение */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

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
        <div className="relative z-10 px-4 pb-6 md:px-8 md:pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white drop-shadow-lg">
            {game.title}
          </h1>
        </div>
      </div>

      {/* Карточка игры: обложка + бейдж рейтинга + чипсы жанров */}
      <GameCardInline
        game={game}
        imageError={cardImageError}
        setImageError={setCardImageError}
      />

      {/* Детали */}
      <div className="mt-8">
        <GameDetails game={game} />
      </div>
    </div>
  );
};

export default GamePage;
