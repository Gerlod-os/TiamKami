# PLAN.md — План работы и история проекта tiankami-catalog

> Этот файл объединяет дорожную карту (текущее состояние, архитектура, структура)
> и историю изменений (хронологию работ).

## 📊 Текущее состояние

| Параметр                 | Значение                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Фреймворк**            | React 19 + Vite 8 + Tailwind CSS v3                                                                                                                               |
| **Роутер**               | React Router v7                                                                                                                                                   |
| **Данные**               | Google Sheets (TSV + Sheets API)                                                                                                                                  |
| **Страниц**              | 440 игр + 6 страниц приложения                                                                                                                                    |
| **Компонентов**          | 11 компонентов (FxPanel, GameCard, GameDetails, GameModal, Layout, SearchBar, TwitchWidgetInHero, TwitchHeaderWidget, YandexMetrika, ErrorBoundary, ScheduleForm) |
| **Утилит и хуков**       | 7 утилит + 2 хука (slugify, date, storage, metrika, normalize, loadData + useCounter, useTwitchStatus)                                                            |
| **Данные**               | Google Sheets (TSV + Sheets API) + `schedule.json`                                                                                                                |
| **API**                  | Vercel serverless: `api/schedule.js` (прокси в Google Apps Script)                                                                                                |
| **Сборка**               | SEO-пререндер (440 статических страниц) + `prebuild: npm run sync`                                                                                                |
| **Деплой**               | Vercel (SPA-rewrite)                                                                                                                                              |
| **Тесты**                | vitest — 3 файла, 49 тестов                                                                                                                                       |
| **Последнее обновление** | 05.09.2026 — полировка карточки игры, чистый линтер, единый aspect-ratio обложек                                                                                  |

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

| Источник                      | Назначение                             | API                      |
| ----------------------------- | -------------------------------------- | ------------------------ |
| Оригинал (`SPREADSHEET_ID`)   | TSV данные (название, жанр, статус...) | Google Sheets TSV export |
| Копия (`COPY_SPREADSHEET_ID`) | Ссылки (Steam, YouTube, МИ)            | Sheets API + Apps Script |

### Ключи

| Ключ                    | Где используется   | Префикс      |
| ----------------------- | ------------------ | ------------ |
| `VITE_SHEETS_API_KEY`   | Браузер (сайт)     | `VITE_`      |
| `SHEETS_API_KEY_SERVER` | Sync-скрипт (Node) | нет (секрет) |

---

## 📁 Структура файлов

### Корневые конфигурационные файлы

| Файл                       | Назначение                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `PROJECT_BRIEF.md`         | **Источник правды** проекта (приоритет выше всех)                                       |
| `AGENTS.md`                | Инструкции для агентов и разработчиков                                                  |
| `PLAN.md`                  | Дорожная карта, архитектура и история изменений (этот файл)                             |
| `GOOGLE_SHEETS_SCRIPT.txt` | Скрипт для Google Apps Script — автоматически копирует гиперссылки из оригинала в копию |
| `vercel.json`              | Конфигурация деплоя (SPA-rewrite + API rewrites)                                        |
| `api/schedule.js`          | Vercel serverless function — прокси в Google Apps Script                                |

### Документация (`docs/`)

| Файл                            | Назначение                                        |
| ------------------------------- | ------------------------------------------------- |
| `docs/TWITCH_SCHEDULE_SETUP.md` | Пошаговая инструкция по настройке Twitch Schedule |
| `docs/ПОЛНАЯ_ВЫЖИМКА.md`        | Полная выжимка (краткая документация)             |

### `src/`

