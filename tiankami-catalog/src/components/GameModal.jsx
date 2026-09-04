import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "./YandexMetrika";
import GameDetails from "./GameDetails";

const GameModal = ({ game, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    trackEvent("Открытие модалки игры", { title: game.title });

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [game.title, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Детали игры: ${game.title}`}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-bg-dark border border-accent-purple/30 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-glow-purple"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-heading text-white">{game.title}</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none"
              title="Закрыть"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <GameDetails game={game} />

          <Link
            to={`/catalog/${game.slug}`}
            className="inline-block mt-4 px-4 py-2 bg-accent-pink text-black font-heading rounded-xl hover:bg-white transition-colors"
            onClick={onClose}
          >
            Открыть страницу
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
