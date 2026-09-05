# PLAN.md — План работы проекта tiankami-catalog

## 📊 Текущее состояние

| Параметр                 | Значение                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Фреймворк**            | React 19 + Vite 8 + Tailwind CSS v3                                                                                                                    |
| **Роутер**               | React Router v7                                                                                                                                        |
| **Данные**               | Google Sheets (TSV + Sheets API)                                                                                                                       |
| **Страниц**              | 440 игр + 6 страниц приложения                                                                                                                         |
| **Компонентов**          | 10 компонентов (FxPanel, GameCard, GameDetails, GameModal, Layout, TwitchWidgetInHero, TwitchHeaderWidget, YandexMetrika, ErrorBoundary, ScheduleForm) |
| **Утилит**               | 7 утилит (slugify, date, storage, normalize, loadData, useCounter)                                                                                     |
| **Данные**               | Google Sheets (TSV + Sheets API) + `schedule.json`                                                                                                     |
| **API**                  | Vercel serverless: `api/schedule.js` (прокси в Google Apps Script)                                                                                     |
| **Сборка**               | SEO-пререндер (440 статических страниц) + `prebuild: npm run sync`                                                                                     |
| **Сборка**               | SEO-пререндер (440 статических страниц)                                                                                                                |
| **Деплой**               | Vercel (SPA-rewrite)                                                                                                                                   |
| **Последнее обновление** | 05.09.2026 — редизайн главной страницы (hero-секция, анимированная статистика, горизонтальные топы)                                                    |

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
| `PLAN.md`                  | Дорожная карта и архитектурные заметки (этот файл)                                      |
| `GOOGLE_SHEETS_SCRIPT.txt` | Скрипт для Google Apps Script — автоматически копирует гиперссылки из оригинала в копию |
| `vercel.json`              | Конфигурация деплоя (SPA-rewrite + API rewrites)                                        |
| `api/schedule.js`          | Vercel serverless function — прокси в Google Apps Script                                |

### `src/`

| Файл                                | Назначение                                               |
| ----------------------------------- | -------------------------------------------------------- |
| `App.jsx`                           | Роутинг, Layout                                          |
| `main.jsx`                          | Точка входа                                              |
| `index.css`                         | Tailwind стили                                           |
| `components/FxPanel.jsx`            | Секретная панель (шестерёнка)                            |
| `components/GameCard.jsx`           | Карточка игры                                            |
| `components/GameDetails.jsx`        | Детали игры                                              |
| `components/GameModal.jsx`          | Модальное окно игры                                      |
| `components/Layout.jsx`             | Шапка, навигация, футер                                  |
| `components/TwitchHeaderWidget.jsx` | Виджет Twitch в шапке (компактный)                       |
| `components/TwitchWidgetInHero.jsx` | Виджет Twitch в hero-секции главной                      |
| `components/YandexMetrika.jsx`      | Яндекс.Метрика + trackEvent                              |
| `components/ScheduleForm.jsx`       | Форма добавления стрима                                  |
| `components/ErrorBoundary.jsx`      | Fallback при ошибках                                     |
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
| `utils/useCounter.js`               | Анимированный счётчик                                    |

### `scripts/`

| Файл                         | Назначение                                               |
| ---------------------------- | -------------------------------------------------------- |
| `sync-data.js`               | Скачивание таблицы в JSON (игры + подборки + расписание) |
| `prerender.mjs`              | SEO-пререндер (440 страниц)                              |
| `twitch-schedule-script.txt` | Google Apps Script (Twitch API + doPost + триггеры)      |
| `TWITCH_SCHEDULE_SETUP.md`   | Инструкция по настройке Twitch Schedule                  |

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

### 05.09.2026 — Редизайн главной страницы (Этап 10)