| Файл                                | Назначение                                               |
| ----------------------------------- | -------------------------------------------------------- |
| `App.jsx`                           | Роутинг, Layout                                          |
| `main.jsx`                          | Точка входа (BrowserRouter + ErrorBoundary + Метрика)    |
| `index.css`                         | Tailwind стили + анимации (blurIn, miGlow, miSway)       |
| `components/FxPanel.jsx`            | Секретная панель (шестерёнка)                            |
| `components/GameCard.jsx`           | Карточка игры (двухуровневый fallback обложек)           |
| `components/GameDetails.jsx`        | Детали игры                                              |
| `components/GameModal.jsx`          | Модальное окно игры                                      |
| `components/Layout.jsx`             | Шапка, навигация, футер                                  |
| `components/SearchBar.jsx`          | Мгновенный поиск с подсказками                           |
| `components/TwitchHeaderWidget.jsx` | Виджет Twitch в шапке (компактный)                       |
| `components/TwitchWidgetInHero.jsx` | Виджет Twitch в hero-секции главной                      |
| `components/YandexMetrika.jsx`      | Компонент-трекер Яндекс.Метрики                          |
| `components/ScheduleForm.jsx`       | Форма добавления стрима                                  |
| `components/ErrorBoundary.jsx`      | Fallback при ошибках рендера                             |
| `config/branding.js`                | Бренд, ник, ссылки                                       |
| `config/dataSources.js`             | ID таблиц, API-ключи                                     |
| `config/mascots.js`                 | Маскоты для тем                                          |
| `data/games.json`                   | 440 игр + ссылки (сгенерировано)                         |
| `data/collections.json`             | Подборки от Тиана                                        |
| `data/schedule.json`                | Расписание стримов (сгенерировано)                       |
| `pages/HomePage.jsx`                | Главная + статистика                                     |
| `pages/CatalogPage.jsx`             | Каталог игр                                              |
| `pages/CollectionsPage.jsx`         | Подборки                                                 |
| `pages/GamePage.jsx`                | Страница игры (og:image)                                 |
| `pages/AboutPage.jsx`               | О проекте                                                |
| `pages/SchedulePage.jsx`            | Расписание МИ                                            |
| `utils/loadData.js`                 | Загрузка + обогащение данных                             |
| `utils/normalize.js`                | Нормализация, slugify, metadata, extractLinksFromCopyRow |
| `utils/date.js`                     | parseRuDate                                              |
| `utils/slugify.js`                  | URL-слаг (оставлен для совместимости)                    |
| `utils/storage.js`                  | safeGet, safeSet — единая обёртка localStorage           |
| `utils/metrika.js`                  | trackEvent — отправка событий в Яндекс.Метрику           |
| `hooks/useCounter.js`               | Анимированный счётчик                                    |
| `hooks/useTwitchStatus.js`          | Статус Twitch (аватар + live)                            |

### `scripts/`

| Файл                         | Назначение                                               |
| ---------------------------- | -------------------------------------------------------- |
| `sync-data.js`               | Скачивание таблицы в JSON (игры + подборки + расписание) |
| `prerender.mjs`              | SEO-пререндер (440 страниц)                              |
| `twitch-schedule-script.txt` | Google Apps Script (Twitch API + doPost + триггеры)      |

### `__tests__/`

| Файл                | Назначение                                   |
| ------------------- | -------------------------------------------- |
| `date.test.js`      | Тесты `parseRuDate` (6)                      |
| `normalize.test.js` | Тесты нормализации (29)                      |
| `project.test.js`   | slugify, normalizeGames, links, storage (14) |

---

## 🚦 Жёсткие границы

| Запрет                          | Причина                          |
| ------------------------------- | -------------------------------- |
| 🚫 Steam API                    | Только CDN по appid              |
| 🚫 noembed > 20 за сессию       | Лимит бесплатного API            |
| 🚫 Автоповторы запросов         | Всё кэшируется                   |
| 🚫 Личные данные в коде         | Только `branding.js`             |
| 🚫 Переписывать парсер подборок | Построчный — обязательный        |
| 🚫 Удалять конфиги              | `vite.config.js`, `package.json` |

---

## 📝 История изменений

### 05.09.2026 — Полировка карточки игры (GameCard)

| #   | Что сделано                                                                                                                                                                                   | Файлы          | Приоритет |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------- |
| 1   | Двухуровневый fallback обложек: 1) вертикальная Steam 600×900, 2) горизонтальная header.jpg / game.image, 3) кастомная заглушка «Обложка недоступна»; плавное проявление по `onLoad` без blur | `GameCard.jsx` | 🔴        |
| 2   | Контейнер обложки `aspect-[2/3]`, `object-cover`, `object-[center_20%]`; ровная сетка (flex-col + ограничение переноса чипсов)                                                                | `GameCard.jsx` | 🔴        |
| 3   | Hover: подъём `-translate-y-1` + `scale-[1.02]`, тень `shadow-lg→shadow-2xl` с фиолетовым оттенком, image `group-hover:scale-105`, transition 300ms cubic-bezier                              | `GameCard.jsx` | 🟡        |
| 4   | Бейджи: оценка — цветовая кодировка (8–10 зелёный, 5–7 жёлтый, 1–4 красный; 10/10 золото + пульс), текст-lg; МИ — золотой градиент 135° + 3D-тень + блик + покачивание при hover              | `GameCard.jsx` | 🔴        |
| 5   | Иерархия текста: жанры с цветными индикаторами, сеттинг/особенности с иконками, нижняя строка Steam + часы (крупно) + статус (цвет по значению)                                               | `GameCard.jsx` | 🟡        |
| 6   | Кнопка «Быстрый просмотр» — только при hover, `absolute bottom-4`, вместе с градиентом снизу; убран blur-оверлей                                                                              | `GameCard.jsx` | 🟡        |
| 7   | Глобальные анимации `blurIn`, `miGlow`, `miSway` в `index.css` с cubic-bezier                                                                                                                 | `index.css`    | 🟢        |

