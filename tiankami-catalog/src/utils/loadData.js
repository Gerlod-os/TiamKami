import Papa from 'papaparse'

const DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7bwVMpAeDAHaW6UM5ShIJlgSkwYNub1Vl65GpRvUSYYivY-GP6d2lsXdfX5HpoA/pub?gid=195587646&single=true&output=tsv'

const CACHE_KEY = 'tiankami_games_v1'
const CACHE_TIME_KEY = 'tiankami_cache_time_v1'
const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 часа

function normalizeGames(rawData) {
  return rawData
    .filter(row => row[''] && row[''].trim() !== '')
    .map(row => ({
      title: row[''] || '',
      image: row[' '] || '',
      genre: row['Жанр'] || '',
      features: row['Особенности'] || '',
      setting: row['Сеттинг'] || '',
      complexity: row['Сложность'] || '',
      hours: row['Наиграно (часы)'] || '',
      status: row['Статус'] || '',
      progress: row['Прогресс (%)'] || '',
      rating: row['Оценка (?/10)'] || '',
      releaseDate: row['Дата выхода'] || '',
      playedDate: row['Когда играл'] || '',
      notes: row['Примечания'] || '',
      youtube: row['YouTube прохождение'] || '',
      hasMI: row['Проводил МИ'] || '',
      miVideo: row['Выпуск МИ'] || '',
    }))
}
const COLLECTIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7bwVMpAeDAHaW6UM5ShIJlgSkwYNub1Vl65GpRvUSYYivY-GP6d2lsXdfX5HpoA/pub?gid=1843357948&single=true&output=tsv'
const COLLECTIONS_CACHE_KEY = 'tiankami_collections_v1'
const COLLECTIONS_CACHE_TIME_KEY = 'tiankami_collections_time_v1'
const COLLECTIONS_CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 часа

export async function fetchCollections() {
  try {
    // Проверяем кэш
    const cached = localStorage.getItem(COLLECTIONS_CACHE_KEY)
    const cachedTime = localStorage.getItem(COLLECTIONS_CACHE_TIME_KEY)
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < COLLECTIONS_CACHE_DURATION)) {
      const parsed = JSON.parse(cached)
      if (parsed.length > 0) return parsed
    }

    const response = await fetch(COLLECTIONS_URL)
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
    const text = await response.text()
    const result = Papa.parse(text, {
      delimiter: '\t',
      header: false,
      skipEmptyLines: false,
    })

    const rows = result.data
    if (rows.length < 2) return []

    const headerRow = rows[0]
    const headerIndices = []
    headerRow.forEach((cell, idx) => {
      if (cell && cell.trim() !== '') {
        headerIndices.push(idx)
      }
    })

    const collections = []

    headerIndices.forEach((titleIdx, order) => {
      const name = headerRow[titleIdx].trim()
      if (!name) return

      let gameIndex = titleIdx + 1
      const secondRow = rows[1] || []
      if (!secondRow[gameIndex] || secondRow[gameIndex].trim() === '') {
        gameIndex = titleIdx + 2
      }
      const rankIndex = gameIndex + 1

      const games = []
      let description = ''
      if (order === 0 && secondRow[titleIdx] && secondRow[titleIdx].trim() !== '') {
        description = secondRow[titleIdx].trim()
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || []
        const gameName = row[gameIndex] ? row[gameIndex].trim() : ''
        if (gameName !== '') {
          const rank = row[rankIndex] ? row[rankIndex].trim() : ''
          games.push({ name: gameName, rank })
        }
      }

      collections.push({ name, description, games })
    })

    // Сохраняем в кэш
    localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(collections))
    localStorage.setItem(COLLECTIONS_CACHE_TIME_KEY, String(Date.now()))

    return collections
  } catch (error) {
    console.error('Ошибка загрузки подборок:', error)
    // Если есть кэш – вернём его
    const cached = localStorage.getItem(COLLECTIONS_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.length > 0) return parsed
    }
    return []
  }
}

export async function fetchGames() {
  try {
    // Пробуем взять из кэша
    const cached = localStorage.getItem(CACHE_KEY)
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < CACHE_DURATION)) {
      const parsed = JSON.parse(cached)
      // Проверяем, что кэш содержит хотя бы одну игру с полем title
      if (parsed.length > 0 && parsed[0].title) {
        return parsed
      }
    }

    const response = await fetch(DATA_URL)
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    const text = await response.text()
    const result = Papa.parse(text, {
      delimiter: '\t',
      header: true,
      skipEmptyLines: true,
    })

    const normalized = normalizeGames(result.data)
    
    // Сохраняем в кэш только если есть данные
    if (normalized.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(normalized))
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()))
    }

    return normalized
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    // Если fetch не удался, но есть старый кэш — вернём его
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.length > 0) return parsed
    }
    return []
  }
}