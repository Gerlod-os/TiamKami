import { useState, useMemo, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ games, searchQuery, setSearchQuery }) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

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

  // Подсказки (до 5 совпадений)
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    const query = inputValue.toLowerCase().trim();
    return games
      .filter((game) =>
        game.title.toLowerCase().includes(query) ||
        game.genre.toLowerCase().includes(query) ||
        (game.setting || "").toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map((game) => game.title);
  }, [inputValue, games]);

  // Синхронизация с внешним searchQuery
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

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

  const handleSuggestionClick = (title) => {
    setInputValue(title);
    setShowSuggestions(false);
    setSearchQuery(title);
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

      {/* Подсказки */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {suggestions.map((title, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(title)}
              className="w-full px-4 py-2.5 text-left text-white/80 hover:bg-[var(--accent-purple)]/20 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              <FaSearch className="text-white/30 text-xs" />
              {title}
            </button>
          ))}
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