### 05.09.2026 — Аудит: белый экран, чистый линтер, тесты

| #   | Что исправлено                                                                                                                                                                                                                                         | Файлы                              | Приоритет |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | --------- |
| 1   | Подключён `ErrorBoundary` вокруг `<App/>` (был объявлен, но не использовался) — ошибки рендера теперь показывают fallback вместо «бесконечной загрузки»                                                                                                | `main.jsx`                         | 🔴        |
| 2   | Невалидный Tailwind-класс `text-accent-purple` → `text-[var(--accent-purple)]`                                                                                                                                                                         | `GameDetails.jsx`                  | 🟡        |
| 3   | Убран неиспользуемый импорт `safeGet` из TwitchWidgetInHero                                                                                                                                                                                            | `TwitchWidgetInHero.jsx`           | 🟢        |
| 4   | `trackEvent` вынесен из `YandexMetrika.jsx` в отдельный модуль `utils/metrika.js` — устранено предупреждение `react(only-export-components)`                                                                                                           | `utils/metrika.js`, импорты        | 🟡        |
| 5   | Линтер полностью чист: в `useCounter.js` удалён лишний `setCount(0)`; в `CatalogPage.jsx` оставлена директория `oxlint-disable-next-line react/set-state-in-effect` для легитимной синхронизации URL→state — `npx oxlint` = 0 ошибок, 0 предупреждений | `useCounter.js`, `CatalogPage.jsx` | 🟢        |
| 6   | Добавлены тесты `project.test.js`: slugify, uniqueSlug, normalizeGames, extractLinksFromCopyRow, storage — всего 49 тестов                                                                                                                             | `__tests__/project.test.js`        | 🟢        |
| 7   | Группировка md: история изменений объединена с планом в `PLAN.md`, вспомогательные md перенесены в `docs/`                                                                                                                                             | `PLAN.md`, `docs/`                 | 🟢        |

### 05.09.2026 — Редизайн главной страницы (Этап 10)

| #   | Что сделано                                                                            | Файлы                                     | Приоритет |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------- | --------- |
| 1   | Hero-секция: баннер, двойной градиент, заголовок, быстрые цифры (пройдено, часы)       | `HomePage.jsx`                            | 🔴        |
| 2   | Анимированная статистика: хук `useCounter` — плавный счётчик от 0 до значения за 1 сек | `src/hooks/useCounter.js`, `HomePage.jsx` | 🔴        |
| 3   | Подборки: горизонтальный скролл мини-карточек (`snap-x`)                               | `HomePage.jsx`                            | 🟡        |
| 4   | Топы: горизонтальный скролл (`snap-x`, `w-64`), кнопка «Все →»                         | `HomePage.jsx`                            | 🔴        |
| 5   | TwitchWidgetInHero: компактный виджет, общий кэш с TwitchHeaderWidget                  | `TwitchWidgetInHero.jsx`                  | 🔴        |
| 6   | TwitchHeaderWidget: общий кэш, слушает `tk-twitch-cache-reset`                         | `TwitchHeaderWidget.jsx`                  | 🟡        |
| 7   | Удалён мёртвый код: `TwitchWidget.jsx`, `ShowAllButton`                                | `rm TwitchWidget.jsx`, `HomePage.jsx`     | 🟢        |

### 05.09.2026 — Критические фиксы UI (обложки, модалка, кубок МИ, поиск, маскоты)

| #   | Что сделано                                                                | Файлы                          | Приоритет |
| --- | -------------------------------------------------------------------------- | ------------------------------ | --------- |
| 1   | Обложки высокого качества: `steamCoverUrl` (портрет `library_600x900.jpg`) | `normalize.js`, `GameCard.jsx` | 🔴        |
| 2   | GameModal: закреплённая обложка слева, скролл только по контенту           | `GameModal.jsx`                | 🔴        |
| 3   | GamePage: градиент `bg-gradient-to-b` на весь контент                      | `GamePage.jsx`                 | 🟡        |
| 4   | Кубок МИ: 3D золотой SVG + блок «Мастер Игорь — турнир МИ»                 | `GameDetails.jsx`              | 🔴        |
| 5   | Логотип: рогалик-геймпад (inline SVG) вместо статичной картинки            | `Layout.jsx`                   | 🟡        |
| 6   | Поиск: мгновенные debounced-результаты (200 мс) до 8 шт                    | `SearchBar.jsx`                | 🟡        |
| 7   | HomePage: чиби-сайтама на фоне hero-секции                                 | `HomePage.jsx`                 | 🟢        |

