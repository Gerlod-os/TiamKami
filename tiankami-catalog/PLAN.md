# PLAN.md — План работы проекта tiankami-catalog

## 📊 Текущее состояние

| Параметр | Значение |
|---|---|
| **Фреймворк** | React 19 + Vite 8 + Tailwind CSS v3 |
| **Роутер** | React Router v7 |
| **Данные** | Google Sheets (TSV + Sheets API) |
| **Страниц** | 440 игр + 6 страниц приложения |
| **Компонентов** | 7 компонентов |
| **Сборка** | SEO-пререндер (440 статических страниц) |
| **Деплой** | Vercel (SPA-rewrite) |

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
| `config/branding.js` | Бренд, ник, ссылки |
| `config/dataSources.js` | ID таблиц, API-ключи |
| `config/mascots.js` | Маскоты для тем |
| `data/games.json` | 440 игр + ссылки (сгенерировано) |
| `data/collections.json` | Подборки от Тиана |
| `pages/HomePage.jsx` | Главная + статистика |
| `pages/CatalogPage.jsx` | Каталог игр |
| `pages/CollectionsPage.jsx` | Подборки |
| `pages/GamePage.jsx` | Страница игры |
| `pages/AboutPage.jsx` | О проекте |
| `pages/SchedulePage.jsx` | Расписание МИ |
| `utils/loadData.js` | Загрузка + обогащение данных |
| `utils/normalize.js` | Нормализация + маппинг колонок |
| `utils/date.js` | parseRuDate |
| `utils/slugify.js` | URL-слаг |

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

## ⚠️ Известные ловушки

| Ловушка | Как обойти |
|---|---|
| `import.meta.env` только в Vite | В Node читать `.env` вручную |
| ESM-импорты поднимаются вверх | Импортировать конфиг динамически |
| sheets.googleapis.com недоступен из РФ | Таймаут + ретраи |
| Первый лист — «Статистика» | Указывать лист явно в Sheets API |

---

## 🔄 Цикл разработки

```
1. Изменение логики → npm run build + npx oxlint + проверка src/data/*.md
2. Изменение данных → npm run sync + проверка src/data/*.json
3. Деплой → Vercel (автоматически из git)
```

---

## 📝 Обновление плана

Этот файл обновляется при:
- Добавлении/удалении файлов
- Изменении архитектуры
- Появлении новых ограничений
- Смене зависимостей
