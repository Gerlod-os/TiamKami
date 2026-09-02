/**
 * МАСКОТЫ САЙТА.
 *
 * Сейчас включены авторские SVG-заглушки (нарисованы под стиль сайта).
 * Когда придёт разрешение на использование оригинального арта Тиана:
 *   1. Положи файлы в src/assets/ (например, hero.png уже лежит).
 *   2. Поменяй USE_ORIGINAL на true — оригиналы встанут по всему сайту.
 *
 * Формат: [включено сейчас, путь к файлу, alt-текст]
 */
import heroOriginal from '../assets/hero.png'
import heroFallback from '../assets/mascot-hero.svg'
import gamepadFallback from '../assets/mascot-gamepad.svg'

const USE_ORIGINAL = false // ← переключатель разрешения (true = оригиналы Тиана)

export const MASCOTS = {
  // Герой: шапка сайта / пустые состояния
  hero: USE_ORIGINAL
    ? { src: heroOriginal, alt: 'Маскот канала Tiankami' }
    : { src: heroFallback, alt: 'Маскот канала Tiankami (заглушка)' },

  // Геймпад: карточки, загрузка, футер
  gamepad: { src: gamepadFallback, alt: 'Геймпад-рогалик' },
}
