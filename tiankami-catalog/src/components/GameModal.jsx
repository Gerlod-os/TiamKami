import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaYoutube, FaSteam, FaVideo } from "react-icons/fa";
import { trackEvent } from "../utils/metrika.js";
import { isUrl, steamCoverUrl } from "../utils/normalize.js";
import GameDetails from "./GameDetails";

const GameModal = ({ game, onClose }) => {
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Портретная обложка; fallback на image или заглушку.
  const coverSrc = game.steamAppId
    ? steamCoverUrl(game.steamAppId)
    : isUrl(game.image)
      ? game.image
      : null;

  useEffect(() => {
    trackEvent("Открытие модалки игры", { title: game.title });

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => setIsAnimating(true), 10);

    return () => {
      clearTimeout(timer);
      setIsAnimating(false);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [game.title, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Детали игры: ${game.title}`}
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[var(--bg-secondary)] border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 ${isAnimating ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия — поверх всего */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-[var(--accent-pink)] transition-colors"
          aria-label="Закрыть"
        >
          ×
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto md:overflow-y-hidden">
          {/* Обложка — закреплена, не вылезает при прокрутке контента */}
          <div className="relative w-full md:w-2/5 h-56 md:h-auto md:min-h-full flex-shrink-0 overflow-hidden">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-pink)]/20">
                <span className="text-5xl" aria-hidden="true">
                  🎮
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)]/70 to-transparent md:hidden" />
          </div>

          {/* Контент — прокручивается на десктопе; на мобильных скроллится весь панель */}
          <div className="w-full md:w-3/5 p-6 md:overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4 pr-12">
              {game.title}
            </h2>
            <GameDetails game={game} />

            {/* Кнопки */}
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/10">
              {/* Открыть страницу — основная */}
              <Link
                to={`/catalog/${game.slug}`}
                className="flex-1 min-w-[140px] px-6 py-3 bg-[var(--accent-purple)] text-white font-heading font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-purple)]/30 hover:shadow-[var(--accent-purple)]/50 flex items-center justify-center gap-2"
                onClick={onClose}
              >
                <FaArrowRight size={14} />
                Открыть страницу
              </Link>

              {/* YouTube — если есть */}
              {isUrl(game.youtube) && (
                <a
                  href={game.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 border-2 border-[var(--accent-pink)] text-[var(--accent-pink)] font-heading font-medium rounded-xl hover:bg-[var(--accent-pink)] hover:text-[var(--bg-primary)] transition-all flex items-center gap-2"
                  onClick={() =>
                    trackEvent("Клик YouTube", { title: game.title })
                  }
                >
                  <FaYoutube size={16} />
                  YouTube
                </a>
              )}

              {/* Steam — если есть */}
              {isUrl(game.steamUrl) && (
                <a
                  href={game.steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 border border-white/10 text-white/70 font-heading font-medium rounded-xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                  onClick={() =>
                    trackEvent("Клик Steam", { title: game.title })
                  }
                >
                  <FaSteam size={16} />
                  Steam
                </a>
              )}

              {/* МИ — если есть */}
              {game.hasMI &&
                game.hasMI.toLowerCase() === "true" &&
                isUrl(game.miVideo) && (
                  <a
                    href={game.miVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-heading font-medium rounded-xl hover:bg-amber-500/30 transition-all flex items-center gap-2"
                    onClick={() => trackEvent("Клик МИ", { title: game.title })}
                  >
                    <FaVideo size={16} />
                    МИ
                  </a>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
