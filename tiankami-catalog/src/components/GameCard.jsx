import { FaStar, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa'

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

export default GameCard