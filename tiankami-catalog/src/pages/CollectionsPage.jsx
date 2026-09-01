import { useEffect, useState } from 'react'
import { fetchCollections } from '../utils/loadData'

const CollectionsPage = () => {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollections()
      .then(data => {
        setCollections(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-center py-20">Загрузка подборок...</div>

  return (
    <div>
      <h1 className="text-3xl mb-6">Подборки от Тиана</h1>
      {collections.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/70">Подборок пока нет.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, idx) => (
            <div
              key={idx}
              className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-accent-purple/50 transition-colors"
            >
              <h2 className="font-heading text-xl text-accent-pink mb-3">
                {collection.name}
              </h2>
              <ul className="space-y-2">
                {collection.games.map((game, gameIdx) => (
                  <li key={gameIdx} className="text-white/80 flex items-start gap-2">
                    <span className="text-accent-purple mt-1">•</span>
                    {game}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CollectionsPage