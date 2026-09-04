# PLAN.md — План работы проекта tiankami-catalog

## 📊 Текущее состояние

| Параметр | Значение |
|---|---|
| **Фреймворк** | React 19 + Vite 8 + Tailwind CSS v3 |
| **Роутер** | React Router v7 |
| **Данные** | Google Sheets (TSV + Sheets API) |
| **Страниц** | 440 игр + 6 страниц приложения |
| **Компонентов** | 8 компонентов |
| **Утилит** | 6 утилит (slugify, date, storage, swr, normalize, loadData) |
| **Сборка** | SEO-пререндер (440 статических страниц) |
| **Деплой** | Vercel (SPA-rewrite) |
| **Последнее обновление** | 04.09.2026 — полный аудит и исправление 14 проблем |

---

## 🏗 Архитектура

### Загрузка данных

```
1. Мгновенно: memoryGames / localStorage / games.json
2. В фоне: Оригинал (TSV) + Копия (Sheets API ссылки)
3. Merge: данные из Оригинал + ссылки из Копия
4. Кэш: localStorage TTL 6ч, ревалидация каждые 15мин
```

### Источники данных

| Источник | Назначение | API |
|---|---|---|
| Оригинал (`SPREADSHEET_ID`) | TSV данные (название, жанр, статус...) | Google Sheets TSV export |
| Копия (`COPY_SPREADSHEET_ID`) | Ссылки (Steam, YouTube, МИ) | Sheets API + Apps Script |

### Ключи

| Ключ | Где используется | Префикс |
|---|---|---|
| `VITE_SHEETS_API_KEY` | Браузер (сайт) | `VITE_` |
| `SHEETS_API_KEY_SERVER` | Sync-скрипт (Node) | нет (секрет) |

---

## 📁 Структура файлов

### Корневые конфигурационные файлы

| Файл | Назначение |
|---|---|
| `PROJECT_BRIEF.md` | **Источник правды** проекта (приоритет выше всех) |
| `AGENTS.md` | Инструкции для агентов и разработчиков |
| `PLAN.md` | Дорожная карта и архитектурные заметки (этот файл) |
| `GOOGLE_SHEETS_SCRIPT.txt` | Скрипт для Google Apps Script — автоматически копирует гиперссылки из оригинала в копию |
| `vercel.json` | Конфигурация деплоя (SPA-rewrite) |

### `src/`

| Файл | Назначение |
|---|---|
| `App.jsx` | Роутинг, Layout |
| `main.jsx` | Точка входа |
| `index.css` | Tailwind стили |
| `components/FxPanel.jsx` | Секретная панель (шестерёнка) |
| `components/GameCard.jsx` | Карточка игры |
| `components/GameDetails.jsx` | Детали игры |
| `components/GameModal.jsx` | Модальное окно игры |
| `components/Layout.jsx` | Шапка, навигация, футер |
| `components/TwitchWidget.jsx` | Виджет Twitch |
| `components/YandexMetrika.jsx` | Яндекс.Метрика |
| `components/ErrorBoundary.jsx` | Fallback при ошибках |
| `config/branding.js` | Бренд, ник, ссылки |
| `config/dataSources.js` | ID таблиц, API-ключи |
| `config/mascots.js` | Маскоты для тем |
| `data/games.json` | 440 игр + ссылки (сгенерировано) |
| `data/collections.json` | Подборки от Тиана |
| `pages/HomePage.jsx` | Главная + статистика |
| `pages/CatalogPage.jsx` | Каталог игр |
| `pages/CollectionsPage.jsx` | Подборки |
| `pages/GamePage.jsx` | Страница игры (og:image) |
| `pages/AboutPage.jsx` | О проекте |
| `pages/SchedulePage.jsx` | Расписание МИ |
| `utils/loadData.js` | Загрузка + обогащение данных |
| `utils/normalize.js` | Нормализация, slugify, metadata, extractLinksFromCopyRow |
| `utils/date.js` | parseRuDate |
| `utils/slugify.js` | URL-слаг (оставлен для совместимости) |
| `utils/storage.js` | safeGet, safeSet — единая обёртка localStorage |
| `utils/swr.js` | stale-while-revalidate утилита |

### `scripts/`

| Файл | Назначение |
|---|---|
| `sync-data.js` | Скачивание таблицы в JSON |
| `prerender.mjs` | SEO-пререндер (440 страниц) |

---

## 🚦 Жёсткие границы

| Запрет | Причина |
|---|---|
| 🚫 Steam API | Только CDN по appid |
| 🚫 noembed > 20 за сессию | Лимит бесплатного API |
| 🚫 Автоповторы запросов | Всё кэшируется |
| 🚫 Личные данные в коде | Только `branding.js` |
| 🚫 Переписывать парсер подборок | Построчный — обязательный |
| 🚫 Удалять конфиги | `vite.config.js`, `package.json` |

