import Papa from 'papaparse'

const DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7bwVMpAeDAHaW6UM5ShIJlgSkwYNub1Vl65GpRvUSYYivY-GP6d2lsXdfX5HpoA/pub?gid=195587646&single=true&output=tsv'

function normalizeGames(rawData) {
  return rawData
    .filter(row => row[''] && row[''].trim() !== '') // оставляем только строки с названием
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

export async function fetchGames() {
  try {
    const response = await fetch(DATA_URL)
    const text = await response.text()
    const result = Papa.parse(text, {
      delimiter: '\t',
      header: true,
      skipEmptyLines: true,
    })
    const normalized = normalizeGames(result.data)
    console.log('Нормализованные данные:', normalized.slice(0, 3))
    return normalized
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    return []
  }
}