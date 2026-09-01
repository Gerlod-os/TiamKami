import { Link } from 'react-router-dom'
import GameDetails from './GameDetails'
import { slugify } from '../utils/slugify'

const GameModal = ({ game, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-dark border border-accent-purple/30 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-glow-purple"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-heading text-white">{game.title}</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl leading-none"
              title="Закрыть"
            >
              ×
            </button>
          </div>

          <GameDetails game={game} />

          <Link
            to={`/catalog/${slugify(game.title)}`}
            className="inline-block mt-4 px-4 py-2 bg-accent-pink text-black font-heading rounded-xl hover:bg-white transition-colors"
          >
            Открыть страницу
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GameModal