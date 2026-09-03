import { useEffect, useState, useMemo } from "react";
import { fetchGames } from "../utils/loadData";
import { slugify } from "../utils/slugify";
import { parseRuDate } from "../utils/date";
import GameCard from "../components/GameCard";
import GameModal from "../components/GameModal";
import { FaSearch, FaDice } from "react-icons/fa";

const CatalogPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [filters, setFilters] = useState({
    genres: [],
    statuses: [],
    minRating: "",
    maxRating: "",
    minComplexity: "",
    maxComplexity: "",
    minHours: "",
    maxHours: "",
    years: [],
    hasMI: false,
  });

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

  const allGenres = useMemo(() => {
    const genres = new Set();
    games.forEach((game) => {
      const genre = game.genre || "";
      genre.split(",").forEach((g) => genres.add(g.trim()));
    });
    return [...genres].filter(Boolean).sort();
  }, [games]);

  const allYears = useMemo(() => {
    const years = new Set();
    games.forEach((game) => {
      const releaseDate = game.releaseDate || "";
      const match = releaseDate.match(/\d{4}/);
      if (match) years.add(match[0]);
    });
    return [...years].sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (game) =>
          (game.title || "").toLowerCase().includes(q) ||
          (game.notes || "").toLowerCase().includes(q) ||
          (game.genre || "").toLowerCase().includes(q) ||
          (game.features || "").toLowerCase().includes(q) ||
          (game.setting || "").toLowerCase().includes(q),
      );
    }

    if (filters.genres.length > 0) {
      result = result.filter((game) => {
        const genre = game.genre || "";
        return filters.genres.some((g) =>
          genre
            .split(",")
            .map((x) => x.trim())
            .includes(g),
        );
      });
    }

    if (filters.statuses.length > 0) {
      result = result.filter((game) => filters.statuses.includes(game.status));
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

    return result;
  }, [games, searchQuery, filters, sortBy]);

  if (loading)
    return <div className="text-center py-20">Загрузка данных...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-6">Каталог рогаликов</h1>

      <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-grow max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Поиск по названию, жанру, особенностям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-accent-purple"
            />
          </div>

          <button
            onClick={() => {
              if (filteredGames.length === 0) return;
              const randomIndex = Math.floor(
                Math.random() * filteredGames.length,
              );
              setSelectedGame(filteredGames[randomIndex]);
            }}
            className="bg-accent-purple hover:bg-accent-pink text-white px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 whitespace-nowrap"
            title="Выбрать случайную игру из отфильтрованных"
          >
            <FaDice />
            <span>Случайная</span>
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent-purple"
          >
            <option value="title">Сортировка: по названию</option>
            <option value="rating">Сортировка: по оценке</option>
            <option value="hours">Сортировка: по часам</option>
            <option value="releaseDate">Сортировка: по дате выхода</option>
            <option value="date-new">Сортировка: сначала новые</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1 text-white/70">Жанр</label>
            <select
              multiple
              value={filters.genres}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );
                setFilters((prev) => ({ ...prev, genres: selected }));
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {allGenres.map((genre) => (
                <option key={genre} value={genre} className="bg-bg-dark">
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-white/70">Статус</label>
            <select
              multiple
              value={filters.statuses}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );
                setFilters((prev) => ({ ...prev, statuses: selected }));
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {["Пройдено", "Дропнуто", "Обзор", "Жду релиза"].map((status) => (
                <option key={status} value={status} className="bg-bg-dark">
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-white/70">
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
                setFilters((prev) => ({ ...prev, years: selected }));
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {allYears.map((year) => (
                <option key={year} value={year} className="bg-bg-dark">
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1 text-white/70">
                Оценка (мин-макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minRating: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxRating}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxRating: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">
                Сложность (мин-макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minComplexity}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minComplexity: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxComplexity}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxComplexity: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">
                Часы (мин-макс)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="мин"
                  value={filters.minHours}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minHours: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="макс"
                  value={filters.maxHours}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxHours: e.target.value,
                    }))
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasMI"
            checked={filters.hasMI}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, hasMI: e.target.checked }))
            }
            className="accent-accent-pink"
          />
          <label htmlFor="hasMI" className="text-sm text-white/70">
            Только с МИ
          </label>
        </div>
      </div>

      <p className="mb-4 text-white/70">Показано игр: {filteredGames.length}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.map((game) => (
          <GameCard
            key={slugify(game.title)}
            game={game}
            onClick={() => setSelectedGame(game)}
          />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-10 text-white/50">
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      )}

      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
};

export default CatalogPage;