| #   | Что сделано                                                                                                                                                        | Файлы                                     | Приоритет |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | --------- |
| 1   | Hero-секция: баннер с обложкой последней сыгранной игры, двойной градиент (сбоку + снизу), заголовок «Каталог рогаликов», описание, быстрые цифры (пройдено, часы) | `HomePage.jsx`                            | 🔴        |
| 2   | Анимированная статистика: хук `useCounter` — плавный счётчик от 0 до значения за 1 сек при загрузке                                                                | `src/utils/useCounter.js`, `HomePage.jsx` | 🔴        |
| 3   | Подборки: вместо текстового списка — горизонтальный скролл мини-карточек (4 превью на подборку, `w-20 h-28`, `snap-x`)                                             | `HomePage.jsx`                            | 🟡        |
| 4   | Топы: все 4 секции (оценки, релизы, сыгранные, часы) — горизонтальный скролл (`snap-x`, `w-64`), кнопка «Все →» вместо `ShowAllButton`                             | `HomePage.jsx`                            | 🔴        |
| 5   | TwitchWidgetInHero: компактный виджет (аватар 40px, статус, кнопка «Смотреть»), общий кэш с TwitchHeaderWidget (`tk_status`, `tk_avatar`)                          | `src/components/TwitchWidgetInHero.jsx`   | 🔴        |
| 6   | TwitchHeaderWidget: обновлён — общий кэш с TwitchWidgetInHero, слушает событие `tk-twitch-cache-reset` из FxPanel                                                  | `src/components/TwitchHeaderWidget.jsx`   | 🟡        |
| 7   | Удалён мёртвый код: `TwitchWidget.jsx` (заменён на два виджета с общим кэшем)                                                                                      | `rm src/components/TwitchWidget.jsx`      | 🟢        |
| 8   | Удалён ShowAllButton — заменён на «Все →» в TopSection                                                                                                             | `HomePage.jsx`                            | 🟢        |

---

### 05.09.2026 — Критические фиксы UI (обложки, модалка, кубок МИ, поиск, маскоты)

| #   | Что сделано                                                                                                                                                                     | Файлы                          | Приоритет |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------- |
| 1   | Обложки высокого качества: добавлен `steamCoverUrl` (портрет `library_600x900.jpg`); GameCard использует портрет `aspect-[2/3]`, `rounded-xl`, без растягивания и обрезки краёв | `normalize.js`, `GameCard.jsx` | 🔴        |
| 2   | GameModal: закреплённая обложка слева (`flex md:flex-row`, колонка-обложка не прокручивается), `overflow-hidden`, скролл только по контенту — обложка больше не вылезает        | `GameModal.jsx`                | 🔴        |
| 3   | GamePage: градиент `bg-gradient-to-b` на весь контент (цветовое настроение не обрывается после баннера)                                                                         | `GamePage.jsx`                 | 🟡        |
| 4   | Кубок МИ: 3D золотой SVG с бликом и свечением + заметный блок «Мастер Игорь — турнир МИ» с кнопкой в начале деталей                                                             | `GameDetails.jsx`              | 🔴        |
| 5   | Логотип: рогалик-геймпад (inline SVG, глаза-рогалика) вместо статичной картинки; имя бренда из `BRAND.name`                                                                     | `Layout.jsx`                   | 🟡        |
| 6   | Поиск: мгновенные debounced-результаты (200 мс) до 8 шт с обложкой, жанром и рейтингом                                                                                          | `SearchBar.jsx`                | 🟡        |
| 7   | HomePage: чибі-сайтама на фоне hero-секции (низкая прозрачность, `pointer-events-none`)                                                                                         | `HomePage.jsx`                 | 🟢        |

---

### 05.09.2026 — Аудит: белый экран, невалидные классы, мусор

| #   | Что исправлено                                                                                                                                                                                                                                                                              | Файлы                                            | Приоритет |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------- |
| 1   | Подключён `ErrorBoundary` вокруг `<App/>` (был объявлен, но не использовался) — ошибки рендера теперь показывают fallback вместо «бесконечной загрузки»                                                                                                                                     | `main.jsx`                                       | 🔴        |
| 2   | Невалидный Tailwind-класс `text-accent-purple` → `text-[var(--accent-purple)]` (иконка жанра не окрашивалась)                                                                                                                                                                               | `GameDetails.jsx`                                | 🟡        |
| 3   | Убран неиспользуемый импорт `safeGet` из TwitchWidgetInHero                                                                                                                                                                                                                                 | `TwitchWidgetInHero.jsx`                         | 🟢        |
| 4   | Единый aspect-ratio обложки `aspect-[2/3]` (стандарт Steam) вместо `aspect-[3/4]` — ровный ритм сетки карточек                                                                                                                                                                              | `GameCard.jsx`                                   | 🔴        |
| 5   | Равная высота карточек: `flex flex-col` + ограничение переноса чипсов (`max-h-8`/`max-h-5`) — карточка не «плывёт» при разном объёме текста                                                                                                                                                 | `GameCard.jsx`                                   | 🔴        |
| 6   | `trackEvent` вынесен из `YandexMetrika.jsx` в отдельный модуль `utils/metrika.js` — устранено предупреждение `react(only-export-components)` (fast-refresh)                                                                                                                                 | `utils/metrika.js`, `YandexMetrika.jsx`, импорты | 🟡        |
| 7   | Линтер полностью чист: в `useCounter.js` удалён лишний `setCount(0)` (состояние уже 0) — настоящая правка; в `CatalogPage.jsx` оставлена директория `oxlint-disable-next-line react/set-state-in-effect` для легитимной синхронизации URL→state — `npx oxlint` = 0 ошибок, 0 предупреждений | `useCounter.js`, `CatalogPage.jsx`               | 🟢        |

