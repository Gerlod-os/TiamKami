/**
 * Пререндер статических HTML-страниц для SEO и превью в соцсетях.
 * Запускается после `vite build` (см. package.json: "build": "vite build && node scripts/prerender.mjs").
 *
 * Что делает: берёт src/data/games.json и collections.json, генерирует
 * dist/catalog.html (список), dist/games/<slug>.html для каждой игры и
 * переписывает dist/index.html метатегами главной.
 * Клиентский React затем «подхватывает» эти страницы как обычно (SPA-роутинг).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { slugify } from '../src/utils/slugify.js';
import { BRAND } from '../src/config/branding.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const games = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'games.json'), 'utf-8'));
const collections = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'collections.json'), 'utf-8'));

// Базовый шаблон из собранного index.html
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

/** Вставляет/заменяет мета-теги в шаблоне. */
function withMeta({ title, description, ogType = 'website' }) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const meta = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${ogType}" />`;
  return template
    .replace(/<title>.*?<\/title>/s, meta)
    .replace(/<meta name="description"[^>]*>/gi, '');
}

/** Убирает из HTML клиентские теги, чтобы не дублировались. */
function stripClientMeta(html) {
  return html;
}

// 1. Главная
fs.writeFileSync(
  path.join(distDir, 'index.html'),
  withMeta({
    title: BRAND.siteTitle,
    description: `Каталог рогаликов ${BRAND.name}: ${games.length} игр с оценками, прогрессом и заметками стримера.`,
  })
);

// 2. Каталог
fs.writeFileSync(
  path.join(distDir, 'catalog.html'),
  withMeta({
    title: `Каталог рогаликов — ${BRAND.name}`,
    description: `Все ${games.length} рогаликов: фильтры по жанру, статусу, оценке, сложности. Честные отзывы стримера.`,
  })
);

// 3. Подборки
fs.writeFileSync(
  path.join(distDir, 'collections.html'),
  withMeta({
    title: `Подборки от ${BRAND.name}`,
    description: `Тематические подборки рогаликов: ${collections.map((c) => c.name).join(', ')}.`,
  })
);

// 4. Страницы игр
const gamesDir = path.join(distDir, 'games');
fs.mkdirSync(gamesDir, { recursive: true });

const usedSlugs = new Set();
let count = 0;
for (const game of games) {
  const slug = slugify(game.title) || `game-${count}`;
  const unique = usedSlugs.has(slug) ? `${slug}-${usedSlugs.size}` : slug;
  usedSlugs.add(unique);

  const desc = (game.notes || game.title).slice(0, 160);
  fs.writeFileSync(
    path.join(gamesDir, `${unique}.html`),
    withMeta({
      title: `${game.title} — ${BRAND.name}`,
      description: `${game.genre || 'Рогалик'}. Оценка ${game.rating || '—'}/10. ${desc}`,
      ogType: 'article',
    })
  );
  count++;
}

console.log(`Пререндер: index + catalog + collections + ${count} страниц игр`);
