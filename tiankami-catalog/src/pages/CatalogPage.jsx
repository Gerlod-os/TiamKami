import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGames } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import { getGameMetadata } from "../utils/normalize";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import { FaDice, FaFilter } from "react-icons/fa";

const ITEMS_PER_PAGE = 24;

const CatalogPage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [quickViewGame, setQuickViewGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [filters, setFilters] = useState({
    genres: [],
    status: "",
    minRating: "",
    maxRating: "",
    minComplexity: "",
    maxComplexity: "",
    minHours: "",
    maxHours: "",
    years: [],
    hasMI: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const resetPage = () => setCurrentPage(1);

  const setFilterAndResetPage = (updater) => {
    setFilters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      resetPage();
      return next;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      genres: [],
      status: "",
      minRating: "",
      maxRating: "",
      minComplexity: "",
      maxComplexity: "",
      minHours: "",
      maxHours: "",
      years: [],
      hasMI: false,
    });
    setSortBy("title");
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchGames()
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Не удалось загрузить данные. Проверьте подключение к интернету.",
        );
        setLoading(false);
      });
  }, []);

  // Используем утилиту вместо inline-вычислений
  const metadata = useMemo(() => getGameMetadata(games), [games]);
  const allGenres = metadata.genres;
  const allYears = metadata.years;

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase().trim();
      result = result.filter((game) => {
        const title = (game.title || "").toLowerCase();
        const notes = (game.notes || "").toLowerCase();
        const genre = (game.genre || "").toLowerCase();
        const features = (game.features || "").toLowerCase();
        const setting = (game.setting || "").toLowerCase();

        // Проверяем вхождение в жанрах: разбиваем по запятой, ищем в обе стороны
        const genreMatch = genre
          .split(",")
          .some((gen) => gen.trim().includes(s) || s.includes(gen.trim()));

        // Аналогично для особенностей
        const featuresMatch = features
          .split(",")
          .some((feat) => feat.trim().includes(s) || s.includes(feat.trim()));

        return (
          title.includes(s) ||
          notes.includes(s) ||
          genreMatch ||
          featuresMatch ||
          setting.includes(s)
        );
      });
    }

    if (filters.genres.length > 0) {
      result = result.filter((game) => {
        const genre = game.genre || "";
        return filters.genres.every((g) =>
          genre
            .split(",")
            .map((x) => x.trim())
            .includes(g),
        );
      });
    }

    if (filters.status) {
      result = result.filter((game) => game.status === filters.status);
    }

    if (filters.minRating !== "") {
      result = result.filter(
        (game) => parseFloat(game.rating || 0) >= parseFloat(filters.minRating),
      );
    }
    if (filters.maxRating !== "") {
      result = result.filter(
        (game) => parseFloat(game.rating || 0) <= parseFloat(filters.maxRating),
      );
    }

    if (filters.minComplexity !== "") {
      result = result.filter(
        (game) =>
          parseFloat(game.complexity || 0) >= parseFloat(filters.minComplexity),
      );
    }
    if (filters.maxComplexity !== "") {
      result = result.filter(
        (game) =>
          parseFloat(game.complexity || 0) <= parseFloat(filters.maxComplexity),
      );
    }

    if (filters.minHours !== "") {
      result = result.filter(
        (game) => parseFloat(game.hours || 0) >= parseFloat(filters.minHours),
      );
    }
    if (filters.maxHours !== "") {
      result = result.filter(
        (game) => parseFloat(game.hours || 0) <= parseFloat(filters.maxHours),
      );
    }

    if (filters.years.length > 0) {
      result = result.filter((game) => {
        const releaseDate = game.releaseDate || "";
        const match = releaseDate.match(/\d{4}/);
        return match && filters.years.includes(match[0]);
      });
    }

    if (filters.hasMI) {
      result = result.filter(
        (game) => (game.hasMI || "").toLowerCase() === "true",
      );
    }

    switch (sortBy) {
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title, "ru"));
        break;
      case "rating":
        result.sort(
          (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0),
        );
        break;
      case "hours":
        result.sort(
          (a, b) => (parseFloat(b.hours) || 0) - (parseFloat(a.hours) || 0),
        );
        break;
      case "releaseDate":
        result.sort((a, b) => {
          const da = parseRuDate(b.releaseDate);
          const db = parseRuDate(a.releaseDate);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da - db;
        });
        break;
      case "date-new":
        result.sort((a, b) => {
          const da = parseRuDate(b.releaseDate);
          const db = parseRuDate(a.releaseDate);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da - db;
        });
        break;
      default:
        break;
    }

    const totalPages = Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE));
    const paginated = result.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );

    return { games: paginated, totalCount: result.length, totalPages };
  }, [games, searchQuery, filters, sortBy, currentPage]);

  if (loading)
    return <div className="text-center py-20">Загрузка данных...</div>;

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
        <h2 className="text-lg font-heading text-red-400 mb-2">
          Ошибка загрузки
        </h2>
        <p className="text-white/70 text-sm mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-accent-pink text-black rounded-xl hover:bg-white transition-colors"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl mb-6">Каталог рогаликов</h1>

      <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-3">
        {/* Верхняя строка: поиск + кнопки */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-grow min-w-[200px] bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
          />

          <button
            type="button"
            onClick={() => setIsFiltersVisible((v) => !v)}
            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              isFiltersVisible
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-[#111827] border-gray-700 text-white/80 hover:border-gray-500"
            }`}
            aria-expanded={isFiltersVisible}
            aria-controls="filters-block"
          >
            <FaFilter size={14} />
            Фильтры
          </button>

          <button
            onClick={() => {
              if (filteredGames.games.length === 0) return;
              const randomIndex = Math.floor(
                Math.random() * filteredGames.games.length,
              );
              setSelectedGame(filteredGames.games[randomIndex]);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl border border-purple-500 transition-all flex items-center gap-2 whitespace-nowrap text-sm font-medium"
            title="Выбрать случайную игру из отфильтрованных"
          >
            <FaDice size={14} />
            Случайная игра
          </button>
        </div>

        {/* Кнопка сброса */}
        <button
          onClick={resetFilters}
          className="w-full mb-4 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl border border-red-800/50 transition"
        >
          🗑️ Сбросить все фильтры
        </button>

        {/* Блок фильтров */}
        <div
          id="filters-block"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isFiltersVisible ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {/* Группа: Основные */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              ⚙️ Основные
            </h3>

            {/* Статус */}
            <div className="mb-4">
              <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                Статус
              </p>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilterAndResetPage((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-purple-500 w-full"
              >
                <option value="">Все</option>
                <option value="Пройдено">Пройдено</option>
                <option value="Дропнуто">Дропнуто</option>
                <option value="Обзор">Обзор</option>
                <option value="Жду релиза">Жду релиза</option>
              </select>
            </div>

            {/* Жанры */}
            <div className="mb-4">
              <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                Жанры
              </p>
              <p className="text-xs text-white/30 mb-2">Выберите до 2 жанров</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilterAndResetPage((prev) => ({
                    ...prev,
                    genres:
                      prev.genres.length === allGenres.length
                        ? []
                        : [...allGenres],
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.genres.length === allGenres.length
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Все
              </button>
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() =>
                    setFilterAndResetPage((prev) => {
                      if (prev.genres.includes(genre)) {
                        return {
                          ...prev,
                          genres: prev.genres.filter((g) => g !== genre),
                        };
                      }
                      if (prev.genres.length >= 2) return prev;
                      return { ...prev, genres: [...prev.genres, genre] };
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.genres.includes(genre)
                      ? "bg-purple-600 text-white"
                      : filters.genres.length >= 2
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Группа: Дополнительные */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              🔧 Дополнительные
            </h3>

            {/* Сортировка */}
          <div className="mb-4">
            <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
              Сортировка
            </p>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-purple-500"
            >
              <option value="title">По названию</option>
              <option value="rating">По оценке</option>
              <option value="hours">По часам</option>
              <option value="releaseDate">По дате выхода</option>
              <option value="date-new">Сначала новые</option>
            </select>
          </div>

          {/* Расширенные фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs mb-1 text-white/50">
                Оценка (мин–макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      minRating: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxRating}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      maxRating: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-white/50">
                Сложность (мин–макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minComplexity}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      minComplexity: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxComplexity}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      maxComplexity: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-white/50">
                Часы (мин–макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="мин"
                  value={filters.minHours}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      minHours: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="макс"
                  value={filters.maxHours}
                  onChange={(e) =>
                    setFilterAndResetPage((prev) => ({
                      ...prev,
                      maxHours: e.target.value,
                    }))
                  }
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-white/50">
                Год выхода
              </label>
              <select
                multiple
                value={filters.years}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  );
                  setFilterAndResetPage((prev) => ({ ...prev, years: selected }));
                }}
                className="w-full bg-[#111827] border border-gray-700 rounded-lg py-2 px-2 text-xs h-16 focus:outline-none focus:border-purple-500"
              >
                {allYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="hasMI"
              checked={filters.hasMI}
              onChange={(e) =>
                setFilterAndResetPage((prev) => ({
                  ...prev,
                  hasMI: e.target.checked,
                }))
              }
              className="accent-purple-500"
            />
            <label htmlFor="hasMI" className="text-xs text-white/70">
              Только с МИ
            </label>
          </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-white/70">Показано игр: {filteredGames.totalCount}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.games.map((game) => (
          <GameCard
            key={game.slug}
            game={game}
            onQuickView={() => setQuickViewGame(game)}
            onClick={() => navigate(`/catalog/${game.slug}`)}
          />
        ))}
      </div>

      {filteredGames.games.length === 0 && (
        <div className="text-center py-10 text-white/50">
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      )}

      {filteredGames.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
          >
            ← Назад
          </button>
          {Array.from(
            { length: filteredGames.totalPages },
            (_, i) => i + 1,
          ).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-3 py-1 rounded-lg ${
                p === currentPage ? "bg-purple-600" : "bg-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(filteredGames.totalPages, p + 1),
              )
            }
            disabled={currentPage === filteredGames.totalPages}
            className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
          >
            Вперед →
          </button>
        </div>
      )}

      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}

      {quickViewGame && (
        <GameModal game={quickViewGame} onClose={() => setQuickViewGame(null)} />
      )}
    </div>
  );
};

export default CatalogPage;