---

### 04.09.2026 — Полный редизайн (11 задач)

| #   | Что сделано                                                                                                                                                                                                                                 | Файлы                 | Приоритет |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------- |
| 1   | GameCard: адаптивная высота `h-36 sm:h-52`, затемнение снизу, бейдж рейтинга с цветной тенью, жанры-чипсы (4 пастельных цвета), hover-анимация, `loading="lazy"`, `memo()`                                                                  | `GameCard.jsx`        | 🔴        |
| 2   | CatalogPage: поиск `w-full` на мобильных, кнопки под поиском, «Случайная» только 🎲, кнопка сброса красная, расширенные фильтры 3 колонки, год выхода отдельной строкой, чекбокс МИ как toggle, пагинация уменьшена, поиск из URL-параметра | `CatalogPage.jsx`     | 🔴        |
| 3   | GamePage: hero-баннер `h-72 md:h-96`, двойной градиент, название `text-3xl md:text-5xl`, убрана дублирующая карточка, ссылки-кнопки с hover, похожие игры горизонтальный скролл, MiniCard с hover `scale-105`, SEO meta (og, twitter)       | `GamePage.jsx`        | 🔴        |
| 4   | GameDetails: разделён на «Основная информация» и «Детали», сеттинг отдельным блоком, особенности пастельные чипсы, примечания отдельным блоком, кнопки с иконками и тенями, добавлен `FaStar` и `isUrl`                                     | `GameDetails.jsx`     | 🟡        |
| 5   | HomePage: 5 карточек статистики с иконками, подборки с обложкой первой игры, анимации `animate-fade-in` с задержкой, секции с задержкой +30ms, SEO meta для главной                                                                         | `HomePage.jsx`        | 🟡        |
| 6   | CollectionsPage: карточки с обложкой первой игры, название/описание/кол-во, hover `-translate-y-1` + `shadow-2xl`, клик → `/catalog?search=Название`, загружает и игры и коллекции                                                          | `CollectionsPage.jsx` | 🟡        |
| 7   | index.css: `@keyframes fadeInUp` (снизу вверх), `@keyframes fadeIn`, `.animate-fade-in` (0.4s), `.animate-fade-in-delay` (0.6s)                                                                                                             | `index.css`           | 🟢        |
| 8   | index.html: SEO мета-теги `og:title/description/image/url/type`, `twitter:card/title/description/image`                                                                                                                                     | `index.html`          | 🟢        |
| 9   | prerender.mjs: удаление старых meta перед вставкой новых (regex), `twitter:*` на всех страницах, `og:image` с fallback на hero, canonical URL, JSON-LD (schema.org VideoGame)                                                               | `prerender.mjs`       | 🟡        |
| 10  | Мобильная адаптация: GameCard `h-36 sm:h-52`, CatalogPage поиск на всю ширину, кнопки под поиском, уменьшенная пагинация, статистика `grid-cols-2 md:grid-cols-5`, гамбургер-меню                                                           | Все страницы          | 🔴        |
| 11  | Оптимизация: `loading="lazy"` на всех `<img>`, `memo(GameCardInner)`, пагинация 24 карточки (без виртуализации)                                                                                                                             | Все компоненты        | 🟢        |

---

### 04.09.2026 — Редизайн страницы игры (5 задач)

