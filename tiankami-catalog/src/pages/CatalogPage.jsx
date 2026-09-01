import { useEffect, useState, useMemo } from 'react'
import { fetchGames } from '../utils/loadData'
import GameModal from '../components/GameModal'
import { FaStar, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFilter } from 'react-icons/fa'

const statusIcons = {
  'Пройдено': <FaCheckCircle className="text-green-400" />,
  'Дропнуто': <FaTimesCircle className="text-red-400" />,
  'Обзор': <FaStar className="text-yellow-400" />,
  'Жду релиза': <FaHourglassHalf className="text-blue-400" />,
}

const GameCard = ({ game, onClick }) => {
  const statusIcon = statusIcons[game.status] || null

  return (
    <div
      onClick={onClick}
      className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-accent-purple/50 hover:shadow-glow-purple hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      <div className="h-40 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center">
        {game.image ? (
          <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🎮</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-heading text-lg text-white truncate" title={game.title}>
          {game.title}
        </h3>
        <p className="text-sm text-white/60 mt-1 truncate">{game.genre}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1">
            <FaStar className="text-yellow-400" />
            <span className="font-bold text-lg">{game.rating || '—'}</span>
          </div>
          <div className="flex items-center gap-1" title="Наиграно часов">
            <FaClock className="text-white/50" />
            <span className="text-sm text-white/70">{game.hours} ч</span>
          </div>
          <div title={game.status}>{statusIcon}</div>
        </div>
      </div>
    </div>
  )
}

const CatalogPage = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [filters, setFilters] = useState({
    genres: [],
    statuses: [],
    minRating: '',
    maxRating: '',
    minComplexity: '',
    maxComplexity: '',
    minHours: '',
    maxHours: '',
    years: [],
    hasMI: false,
  })

  useEffect(() => {
    fetchGames()
      .then(data => {
        setGames(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const allGenres = useMemo(() => {
    const genres = new Set()
    games.forEach(game => game.genre.split(',').forEach(g => genres.add(g.trim())))
    return [...genres].sort()
  }, [games])

  const allYears = useMemo(() => {
    const years = new Set()
    games.forEach(game => {
      if (game.releaseDate) {
        const match = game.releaseDate.match(/\d{4}/)
        if (match) years.add(match[0])
      }
    })
    return [...years].sort()
  }, [games])

  const filteredGames = useMemo(() => {
    let result = [...games]

    // Поиск
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(game =>
        game.title.toLowerCase().includes(q) ||
        game.notes.toLowerCase().includes(q)
      )
    }

    // Фильтр по жанрам
    if (filters.genres.length > 0) {
      result = result.filter(game =>
        filters.genres.some(genre =>
          game.genre.split(',').map(g => g.trim()).includes(genre)
        )
      )
    }

    // Фильтр по статусам
    if (filters.statuses.length > 0) {
      result = result.filter(game => filters.statuses.includes(game.status))
    }

    // Оценка
    if (filters.minRating !== '') {
      result = result.filter(game => parseFloat(game.rating) >= parseFloat(filters.minRating))
    }
    if (filters.maxRating !== '') {
      result = result.filter(game => parseFloat(game.rating) <= parseFloat(filters.maxRating))
    }

    // Сложность
    if (filters.minComplexity !== '') {
      result = result.filter(game => parseFloat(game.complexity) >= parseFloat(filters.minComplexity))
    }
    if (filters.maxComplexity !== '') {
      result = result.filter(game => parseFloat(game.complexity) <= parseFloat(filters.maxComplexity))
    }

    // Часы
    if (filters.minHours !== '') {
      result = result.filter(game => parseFloat(game.hours) >= parseFloat(filters.minHours))
    }
    if (filters.maxHours !== '') {
      result = result.filter(game => parseFloat(game.hours) <= parseFloat(filters.maxHours))
    }

    // Год выпуска
    if (filters.years.length > 0) {
      result = result.filter(game => {
        const match = game.releaseDate.match(/\d{4}/)
        return match && filters.years.includes(match[0])
      })
    }

    // Наличие МИ
    if (filters.hasMI) {
      result = result.filter(game => game.hasMI.toLowerCase() === 'true' || game.hasMI === 'TRUE' || game.hasMI === 'true')
    }

    // Сортировка
    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
        break
      case 'rating':
        result.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
        break
      case 'hours':
        result.sort((a, b) => (parseFloat(b.hours) || 0) - (parseFloat(a.hours) || 0))
        break
      case 'releaseDate':
        result.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
        break
      default:
        break
    }

    return result
  }, [games, searchQuery, filters, sortBy])

  if (loading) return <div className="text-center py-20">Загрузка данных...</div>

  const toggleArrayFilter = (array, value, setter) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value))
    } else {
      setter([...array, value])
    }
  }

  return (
    <div>
      <h1 className="text-3xl mb-6">Каталог рогаликов</h1>

      {/* Панель фильтров и поиска */}
      <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-grow max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Поиск по названию или примечаниям..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-accent-purple"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent-purple"
          >
            <option value="title">Сортировка: по названию</option>
            <option value="rating">Сортировка: по оценке</option>
            <option value="hours">Сортировка: по часам</option>
            <option value="releaseDate">Сортировка: по дате выхода</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Жанры */}
          <div>
            <label className="block text-sm mb-1 text-white/70">Жанр</label>
            <select
              multiple
              value={filters.genres}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value)
                setFilters(prev => ({ ...prev, genres: selected }))
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {allGenres.map(genre => (
                <option key={genre} value={genre} className="bg-bg-dark">
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Статусы */}
          <div>
            <label className="block text-sm mb-1 text-white/70">Статус</label>
            <select
              multiple
              value={filters.statuses}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value)
                setFilters(prev => ({ ...prev, statuses: selected }))
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {['Пройдено', 'Дропнуто', 'Обзор', 'Жду релиза'].map(status => (
                <option key={status} value={status} className="bg-bg-dark">
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Годы */}
          <div>
            <label className="block text-sm mb-1 text-white/70">Год выхода</label>
            <select
              multiple
              value={filters.years}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, option => option.value)
                setFilters(prev => ({ ...prev, years: selected }))
              }}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            >
              {allYears.map(year => (
                <option key={year} value={year} className="bg-bg-dark">
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Диапазоны */}
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1 text-white/70">Оценка (мин-макс)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minRating}
                  onChange={e => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxRating}
                  onChange={e => setFilters(prev => ({ ...prev, maxRating: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">Сложность (мин-макс)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="мин"
                  value={filters.minComplexity}
                  onChange={e => setFilters(prev => ({ ...prev, minComplexity: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="макс"
                  value={filters.maxComplexity}
                  onChange={e => setFilters(prev => ({ ...prev, maxComplexity: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">Часы (мин-макс)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="мин"
                  value={filters.minHours}
                  onChange={e => setFilters(prev => ({ ...prev, minHours: e.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="макс"
                  value={filters.maxHours}
                  onChange={e => setFilters(prev => ({ ...prev, maxHours: e.target.value }))}
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
            onChange={e => setFilters(prev => ({ ...prev, hasMI: e.target.checked }))}
            className="accent-accent-pink"
          />
          <label htmlFor="hasMI" className="text-sm text-white/70">
            Только с МИ
          </label>
        </div>
      </div>

      <p className="mb-4 text-white/70">Показано игр: {filteredGames.length}</p>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.map((game, idx) => (
          <GameCard key={idx} game={game} onClick={() => setSelectedGame(game)} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-10 text-white/50">
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      )}

      {/* Модальное окно */}
      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  )
}

export default CatalogPage