### 04.09.2026 — Полный редизайн (11 задач)

| #   | Что сделано                                                                                          | Файлы                 | Приоритет |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------- | --------- |
| 1   | GameCard: адаптивная высота, затемнение снизу, бейдж рейтинга, жанры-чипсы, hover-анимация, `memo()` | `GameCard.jsx`        | 🔴        |
| 2   | CatalogPage: поиск, «Случайная», фильтры, пагинация, поиск из URL                                    | `CatalogPage.jsx`     | 🔴        |
| 3   | GamePage: hero-баннер, двойной градиент, похожие игры, SEO meta                                      | `GamePage.jsx`        | 🔴        |
| 4   | GameDetails: разделение на блоки, особенности-чипсы, кнопки с иконками                               | `GameDetails.jsx`     | 🟡        |
| 5   | HomePage: карточки статистики, анимации, SEO meta                                                    | `HomePage.jsx`        | 🟡        |
| 6   | CollectionsPage: карточки с обложкой первой игры                                                     | `CollectionsPage.jsx` | 🟡        |
| 7   | index.css: `fadeInUp`, `fadeIn`, `.animate-fade-in*`                                                 | `index.css`           | 🟢        |
| 8   | index.html: SEO мета-теги og/twitter                                                                 | `index.html`          | 🟢        |
| 9   | prerender.mjs: удаление старых meta, canonical, JSON-LD                                              | `prerender.mjs`       | 🟡        |
| 10  | Мобильная адаптация всех страниц                                                                     | Все страницы          | 🔴        |
| 11  | Оптимизация: `loading="lazy"`, `memo()`, пагинация 24                                                | Все компоненты        | 🟢        |

### 04.09.2026 — Редизайн страницы игры (5 задач)

| #   | Что сделано                                                                     | Файлы             | Приоритет |
| --- | ------------------------------------------------------------------------------- | ----------------- | --------- |
| 1   | GamePage: баннер full-width, двойной градиент, responsive height, название вниз | `GamePage.jsx`    | 🔴        |
| 2   | GamePage: breadcrumbs улучшен стиль                                             | `GamePage.jsx`    | 🔴        |
| 3   | MiniCard: увеличенная высота, hover-анимации                                    | `GamePage.jsx`    | 🔴        |
| 4   | GameDetails: проверен, изменений не требуется                                   | `GameDetails.jsx` | 🟢        |
| 5   | Сборка: `npm run build` + `npx oxlint` прошли успешно                           | —                 | 🔴        |

### 04.09.2026 — Расписание стримов + Yandex Metrika events

| #   | Что сделано                                                          | Файлы                            | Приоритет |
| --- | -------------------------------------------------------------------- | -------------------------------- | --------- |
| 1   | SchedulePage: полная реализация (ближайший стрим, список, прошедшие) | `SchedulePage.jsx`               | 🔴        |
| 2   | ScheduleForm: форма добавления стрима с валидацией                   | `ScheduleForm.jsx`               | 🔴        |
| 3   | api/schedule.js: Vercel serverless proxy POST                        | `api/schedule.js`                | 🔴        |
| 4   | loadData.js: `fetchSchedule()`, `revalidateSchedule`                 | `loadData.js`                    | 🔴        |
| 5   | dataSources.js: `SCHEDULE_SHEET_NAME`, `SCHEDULE_URL`                | `dataSources.js`                 | 🟡        |
| 6   | sync-data.js: скачивание расписания                                  | `sync-data.js`                   | 🟡        |
| 7   | date.js: `parseRuDate` принимает DD.MM.YYYY и YYYY-MM-DD             | `date.js`                        | 🟡        |
| 8   | YandexMetrika: `trackEvent()` + события кликов                       | `YandexMetrika.jsx` + компоненты | 🟢        |
| 9   | package.json: `prebuild: npm run sync`                               | `package.json`                   | 🟢        |
| 10  | catalog: фильтрация по подборке (`?collection=`)                     | `CatalogPage.jsx`                | 🟢        |

### 04.09.2026 — Полный аудит: исправление 14 проблем