| #   | Что сделано                                                                                                                                                                                                                              | Файлы             | Приоритет |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------- |
| 1   | GamePage: баннер full-width (убран `rounded-3xl`), двойной градиент затемнения (сбоку + снизу), responsive height `h-[400px] md:h-[450px]`, название перемещён вниз с `pb-8 md:pb-12`                                                    | `GamePage.jsx`    | 🔴        |
| 2   | GamePage: breadcrumbs улучшен стиль — `text-white/40` для неактивных, `text-white/90` для текущего, `hover:text-[var(--accent-purple)]` с `transition-colors`, уменьшен `FaChevronRight` до `size={10}`                                  | `GamePage.jsx`    | 🔴        |
| 3   | MiniCard: увеличена высота `h-24`, ширина `w-44`, hover `-translate-y-2` + `scale-110`, бордер `group-hover:border-[var(--accent-purple)]/30`, `animate-pulse` для rating === 10, `group-hover:text-[var(--accent-purple)]` для названия | `GamePage.jsx`    | 🔴        |
| 4   | GameDetails: проверен, изменений не требуется — блоки `bg-white/5` корректно выглядят на новой странице                                                                                                                                  | `GameDetails.jsx` | 🟢        |
| 5   | Сборка: `npm run build` + `npx oxlint` прошли успешно, 440 страниц пререндерены                                                                                                                                                          | —                 | 🔴        |

---

### 04.09.2026 — Расписание стримов + Yandex Metrika events

| #   | Что сделано                                                                                                                      | Файлы                                                                 | Приоритет |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| 1   | SchedulePage: полная реализация — ближайший стрим крупно, остальные списком, прошедшие (5 шт), сообщение «нет стримов», SEO meta | `SchedulePage.jsx`                                                    | 🔴        |
| 2   | ScheduleForm: форма добавления стрима с валидацией, конвертацией дат YYYY-MM-DD→DD.MM.YYYY, success-уведомление без alert        | `ScheduleForm.jsx`                                                    | 🔴        |
| 3   | api/schedule.js: Vercel serverless function — прокси POST в Google Apps Script                                                   | `api/schedule.js`                                                     | 🔴        |
| 4   | loadData.js: `fetchSchedule()` — загрузка расписания из Google Sheets, кэширование, конвертация дат                              | `loadData.js`                                                         | 🔴        |
| 5   | loadData.js: `revalidateSchedule` — фоновая ревалидация каждые 15 мин                                                            | `loadData.js`                                                         | 🟡        |
| 6   | dataSources.js: `SCHEDULE_SHEET_NAME`, `SCHEDULE_URL` (из копии таблицы)                                                         | `dataSources.js`                                                      | 🟡        |
| 7   | sync-data.js: скачивание расписания из Google Sheets, конвертация дат YYYY-MM-DD→DD.MM.YYYY                                      | `sync-data.js`                                                        | 🟡        |
| 8   | date.js: `parseRuDate` принимает DD.MM.YYYY и YYYY-MM-DD                                                                         | `date.js`                                                             | 🟡        |
| 9   | SchedulePage: сравнение с учётом времени (дата+время), а не только даты                                                          | `SchedulePage.jsx`                                                    | 🟡        |
| 10  | YandexMetrika: `trackEvent()` — отправка событий в Метрику                                                                       | `YandexMetrika.jsx`                                                   | 🟢        |
| 11  | YandexMetrika events: просмотр игры, быстрый просмотр, модалка, клик YouTube/Steam/МИ, случайная игра, пагинация                 | `GameCard.jsx`, `GameModal.jsx`, `GameDetails.jsx`, `CatalogPage.jsx` | 🟢        |
| 12  | package.json: `prebuild: npm run sync` — автообновление данных при деплое                                                        | `package.json`                                                        | 🟢        |
| 13  | vercel.json: rewrite rule `/api/*` → serverless functions                                                                        | `vercel.json`                                                         | 🟢        |
| 14  | catalog: фильтрация по подборке (`?collection=Название`)                                                                         | `CatalogPage.jsx`                                                     | 🟢        |
| 15  | scripts/twitch-schedule-script.txt: Google Apps Script (Twitch API + doPost + триггеры)                                          | `twitch-schedule-script.txt`                                          | 🟢        |
| 16  | scripts/TWITCH_SCHEDULE_SETUP.md: полная инструкция по настройке                                                                 | `TWITCH_SCHEDULE_SETUP.md`                                            | 🟢        |
| 17  | data/schedule.json: пустой массив как fallback                                                                                   | `schedule.json`                                                       | 🟢        |

