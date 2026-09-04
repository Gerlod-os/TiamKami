import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchGames, fetchCollections } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import { getGameMetadata, getAllSettings, getAllFeatures } from "../utils/normalize";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import { trackEvent } from "../components/YandexMetrika";
import { FaDice, FaFilter, FaTrash, FaCogs, FaWrench, FaGlobe, FaGem } from "react-icons/fa";

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
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
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

  // Синхронизация URL-параметров с состоянием
  useEffect(() => {
    const col = searchParams.get("collection");
    if (col) {
      const found = collections.find((c) => c.name === decodeURIComponent(col));
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
    setSearchParams(new URLSearchParams());
  };

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

  // Используем утилиту вместо inline-вычислений
  const metadata = useMemo(() => getGameMetadata(games), [games]);
  const allGenres = metadata.genres;
  const allYears = metadata.years;
  const allSettings = useMemo(() => getAllSettings(games), [games]);
  const allFeatures = useMemo(() => getAllFeatures(games), [games]);

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

    // Фильтр по сеттингу (И) — до 1 выбора
    if (filters.settings.length > 0) {
      result = result.filter((game) =>
        filters.settings.every((s) => (game.setting || "").includes(s)),
      );
    }

    // Фильтр по особенностям (И) — до 2 выборов
    if (filters.features.length > 0) {
      result = result.filter((game) =>
        filters.features.every((f) => {
          const gameFeatures = (game.features || "").split(",").map((x) => x.trim());
          return gameFeatures.includes(f);
        }),
      );
    }

    // Фильтр по подборке — показываем только игры из выбранной подборки
    if (selectedCollection) {
      const collectionNames = new Set(
        selectedCollection.games.map((g) => g.name.toLowerCase()),
      );
      result = result.filter(
        (game) => collectionNames.has((game.title || "").toLowerCase()),
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
  }, [games, searchQuery, filters, sortBy, currentPage, selectedCollection]);

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
        {/* Поиск — на всю ширину на мобильных */}
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
        />

        {/* Кнопки — под поиском на мобильных */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setIsFiltersVisible((v) => !v)}
            className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
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
              const randomGame = filteredGames.games[randomIndex];
              trackEvent("Случайная игра", { title: randomGame.title });
              setSelectedGame(randomGame);
            }}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl border border-purple-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium"
            title="Выбрать случайную игру из отфильтрованных"
          >
            <FaDice size={14} />
            <span className="hidden sm:inline">Случайная игра</span>
            <span className="sm:hidden">🎲</span>
          </button>
        </div>

        {/* Кнопка сброса */}
        <button
          onClick={resetFilters}
          className="w-full mb-4 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl border border-red-500 transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
        >
          <FaTrash size={14} />
          Сбросить все фильтры
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
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 pb-2 border-b border-white/10">
              <FaCogs className="text-purple-400" />
              Основные фильтры
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
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 pb-2 border-b border-white/10">
              <FaWrench className="text-purple-400" />
              Дополнительные фильтры
            </h3>

            {/* Сортировка — отдельная строка */}
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
                className="bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2 px-3 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
              >
                <option value="title">По названию</option>
                <option value="rating">По оценке</option>
                <option value="hours">По часам</option>
                <option value="releaseDate">По дате выхода</option>
                <option value="date-new">Сначала новые</option>
              </select>
            </div>

            {/* Расширенные фильтры — компактная строка */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs mb-1 text-white/50">
                  Оценка
                </label>
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 text-white/50">
                  Сложность
                </label>
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 text-white/50">
                  Часы
                </label>
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
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
                    className="flex-1 bg-[#111827] border border-gray-700 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Год выхода — отдельная строка */}
            <div className="mb-4">
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

            {/* Кастомный чекбокс "Только с МИ" */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center">
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
                  className="peer sr-only"
                />
                <label
                  htmlFor="hasMI"
                  className="w-10 h-6 bg-gray-700 rounded-full cursor-pointer transition-all duration-200 peer-checked:bg-purple-600 flex items-center px-0.5"
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      filters.hasMI ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </label>
              </div>
              <span className="text-sm text-white/80 font-medium">
                Только с МИ
              </span>
            </div>

          {/* Сеттинг */}
          <div className="mt-6">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 pb-2 border-b border-white/10">
              <FaGlobe className="text-purple-400" />
              Сеттинг
            </h3>
            <p className="text-xs text-white/30 mb-2">Выберите до 1 сеттинга</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilterAndResetPage((prev) => ({
                    ...prev,
                    settings: prev.settings.length === allSettings.length ? [] : [...allSettings],
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.settings.length === allSettings.length
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Все
              </button>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.settings.includes(setting)
                      ? "bg-purple-600 text-white"
                      : filters.settings.length >= 1
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {setting}
                </button>
              ))}
            </div>
          </div>

          {/* Особенности */}
          <div className="mt-6">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 pb-2 border-b border-white/10">
              <FaGem className="text-purple-400" />
              Особенности
            </h3>
            <p className="text-xs text-white/30 mb-2">Выберите до 2 особенностей</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilterAndResetPage((prev) => ({
                    ...prev,
                    features: prev.features.length === allFeatures.length ? [] : [...allFeatures],
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.features.length === allFeatures.length
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Все
              </button>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.features.includes(feature)
                      ? "bg-purple-600 text-white"
                      : filters.features.length >= 2
                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-white/70">Показано игр: {filteredGames.totalCount}</p>

      {/* Индикатор активной подборки */}
      {selectedCollection && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-purple-300">Подборка:</span>
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

      {filteredGames.totalPages > 1 && (() => {
        const WINDOW = 3;
        const pages = [];
        for (let i = 1; i <= filteredGames.totalPages; i++) {
          if (i === 1 || i === filteredGames.totalPages || Math.abs(i - currentPage) <= WINDOW) {
            if (pages.length > 0 && pages[pages.length - 1] !== "...") {
              const prev = pages[pages.length - 1];
              if (typeof prev === "number" && i - prev > 1) pages.push("...");
            }
            pages.push(i);
          }
        }
        return (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 flex-wrap">
            <button
              onClick={() => {
                trackEvent("Пагинация", { page: currentPage - 1, action: "prev" });
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              ← Назад
            </button>
            <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            {pages.map((p) =>
              p === "..." ? (
                <span key="..." className="px-2 py-1 text-xs sm:text-sm text-white/30">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => {
                    trackEvent("Пагинация", { page: p, action: "click" });
                    setCurrentPage(p);
                  }}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
                    p === currentPage ? "bg-purple-600" : "bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            </div>
            <button
              onClick={() => {
                trackEvent("Пагинация", { page: currentPage + 1, action: "next" });
                setCurrentPage((p) =>
                  Math.min(filteredGames.totalPages, p + 1),
                );
              }}
              disabled={currentPage === filteredGames.totalPages}
              className="px-3 sm:px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 text-xs sm:text-sm"
            >
              Вперед →
            </button>
          </div>
        );
      })()}

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