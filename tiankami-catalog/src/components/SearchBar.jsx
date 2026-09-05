import { useState, useMemo, useEffect, useRef } from "react";
import { FaSearch, FaStar } from "react-icons/fa";
import { steamCoverUrl } from "../utils/normalize.js";

const SearchBar = ({ games, searchQuery, setSearchQuery }) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Debounced-поиск: результаты обновляются через 200 мс после остановки ввода
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue), 200);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Популярные жанры (топ-8 по частоте)
  const popularGenres = useMemo(() => {
    const genreCounts = {};
    games.forEach((game) => {
      (game.genre || "").split(",").forEach((g) => {
        const genre = g.trim();
        if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre]) => genre);
  }, [games]);

  // Результаты поиска (до 8) — по названию, жанру, сеттингу
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase().trim();
    return games
      .filter(
        (game) =>
          game.title.toLowerCase().includes(q) ||
          game.genre.toLowerCase().includes(q) ||
          (game.setting || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [debouncedQuery, games]);

  // Синхронизация inputValue с внешним searchQuery через обновление при рендере
  // (официальный React-паттерн вместо setState в useEffect)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setInputValue(searchQuery);
  }

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Небольшая задержка, чтобы успел сработать клик по подсказке
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (game) => {
    setInputValue(game.title);
    setShowSuggestions(false);
    setSearchQuery(game.title);
  };

  const handleGenreClick = (genre) => {
    setInputValue(genre);
    setShowSuggestions(false);
    setSearchQuery(genre);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-96">
      {/* Строка поиска */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg" />
        <input
          type="text"
          placeholder="Поиск по названию, жанру, сеттингу..."
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="w-full bg-[var(--bg-secondary)] border border-white/10 rounded-2xl px-6 py-3 pl-12 text-white placeholder-white/40 focus:border-[var(--accent-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)]/30 transition-all shadow-sm"
        />
      </div>

      {/* Результаты — мгновенные подсказки с обложками и рейтингом */}
      {showSuggestions && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] border-2 border-[var(--accent-purple)]/30 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {results.map((game) => {
            const cover = game.steamAppId
              ? steamCoverUrl(game.steamAppId)
              : null;
            return (
              <button
                key={game.slug || game.title}
                onClick={() => handleSuggestionClick(game)}
                className="w-full px-4 py-3 text-left hover:bg-[var(--accent-purple)]/20 transition-colors flex items-center gap-4 border-b border-white/5 last:border-0"
              >
                <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-primary)]">
                  {cover ? (
                    <img
                      src={cover}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="w-full h-full flex items-center justify-center text-2xl"
                      aria-hidden="true"
                    >
                      🎮
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {game.title}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {game.genre}
                  </div>
                </div>
                {game.rating && (
                  <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                    <FaStar size={14} />
                    <span className="font-bold">{game.rating}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Быстрые теги */}
      <div className="flex flex-wrap gap-2 mt-3">
        {popularGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreClick(genre)}
            className="text-xs bg-white/5 px-3 py-1.5 rounded-full hover:bg-[var(--accent-purple)]/20 hover:text-[var(--accent-purple)] transition-all border border-white/5"
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