---

### 04.09.2026 — Полный аудит: исправление 14 проблем

| #   | Что исправлено                                                                           | Файлы                                                        | Приоритет |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| 1   | `npm install` — зависимости установлены                                                  | `package-lock.json`                                          | 🔴        |
| 2   | Создан `.gitignore` — node_modules/, .env/, dist/ игнорируются                           | `.gitignore`                                                 | 🔴        |
| 3   | Убраны `@types/react` и `@types/react-dom` — не нужны для JSX                            | `package.json`                                               | 🟡        |
| 4   | Удалён `swr.js` — мёртвый код, не используется                                           | `rm src/utils/swr.js`                                        | 🟡        |
| 5   | Убран unused import `FaClock` из GameCard                                                | `GameCard.jsx`                                               | 🟡        |
| 6   | Консолидация slugify — единый источник в `slugify.js`, импортируется везде               | `normalize.js`, `loadData.js`, `prerender.mjs`, `slugify.js` | 🟡        |
| 7   | Code splitting — 4 чанка вместо 1 (vendor 243KB, utils 19KB, app 334KB)                  | `vite.config.js`                                             | 🔴        |
| 8   | Добавлены тесты для `normalizeCollections`, `getAllSettings`, `getAllFeatures`           | `__tests__/normalize.test.js`                                | 🟡        |
| 9   | `parseLinksFromRow` — определение типа ссылки по label (МИ/YouTube), fallback по индексу | `loadData.js`                                                | 🟡        |
| 10  | JSON-LD разметка (schema.org VideoGame) — runtime в GamePage + prerender для SEO         | `GamePage.jsx`, `prerender.mjs`                              | 🟡        |
| 11  | Skip-to-content ссылка + `id="main-content"` на `<main>`                                 | `index.html`, `Layout.jsx`                                   | 🟡        |
| 12  | Fallback шрифтов — system-ui, -apple-system, Segoe UI                                    | `index.css`                                                  | 🟡        |
| 13  | Исправлен пустой `alt` на hero-баннере (теперь `alt={game.title}`)                       | `GamePage.jsx`                                               | 🟢        |
| 14  | Canonical URL на всех prerender-страницах                                                | `prerender.mjs`                                              | 🟢        |

---

### 03.09.2026 — Полный аудит и исправление 14 проблем

| #   | Что исправлено                                                                  | Файлы                                                                               |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `parseLinksFromRow` — определяет тип ссылки по индексу колонки, а не по порядку | `loadData.js`                                                                       |
| 2   | `buildColIndex` — эвристика названия пропускает колонки с картинками            | `normalize.js`                                                                      |
| 3   | `GamePage` — добавлен `og:image` для превью в соцсетях                          | `GamePage.jsx`                                                                      |
| 4   | `TwitchWidget` — убран `reload()`, сброс через событие                          | `TwitchWidget.jsx`                                                                  |
| 5   | `safeGet`/`safeSet` — вынесены в `utils/storage.js`                             | `storage.js`, `loadData.js`, `TwitchWidget.jsx`, `FxPanel.jsx`                      |
| 6   | `HomePage` — 4 × `[...games]` объединены в один `useMemo`                       | `HomePage.jsx`                                                                      |
| 7   | `allGenres`/`allYears` — вынесены в `getGameMetadata()`                         | `normalize.js`, `CatalogPage.jsx`                                                   |
| 8   | `STATUS_ALIASES` — добавлены "Жду", "Не начал", "В паузе"                       | `normalize.js`                                                                      |
| 9   | `isGameDataChanged` — пустые строки и undefined одинаковы                       | `loadData.js`                                                                       |
| 10  | `extractLinksFromCopyRow` — унифицирована логика Steam                          | `normalize.js`, `sync-data.js`                                                      |
| 11  | `swr.js` — создана утилита stale-while-revalidate                               | `swr.js`                                                                            |
| 12  | `prerender.mjs` — добавлен `og:image` для страниц игр                           | `prerender.mjs`                                                                     |
| 13  | `normalizeGames` — генерирует уникальные `slug` для каждой игры                 | `normalize.js`                                                                      |
| 14  | Все ссылки на `slugify(game.title)` заменены на `game.slug`                     | `GamePage.jsx`, `CatalogPage.jsx`, `HomePage.jsx`, `GameModal.jsx`, `prerender.mjs` |

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
