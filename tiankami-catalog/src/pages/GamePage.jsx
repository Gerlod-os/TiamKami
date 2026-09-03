import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGames } from "../utils/loadData";
import { slugify } from "../utils/slugify";
import { BRAND } from "../config/branding.js";
import GameDetails from "../components/GameDetails";
import { FaChevronRight } from "react-icons/fa";

const GamePage = () => {
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
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Находим игру по слагу (мемоизируем)
  const game = useMemo(() => {
    return games.find((g) => slugify(g.title) === slug) || null;
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
    setMeta("og:type", "article");

    // Cleanup: восстанавливаем дефолтные мета-теги
    return () => {
      document.title = BRAND.siteTitle;
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          `Каталог рогаликов ${BRAND.name}`,
        );
      }
      document
        .querySelectorAll('meta[property^="og:"]')
        .forEach((meta) => meta.remove());
    };
  }, [game]);

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  if (!game) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl mb-4">Игра не найдена</h1>
        <Link to="/catalog" className="text-accent-pink hover:text-white">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Хлебные крошки */}
      <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
        <Link to="/" className="hover:text-accent-pink">
          Главная
        </Link>
        <FaChevronRight size={12} />
        <Link to="/catalog" className="hover:text-accent-pink">
          Каталог
        </Link>
        <FaChevronRight size={12} />
        <span className="text-white">{game.title}</span>
      </nav>

      <h1 className="text-3xl font-heading mb-6">{game.title}</h1>

      <GameDetails game={game} />
    </div>
  );
};

export default GamePage;