| #   | Что исправлено                                                             | Файлы                                                        | Приоритет |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| 1   | `npm install` — зависимости установлены                                    | `package-lock.json`                                          | 🔴        |
| 2   | Создан `.gitignore`                                                        | `.gitignore`                                                 | 🔴        |
| 3   | Убраны `@types/react` и `@types/react-dom`                                 | `package.json`                                               | 🟡        |
| 4   | Удалён `swr.js` — мёртвый код                                              | `rm src/utils/swr.js`                                        | 🟡        |
| 5   | Убран unused import `FaClock` из GameCard                                  | `GameCard.jsx`                                               | 🟡        |
| 6   | Консолидация slugify — единый источник в `slugify.js`                      | `normalize.js`, `loadData.js`, `prerender.mjs`, `slugify.js` | 🟡        |
| 7   | Code splitting — 4 чанка                                                   | `vite.config.js`                                             | 🔴        |
| 8   | Добавлены тесты `normalizeCollections`, `getAllSettings`, `getAllFeatures` | `__tests__/normalize.test.js`                                | 🟡        |
| 9   | `parseLinksFromRow` — определение типа ссылки по label                     | `loadData.js`                                                | 🟡        |
| 10  | JSON-LD разметка (schema.org VideoGame)                                    | `GamePage.jsx`, `prerender.mjs`                              | 🟡        |
| 11  | Skip-to-content ссылка + `id="main-content"`                               | `index.html`, `Layout.jsx`                                   | 🟡        |
| 12  | Fallback шрифтов                                                           | `index.css`                                                  | 🟡        |
| 13  | Исправлен пустой `alt` на hero-баннере                                     | `GamePage.jsx`                                               | 🟢        |
| 14  | Canonical URL на всех prerender-страницах                                  | `prerender.mjs`                                              | 🟢        |

### 03.09.2026 — Полный аудит и исправление 14 проблем

| #   | Что исправлено                                                       | Файлы                                                                               |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `parseLinksFromRow` — тип ссылки по индексу колонки                  | `loadData.js`                                                                       |
| 2   | `buildColIndex` — эвристика названия пропускает колонки с картинками | `normalize.js`                                                                      |
| 3   | `GamePage` — добавлен `og:image`                                     | `GamePage.jsx`                                                                      |
| 4   | `TwitchWidget` — убран `reload()`                                    | `TwitchWidget.jsx`                                                                  |
| 5   | `safeGet`/`safeSet` — вынесены в `utils/storage.js`                  | `storage.js`, `loadData.js`, `TwitchWidget.jsx`, `FxPanel.jsx`                      |
| 6   | `HomePage` — объединение `[...games]` в один `useMemo`               | `HomePage.jsx`                                                                      |
| 7   | `allGenres`/`allYears` — вынесены в `getGameMetadata()`              | `normalize.js`, `CatalogPage.jsx`                                                   |
| 8   | `STATUS_ALIASES` — добавлены "Жду", "Не начал", "В паузе"            | `normalize.js`                                                                      |
| 9   | `isGameDataChanged` — пустые строки и undefined одинаковы            | `loadData.js`                                                                       |
| 10  | `extractLinksFromCopyRow` — унифицирована логика Steam               | `normalize.js`, `sync-data.js`                                                      |
| 11  | `swr.js` — создана утилита stale-while-revalidate                    | `swr.js`                                                                            |
| 12  | `prerender.mjs` — добавлен `og:image` для страниц игр                | `prerender.mjs`                                                                     |
| 13  | `normalizeGames` — генерирует уникальные `slug`                      | `normalize.js`                                                                      |
| 14  | Все ссылки на `slugify(game.title)` заменены на `game.slug`          | `GamePage.jsx`, `CatalogPage.jsx`, `HomePage.jsx`, `GameModal.jsx`, `prerender.mjs` |

---

## ⚠️ Известные ловушки

| Ловушка                                | Как обойти                          |
| -------------------------------------- | ----------------------------------- |
| `import.meta.env` только в Vite        | В Node читать `.env` вручную        |
| ESM-импорты поднимаются вверх          | Импортировать конфиг динамически    |
| sheets.googleapis.com недоступен из РФ | Таймаут + ретраи                    |
| Первый лист — «Статистика»             | Указывать лист явно в Sheets API    |
| Vite 8 использует rolldown             | `manualChunks` — функция, не объект |
| Google Fonts заблокирован в РФ         | Fallback на system-ui в CSS         |

---

## 📝 Обновление плана

Этот файл обновляется при:

- Добавлении/удалении файлов
- Изменении архитектуры
- Появлении новых ограничений
- Смене зависимостей
