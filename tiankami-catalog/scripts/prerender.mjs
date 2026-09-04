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
import { BRAND } from "../src/config/branding.js";
import { isUrl } from "../src/utils/normalize.js";
import { slugify, uniqueSlug } from "../src/utils/slugify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

// Проверка: данные должны быть скачаны через `npm run sync`
const gamesPath = path.join(__dirname, "..", "src", "data", "games.json");
const collectionsPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "collections.json",
);
if (!fs.existsSync(gamesPath) || !fs.existsSync(collectionsPath)) {
  console.error(
    "❌ ОШИБКА: Файлы src/data/games.json или collections.json не найдены.",
  );
  console.error(
    "💡 Решение: запустите 'npm run sync' перед сборкой, чтобы скачать данные.",
  );
  process.exit(1);
}

const games = JSON.parse(fs.readFileSync(gamesPath, "utf-8"));
const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));

// Генерируем слаги, если их нет (используем единую утилиту)
const usedSlugs = new Set();
const gamesWithSlugs = games.map((game) => {
  if (game.slug) return game;
  const base = slugify(game.title);
  const slug = uniqueSlug(base, usedSlugs);
  usedSlugs.add(slug);
  return { ...game, slug };
});

// Базовый шаблон из собранного index.html
const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

/** Вставляет/заменяет мета-теги в шаблоне. */
function withMeta({ title, description, ogType = "website", ogImage, jsonLd, canonical }) {
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
    <meta property="og:type" content="${ogType}" />${
      ogImage && isUrl(ogImage) ? `\n    <meta property="og:image" content="${esc(ogImage)}" />` : ""
    }${jsonLd ? `\n    <script type="application/ld+json">\n${jsonLd}\n    </script>` : ""}${
      canonical ? `\n    <link rel="canonical" href="${esc(canonical)}" />` : ""
    }`;
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
    canonical: `${BRAND.siteUrl}/`,
  }),
);

// 2. Каталог
fs.writeFileSync(
  path.join(distDir, "catalog.html"),
  withMeta({
    title: `Каталог рогаликов — ${BRAND.name}`,
    description: `Все ${games.length} рогаликов: фильтры по жанру, статусу, оценке, сложности. Честные отзывы стримера.`,
    canonical: `${BRAND.siteUrl}/catalog`,
  }),
);

// 3. Подборки
fs.writeFileSync(
  path.join(distDir, "collections.html"),
  withMeta({
    title: `Подборки от ${BRAND.name}`,
    description: `Тематические подборки рогаликов: ${collections.map((c) => c.name).join(", ")}.`,
    canonical: `${BRAND.siteUrl}/collections`,
  }),
);

// 4. Страницы игр — в подпапки каталога для совместимости с роутером
const catalogDir = path.join(distDir, "catalog");
fs.mkdirSync(catalogDir, { recursive: true });

const gamePages = []; // слаги для sitemap
for (const game of gamesWithSlugs) {
  const slug = game.slug;
  gamePages.push(slug);

  const desc = (game.notes || game.title).slice(0, 160);

  // JSON-LD разметка для Google
  let jsonLd = null;
  if (game.rating) {
    jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.title,
      description: desc,
      genre: game.genre,
      gameItem: { '@type': 'GameServer', 'maxPlayers': 1 },
      applicationCategory: 'Game',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        bestRating: 10,
      },
      image: isUrl(game.image) ? game.image : undefined,
    }, null, 2);
  }

  // Создаём папку для слага и кладём туда index.html
  // Чтобы URL /catalog/<slug> отдавал именно этот статический файл
  const gameDir = path.join(catalogDir, slug);
  fs.mkdirSync(gameDir, { recursive: true });
  fs.writeFileSync(
    path.join(gameDir, "index.html"),
    withMeta({
      title: `${game.title} — ${BRAND.name}`,
      description: `${game.genre || "Рогалик"}. Оценка ${game.rating || "—"}/10. ${desc}`,
      ogType: "article",
      ogImage: game.image || "",
      canonical: `${BRAND.siteUrl}/catalog/${slug}`,
      jsonLd,
    }),
  );
}

console.log(`Пререндер: index + catalog + collections + ${gamesWithSlugs.length} страниц игр`);

// 5. sitemap.xml (пререндеренные страницы игр + основные разделы)
const escXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const urls = [
  { loc: `${BRAND.siteUrl}/`, priority: "1.0" },
  { loc: `${BRAND.siteUrl}/catalog`, priority: "0.9" },
  { loc: `${BRAND.siteUrl}/collections`, priority: "0.8" },
  ...gamePages.map((s) => ({
    loc: `${BRAND.siteUrl}/catalog/${s}`,
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
