import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import {
  getGameMetadata,
  getAllSettings,
  getAllFeatures,
} from "../utils/normalize";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import { trackEvent } from "../components/YandexMetrika";
import {
  FaDice,
  FaFilter,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import SearchBar from "../components/SearchBar";

const ITEMS_PER_PAGE = 24;

const CatalogPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [quickViewGame, setQuickViewGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState("title");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
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
    settings: [],
    features: [],
  });
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Функции сброса и обновления фильтров ───
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
    setSelectedCollection(null);
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
      settings: [],
      features: [],
    });
    setSortBy("title");
    setCurrentPage(1);
  };

  // Синхронизация URL-параметров с состоянием
  useEffect(() => {
    const col = searchParams.get("collection");
    if (col) {
      const found = collections.find(
        (c) => c.name === decodeURIComponent(col),
      );
      if (found) setSelectedCollection(found);
    }
  }, [collections, searchParams]);

  // Синхронизация searchQuery и selectedCollection с URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCollection) params.set("collection", selectedCollection.name);
    setSearchParams(params);
  }, [searchQuery, selectedCollection, setSearchParams]);

  // Загрузка данных
  useEffect(() => {
    Promise.all([fetchGames(), fetchCollections()])
      .then(([gamesData, collectionsData]) => {
        setGames(gamesData);
        setCollections(collectionsData);
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

  // Метаданные для фильтров
  const metadata = useMemo(() => getGameMetadata(games), [games]);
  const allGenres = metadata.genres;
  const allYears = metadata.years;
  const allSettings = useMemo(() => getAllSettings(games), [games]);
  const allFeatures = useMemo(() => getAllFeatures(games), [games]);

  // Фильтрация и сортировка
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Поиск
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase().trim();
      result = result.filter((game) => {
        const title = (game.title || "").toLowerCase();
        const notes = (game.notes || "").toLowerCase();
        const genre = (game.genre || "").toLowerCase();
        const features = (game.features || "").toLowerCase();
        const setting = (game.setting || "").toLowerCase();
        const genreMatch = genre
          .split(",")
          .some((gen) => gen.trim().includes(s) || s.includes(gen.trim()));
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

    // Фильтр по жанрам (И)
    if (filters.genres.length > 0) {
      result = result.filter((game) => {
        const genre = game.genre || "";
        return filters.genres.every((g) =>
          genre.split(",").map((x) => x.trim()).includes(g),
        );
      });
    }

    // Фильтр по статусу
    if (filters.status) {
      result = result.filter((game) => game.status === filters.status);
    }

    // Рейтинг
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

    // Сложность
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

    // Часы
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

    // Год выхода
    if (filters.years.length > 0) {
      result = result.filter((game) => {
        const releaseDate = game.releaseDate || "";
        const match = releaseDate.match(/\d{4}/);
        return match && filters.years.includes(match[0]);
      });
    }

    // Только с МИ
    if (filters.hasMI) {
      result = result.filter(
        (game) => (game.hasMI || "").toLowerCase() === "true",
      );
    }

    // Сеттинг (И, до 1)
    if (filters.settings.length > 0) {
      result = result.filter((game) =>
        filters.settings.every((s) => (game.setting || "").includes(s)),
      );
    }

    // Особенности (И, до 2)
    if (filters.features.length > 0) {
      result = result.filter((game) =>
        filters.features.every((f) => {
          const gameFeatures = (game.features || "")
            .split(",")
            .map((x) => x.trim());
          return gameFeatures.includes(f);
        }),
      );
    }

    // Фильтр по подборке
    if (selectedCollection) {
      const collectionNames = new Set(
        selectedCollection.games.map((g) => g.name.toLowerCase()),
      );
      result = result.filter((game) =>
        collectionNames.has((game.title || "").toLowerCase()),
      );
    }

    // Сортировка
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

    // Пагинация
    const totalPages = Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE));
    const paginated = result.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );

    return { games: paginated, totalCount: result.length, totalPages };
  }, [games, searchQuery, filters, sortBy, currentPage, selectedCollection]);

  // Обработчики
  const handleRandomGame = () => {
    if (filteredGames.games.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredGames.games.length);
    const randomGame = filteredGames.games[randomIndex];
    trackEvent("Случайная игра", { title: randomGame.title });
    setSelectedGame(randomGame);
  };

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
      {/* Шапка каталога */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-heading font-bold text-white">
          Каталог рогаликов
        </h1>

        <div className="flex flex-wrap gap-4 items-center">
          <SearchBar
            games={games}
            searchQuery={searchQuery}
            setSearchQuery={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
          />

          {/* Кнопка случайной игры */}
          <button
            onClick={handleRandomGame}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--accent-pink)] text-[var(--bg-primary)] font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-pink)]/30 hover:shadow-[var(--accent-pink)]/50 hover:-translate-y-0.5"
          >
            <FaDice size={16} />
            Случайная
          </button>
        </div>
      </div>

      {/* Фильтры */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-white/5 mb-8">
        {/* Верхняя строка: кнопка показать/скрыть и сброс */}
        <div className="flex flex-wrap justify-between items-center mb-4">
          <button
            onClick={() => setIsFiltersVisible((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition"
          >
            <FaFilter size={14} />
            Фильтры
            {isFiltersVisible ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-[var(--accent-pink)] hover:text-white border border-[var(--accent-pink)]/30 hover:border-[var(--accent-pink)] rounded-xl text-sm font-medium transition"
          >
            <FaTrash size={14} />
            Сбросить все фильтры
          </button>
        </div>

        {/* Основные фильтры (всегда видимы) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Статус */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">
              Статус
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilterAndResetPage((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="w-full bg-[var(--bg-primary)] text-white text-sm rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:border-[var(--accent-purple)]"
            >
              <option value="">Все</option>
              <option value="Пройдено">Пройдено</option>
              <option value="Дропнуто">Дропнуто</option>
              <option value="Обзор">Обзор</option>
              <option value="Жду релиза">Жду релиза</option>
            </select>
          </div>

          {/* Жанры */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">
              Жанры (до 2)
            </label>
            <div className="flex flex-wrap gap-2">
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filters.genres.includes(genre)
                      ? "bg-[var(--accent-purple)] text-[var(--bg-primary)]"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Сортировка */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1">
              Сортировка
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-primary)] text-white text-sm rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:border-[var(--accent-purple)]"
            >
              <option value="title">По названию</option>
              <option value="rating">По оценке</option>
              <option value="hours">По часам</option>
              <option value="releaseDate">По дате выхода</option>
              <option value="date-new">Сначала новые</option>
            </select>
          </div>
        </div>

        {/* Дополнительные фильтры (под спойлером) */}
        {isFiltersVisible && (
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Оценка */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Оценка</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="от"
                    value={filters.minRating}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        minRating: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="до"
                    value={filters.maxRating}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        maxRating: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>

              {/* Сложность */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Сложность</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="от"
                    value={filters.minComplexity}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        minComplexity: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="до"
                    value={filters.maxComplexity}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        maxComplexity: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>

              {/* Часы */}
              <div>
                <label className="block text-xs text-white/50 mb-1">Часы</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="от"
                    value={filters.minHours}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        minHours: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="до"
                    value={filters.maxHours}
                    onChange={(e) =>
                      setFilterAndResetPage((prev) => ({
                        ...prev,
                        maxHours: e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>
            </div>

            {/* Год выхода */}
            <div>
              <label className="block text-xs text-white/50 mb-1">Год выхода</label>
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
                className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg py-2 px-3 text-sm text-white h-24 focus:outline-none focus:border-[var(--accent-purple)]"
              >
                {allYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Чекбокс МИ */}
            <div className="flex items-center gap-3">
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
                className="sr-only peer"
              />
              <label
                htmlFor="hasMI"
                className="w-10 h-6 bg-gray-700 rounded-full cursor-pointer transition peer-checked:bg-[var(--accent-purple)] flex items-center px-0.5"
              >
                <span
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition ${
                    filters.hasMI ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </label>
              <span className="text-sm text-white/80">Только с МИ</span>
            </div>

            {/* Сеттинг */}
            <div>
              <label className="block text-xs text-white/50 mb-1">Сеттинг (до 1)</label>
              <div className="flex flex-wrap gap-2">
                {allSettings.map((setting) => (
                  <button
                    key={setting}
                    type="button"
                    onClick={() =>
                      setFilterAndResetPage((prev) => {
                        if (prev.settings.includes(setting)) {
                          return {
                            ...prev,
                            settings: prev.settings.filter((s) => s !== setting),
                          };
                        }
                        if (prev.settings.length >= 1) return prev;
                        return { ...prev, settings: [...prev.settings, setting] };
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filters.settings.includes(setting)
                        ? "bg-[var(--accent-cyan)] text-[var(--bg-primary)]"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {setting}
                  </button>
                ))}
              </div>
            </div>

            {/* Особенности */}
            <div>
              <label className="block text-xs text-white/50 mb-1">Особенности (до 2)</label>
              <div className="flex flex-wrap gap-2">
                {allFeatures.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() =>
                      setFilterAndResetPage((prev) => {
                        if (prev.features.includes(feature)) {
                          return {
                            ...prev,
                            features: prev.features.filter((f) => f !== feature),
                          };
                        }
                        if (prev.features.length >= 2) return prev;
                        return { ...prev, features: [...prev.features, feature] };
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filters.features.includes(feature)
                        ? "bg-[var(--accent-pink)] text-[var(--bg-primary)]"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Счётчик и активная подборка */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/70">Показано игр: {filteredGames.totalCount}</p>
        {selectedCollection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--accent-purple)]">Подборка:</span>
            <span className="text-sm font-medium text-white">{selectedCollection.name}</span>
            <button
              onClick={() => {
                setSelectedCollection(null);
                resetPage();
              }}
              className="text-xs text-white/50 hover:text-white underline"
            >
              × Сбросить
            </button>
          </div>
        )}
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.games.map((game, index) => (
          <div
            key={game.slug}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <GameCard
              game={game}
              onQuickView={() => setQuickViewGame(game)}
              onClick={() => navigate(`/catalog/${game.slug}`)}
            />
          </div>
        ))}
      </div>

      {filteredGames.games.length === 0 && (
        <div className="text-center py-10 text-white/50">
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      )}

      {/* Пагинация */}
      {filteredGames.totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
          <button
            onClick={() => {
              trackEvent("Пагинация", { page: currentPage - 1, action: "prev" });
              setCurrentPage((p) => Math.max(1, p - 1));
            }}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-white/10 rounded-lg text-white/70 disabled:opacity-50 hover:bg-white/10 transition"
          >
            ← Назад
          </button>
          {Array.from({ length: filteredGames.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => {
                  trackEvent("Пагинация", { page, action: "click" });
                  setCurrentPage(page);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  page === currentPage
                    ? "bg-[var(--accent-purple)] text-[var(--bg-primary)]"
                    : "bg-[var(--bg-secondary)] border border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {page}
              </button>
            ),
          )}
          <button
            onClick={() => {
              trackEvent("Пагинация", { page: currentPage + 1, action: "next" });
              setCurrentPage((p) => Math.min(filteredGames.totalPages, p + 1));
            }}
            disabled={currentPage === filteredGames.totalPages}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-white/10 rounded-lg text-white/70 disabled:opacity-50 hover:bg-white/10 transition"
          >
            Вперед →
          </button>
        </div>
      )}

      {/* Модалки */}
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