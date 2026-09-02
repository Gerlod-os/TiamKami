/**
 * Пререндер статических HTML-страниц для SEO и превью в соцсетях.
 * Запускается после `vite build` (см. package.json: "build": "vite build && node scripts/prerender.mjs").
 *
 * Что делает: берёт src/data/games.json и collections.json, генерирует
 * dist/catalog.html (список), dist/games/<slug>.html для каждой игры и
 * переписывает dist/index.html метатегами главной.
 * Клиентский React затем «подхватывает» эти страницы как обычно (SPA-роутинг).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugify, uniqueSlug } from "../src/utils/slugify.js";
import { BRAND } from "../src/config/branding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

const games = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "src", "data", "games.json"),
    "utf-8",
  ),
);
const collections = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "src", "data", "collections.json"),
    "utf-8",
  ),
);

// Базовый шаблон из собранного index.html
const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

/** Вставляет/заменяет мета-теги в шаблоне. */
function withMeta({ title, description, ogType = "website" }) {
  const esc = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const meta = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${ogType}" />`;
  return template
    .replace(/<title>.*?<\/title>/s, meta)
    .replace(/<meta name="description"[^>]*>/gi, "");
}

// 1. Главная
fs.writeFileSync(
  path.join(distDir, "index.html"),
  withMeta({
    title: BRAND.siteTitle,
    description: `Каталог рогаликов ${BRAND.name}: ${games.length} игр с оценками, прогрессом и заметками стримера.`,
  }),
);

// 2. Каталог
fs.writeFileSync(
  path.join(distDir, "catalog.html"),
  withMeta({
    title: `Каталог рогаликов — ${BRAND.name}`,
    description: `Все ${games.length} рогаликов: фильтры по жанру, статусу, оценке, сложности. Честные отзывы стримера.`,
  }),
);

// 3. Подборки
fs.writeFileSync(
  path.join(distDir, "collections.html"),
  withMeta({
    title: `Подборки от ${BRAND.name}`,
    description: `Тематические подборки рогаликов: ${collections.map((c) => c.name).join(", ")}.`,
  }),
);

// 4. Страницы игр
const gamesDir = path.join(distDir, "games");
fs.mkdirSync(gamesDir, { recursive: true });

const usedSlugs = new Set();
const gamePages = []; // слаги для sitemap
let count = 0;
for (const game of games) {
  const baseSlug = slugify(game.title) || `game-${count}`;
  const unique = uniqueSlug(baseSlug, usedSlugs);
  usedSlugs.add(unique);
  gamePages.push(unique);

  const desc = (game.notes || game.title).slice(0, 160);
  fs.writeFileSync(
    path.join(gamesDir, `${unique}.html`),
    withMeta({
      title: `${game.title} — ${BRAND.name}`,
      description: `${game.genre || "Рогалик"}. Оценка ${game.rating || "—"}/10. ${desc}`,
      ogType: "article",
    }),
  );
  count++;
}

console.log(`Пререндер: index + catalog + collections + ${count} страниц игр`);

// 5. sitemap.xml (пререндеренные страницы игр + основные разделы)
const escXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const urls = [
  { loc: `${BRAND.siteUrl}/`, priority: "1.0" },
  { loc: `${BRAND.siteUrl}/catalog`, priority: "0.9" },
  { loc: `${BRAND.siteUrl}/collections`, priority: "0.8" },
  ...gamePages.map((s) => ({
    loc: `${BRAND.siteUrl}/games/${s}.html`,
    priority: "0.6",
  })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escXml(u.loc)}</loc><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
fs.writeFileSync(
  path.join(distDir, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${BRAND.siteUrl}/sitemap.xml\n`,
);
console.log(`SEO: sitemap.xml (${urls.length} URL) + robots.txt`);