---

## 📝 История изменений

### 04.09.2026 — Полный аудит: исправление 14 проблем

| # | Что исправлено | Файлы | Приоритет |
|---|---|---|---|
| 1 | `npm install` — зависимости установлены | `package-lock.json` | 🔴 |
| 2 | Создан `.gitignore` — node_modules/, .env/, dist/ игнорируются | `.gitignore` | 🔴 |
| 3 | Убраны `@types/react` и `@types/react-dom` — не нужны для JSX | `package.json` | 🟡 |
| 4 | Удалён `swr.js` — мёртвый код, не используется | `rm src/utils/swr.js` | 🟡 |
| 5 | Убран unused import `FaClock` из GameCard | `GameCard.jsx` | 🟡 |
| 6 | Консолидация slugify — единый источник в `slugify.js`, импортируется везде | `normalize.js`, `loadData.js`, `prerender.mjs`, `slugify.js` | 🟡 |
| 7 | Code splitting — 4 чанка вместо 1 (vendor 243KB, utils 19KB, app 334KB) | `vite.config.js` | 🔴 |
| 8 | Добавлены тесты для `normalizeCollections`, `getAllSettings`, `getAllFeatures` | `__tests__/normalize.test.js` | 🟡 |
| 9 | `parseLinksFromRow` — определение типа ссылки по label (МИ/YouTube), fallback по индексу | `loadData.js` | 🟡 |
| 10 | JSON-LD разметка (schema.org VideoGame) — runtime в GamePage + prerender для SEO | `GamePage.jsx`, `prerender.mjs` | 🟡 |
| 11 | Skip-to-content ссылка + `id="main-content"` на `<main>` | `index.html`, `Layout.jsx` | 🟡 |
| 12 | Fallback шрифтов — system-ui, -apple-system, Segoe UI | `index.css` | 🟡 |
| 13 | Исправлен пустой `alt` на hero-баннере (теперь `alt={game.title}`) | `GamePage.jsx` | 🟢 |
| 14 | Canonical URL на всех prerender-страницах | `prerender.mjs` | 🟢 |

---

### 03.09.2026 — Полный аудит и исправление 14 проблем

| # | Что исправлено | Файлы |
|---|---|---|
| 1 | `parseLinksFromRow` — определяет тип ссылки по индексу колонки, а не по порядку | `loadData.js` |
| 2 | `buildColIndex` — эвристика названия пропускает колонки с картинками | `normalize.js` |
| 3 | `GamePage` — добавлен `og:image` для превью в соцсетях | `GamePage.jsx` |
| 4 | `TwitchWidget` — убран `reload()`, сброс через событие | `TwitchWidget.jsx` |
| 5 | `safeGet`/`safeSet` — вынесены в `utils/storage.js` | `storage.js`, `loadData.js`, `TwitchWidget.jsx`, `FxPanel.jsx` |
| 6 | `HomePage` — 4 × `[...games]` объединены в один `useMemo` | `HomePage.jsx` |
| 7 | `allGenres`/`allYears` — вынесены в `getGameMetadata()` | `normalize.js`, `CatalogPage.jsx` |
| 8 | `STATUS_ALIASES` — добавлены "Жду", "Не начал", "В паузе" | `normalize.js` |
| 9 | `isGameDataChanged` — пустые строки и undefined одинаковы | `loadData.js` |
| 10 | `extractLinksFromCopyRow` — унифицирована логика Steam | `normalize.js`, `sync-data.js` |
| 11 | `swr.js` — создана утилита stale-while-revalidate | `swr.js` |
| 12 | `prerender.mjs` — добавлен `og:image` для страниц игр | `prerender.mjs` |
| 13 | `normalizeGames` — генерирует уникальные `slug` для каждой игры | `normalize.js` |
| 14 | Все ссылки на `slugify(game.title)` заменены на `game.slug` | `GamePage.jsx`, `CatalogPage.jsx`, `HomePage.jsx`, `GameModal.jsx`, `prerender.mjs` |

---

## ⚠️ Известные ловушки

| Ловушка | Как обойти |
|---|---|
| `import.meta.env` только в Vite | В Node читать `.env` вручную |
| ESM-импорты поднимаются вверх | Импортировать конфиг динамически |
| sheets.googleapis.com недоступен из РФ | Таймаут + ретраи |
| Первый лист — «Статистика» | Указывать лист явно в Sheets API |
| Vite 8 использует rolldown | `manualChunks` — функция, не объект |
| Google Fonts заблокирован в РФ | Fallback на system-ui в CSS |

---

## 📝 Обновление плана

Этот файл обновляется при:
- Добавлении/удалении файлов
- Изменении архитектуры
- Появлении новых ограничений
- Смене зависимостей
