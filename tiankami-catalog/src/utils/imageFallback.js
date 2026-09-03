/**
 * Генерирует SVG-заглушку для игры, если картинка не загрузилась.
 * Использует название и цвет для создания уникального фона.
 */
export function generateGamePlaceholder(name, genre = '') {
  // Генерируем детерминированный цвет на основе названия
  const colors = ['#4F46E5', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#2563EB'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const bgColor = colors[colorIndex];

  // Берем первые буквы названия для инициалов
  const initials = name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Создаем SVG строку
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="460" height="215" viewBox="0 0 460 215">
      <rect width="460" height="215" fill="${bgColor}"/>
      <circle cx="230" cy="80" r="40" fill="rgba(255,255,255,0.2)"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="48" 
        font-weight="bold" 
        fill="white"
        dy="-20"
      >${initials}</text>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="14" 
        fill="rgba(255,255,255,0.8)"
        dy="30"
      >${name.length > 20 ? name.substring(0, 18) + '...' : name}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Возвращает массив источников изображения для попытки загрузки.
 * Порядок важен: сначала основной источник, потом запасные.
 */
export function getImageSources(game) {
  const sources = [];

  // 1. Основная картинка из данных
  if (game.image) {
    sources.push(game.image);
  }

  // 2. Попытка реконструировать ссылку на Steam, если есть ID
  if (game.steam_id && !game.image?.includes('steam')) {
    sources.push(`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/header.jpg`);
  }

  // 3. Финальная заглушка (SVG)
  sources.push(generateGamePlaceholder(game.name, game.genre));

  return sources;
}
