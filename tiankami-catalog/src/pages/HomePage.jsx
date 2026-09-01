import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchGames } from '../utils/loadData'
import { slugify } from '../utils/slugify'
import GameCard from '../components/GameCard'
import { FaTwitch, FaYoutube, FaDiscord, FaStar, FaClock, FaCalendarAlt, FaGamepad } from 'react-icons/fa'

const SectionTitle = ({ icon, children }) => (
  <h2 className="text-2xl font-heading flex items-center gap-2 mb-4">
    {icon}
    {children}
  </h2>
)

const HomePage = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

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

  const topRated = useMemo(() => {
    return [...games]
      .filter(g => g.rating)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, 5)
  }, [games])

  const freshReleases = useMemo(() => {
    return [...games]
      .filter(g => g.releaseDate)
      .sort((a, b) => new Date(b.releaseDate.split('.').reverse().join('-')) - new Date(a.releaseDate.split('.').reverse().join('-')))
      .slice(0, 5)
  }, [games])

  const lastPlayed = useMemo(() => {
    return [...games]
      .filter(g => g.playedDate)
      .sort((a, b) => new Date(b.playedDate.split('.').reverse().join('-')) - new Date(a.playedDate.split('.').reverse().join('-')))
      .slice(0, 5)
  }, [games])

  const topByHours = useMemo(() => {
    return [...games]
      .filter(g => parseFloat(g.hours) > 0)
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
      .slice(0, 5)
  }, [games])

  if (loading) return <div className="text-center py-20">Загрузка данных...</div>

  return (
    <div className="space-y-12">
      {/* Виджет Twitch (заглушка) */}
      <section className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent-purple/30 flex items-center justify-center">
          <FaTwitch className="text-accent-purple text-2xl" />
        </div>
        <div>
          <p className="text-white/70 text-sm">Twitch</p>
          <p className="font-heading">Канал сейчас оффлайн</p>
        </div>
        <span className="ml-auto text-xs text-white/40">
          Подключите Client ID для живого статуса
        </span>
      </section>

      {/* Топ-5 по оценкам */}
      <section>
        <SectionTitle icon={<FaStar className="text-yellow-400" />}>
          Топ-5 по оценкам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topRated.map(game => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Свежие релизы */}
      <section>
        <SectionTitle icon={<FaCalendarAlt className="text-accent-blue" />}>
          Свежие релизы
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {freshReleases.map(game => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Последние сыгранные */}
      <section>
        <SectionTitle icon={<FaGamepad className="text-accent-purple" />}>
          Последние сыгранные
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {lastPlayed.map(game => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Топ по часам */}
      <section>
        <SectionTitle icon={<FaClock className="text-white/70" />}>
          Топ по часам
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topByHours.map(game => (
            <Link to={`/catalog/${slugify(game.title)}`} key={game.title}>
              <GameCard game={game} />
            </Link>
          ))}
        </div>
      </section>

      {/* Подборки от Тиана (заглушка) */}
      <section className="bg-white/5 rounded-2xl p-6 border border-accent-purple/30">
        <h2 className="text-2xl font-heading mb-4">Подборки от Тиана</h2>
        <p className="text-white/60">Здесь скоро появятся тематические подборки.</p>
      </section>
    </div>
  )
}

export default HomePage