# Контекст сессии редизайна tiankami-catalog

> Создан: 2026-09-05 | Статус: реализация Этапа 10 завершена, продолжение

---

## 1. Цель проекта

Полный визуальный редизайн каталога roguelike-игр стримера Тианками. Стек: React 19, Vite 8, Tailwind CSS v3, React Router v7. Тема — пастельная, с переключением на неоновую. Деплой: Vercel.

---

## 2. Архитектура проекта

```
src/
  components/
    FxPanel.jsx          — секретная панель настроек (свитчер тем)
    GameCard.jsx          — карточка игры в каталоге
    GameDetails.jsx       — детальный просмотр игры
    GameModal.jsx         — модальное окно быстрого просмотра
    Layout.jsx            — header + footer + навигация
    TwitchWidget.jsx      — статус Twitch-стрима
    YandexMetrika.jsx     — метрика
    ScheduleForm.jsx      — форма расписания
    ErrorBoundary.jsx     — error boundary
  config/
    branding.js           — ссылки, названия бренда
    dataSources.js        — ID Google-таблицы
    mascots.js            — изображения маскотов
  data/
    games.json            — мастер-данные (~440 игр)
    collections.json      — подборки (5 коллекций)
    schedule.json         — расписание стримов
  pages/
    HomePage.jsx          — главная: статистика, коллекции, топы
    CatalogPage.jsx       — каталог: фильтры, поиск, пагинация
    CollectionsPage.jsx   — список подборок
    GamePage.jsx          — страница отдельной игры
    AboutPage.jsx         — о проекте
    SchedulePage.jsx      — расписание стримов
  utils/
    loadData.js           — загрузка данных (Google Sheets API)
    normalize.js          — нормализация данных, parseRuDate, normalizeStatus
    date.js               — утилиты дат
    slugify.js            — генерация slug
    storage.js            — localStorage
  index.css               — CSS-переменные тем, анимации
  App.jsx                 — роутер (React Router v7)
```

### Ключевые данные

- **Игра**: `title`, `genre`, `rating` (0-10), `status`, `hours`, `image`, `hasMI`, `miVideo`, `slug`, `steamAppId`
- **Статусы**: "Пройдено", "Дропнуто", "Обзор", "Жду релиза", "В процессе"
- **Подборки**: 5 коллекций с `name`, `description`, `games[]` (с `rank`)
- **Мастер-данные**: Google Sheets, лист «Все рогалики» (TSV), парсер ПОСТРОЧНЫЙ
- **Steam API**: только CDN по `steamAppId` для обложек

---

## 3. Текущая система тем

CSS-переменные в `src/index.css`:

```css
[data-theme="neon"] {
  --bg-primary: #121212;
  --bg-secondary: #1a1a2e;
  --bg-card: #1a1a2e;
  --accent-purple: #c9a0dc;
  --accent-pink: #ffb6c1;
  --accent-cyan: #a0c4ff;
}

[data-theme="pastel"] {
  --bg-primary: #f8f4f0;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --accent-purple: #c9a0dc;
  --accent-pink: #ffb6c1;
  --accent-cyan: #a0c4ff;
}
```

Переключение через `FxPanel.jsx` — свитчер между темами.

---

## 4. Что УЖЕ реализовано (план не нужен)

### MI-бейджи и специальные статусы (в GameCard + CatalogPage + GameModal)
- MI badge на карточке: золотой градиент, иконка трофея (`GameCard.jsx:94-99`)
- Рейтинг 10 с пульсацией: золотая рамка, `animate-pulse` (`GameCard.jsx:82-84`)
- Иконки статусов с цветами: ✅💀🔍⏳⚔️ (`GameCard.jsx:15-21`)
- Фильтр "Только MI": чекбокс в расширенных фильтрах (`CatalogPage.jsx:588-613`)
- Золотая кнопка MI в модалке (`GameModal.jsx:122-134`)

### Twitch-виджеты (общий кэш)
- `TwitchWidgetInHero.jsx` — компактный виджет в hero-секции главной страницы
- `TwitchHeaderWidget.jsx` — компактный виджет в шапке (Layout)
- Общий кэш: `tk_status`, `tk_avatar` (статус 5 мин, аватар 24 ч)
- Сброс кэша из FxPanel: `window.__tkResetTwitchCache()` + событие `tk-twitch-cache-reset`
- Удалён `TwitchWidget.jsx` (заменён на два виджета)

### Поиск, пагинация, фильтры
- SearchBar компонент интегрирован в CatalogPage
- Пагинация: 24 игры на страницу
- Фильтры разделены: основные + расширенные через `isFiltersVisible`

### GameModal
- Обложка игры, анимация появления, стилизованные кнопки

### GamePage
- Баннер на полную ширину, breadcrumbs, похожие игры

---

## 5. Планы редизайна (созданы в `.gigacode_vsc/plans/`)

### Этап 1: Карточки и базовые компоненты

#### 5.1. Пастельная тема (`01-pastel-theme.md` — 12 шагов)
- Обновить CSS-переменные для пастельной темы
- Заменить все hardcoded цвета на CSS-переменные
- Обновить hover/focus состояния
- Проверить обе темы (neon + pastel)

#### 5.2. Навбар (`02-navbar.md` — 6 шагов)
- Логотип с градиентным текстом
- Twitch-виджет в header (вместо отдельной секции)
- Анимация мобильного меню (slide-down)
- Hover-эффекты на навигации

#### 5.3. Поиск (`03-searchbar.md` — 4 шага)
- Подсказки при вводе (suggestions)
- Популярные теги/жанры
- Синхронизация с URL (query params)

#### 5.4. GameCard (`04-gamecard.md` — 4 шага)
- Увеличить обложку (с 160px до 200px)
- Бейдж рейтинга (круглый, цвет по рейтингу)
- MI badge (уже есть — проверить визуал)
- Статус-иконки (уже есть — проверить визуал)

### Этап 2: Каталог и модалка

#### 5.5. Каталог (`05-catalog.md` — 4 шага)
- Ограничение жанров в фильтрах (10 + "ещё")
- Разделить фильтры: основные (сверху) + расширенные (сворачиваемые)
- Анимация пагинации (fade при переключении)

#### 5.6. GameModal (`06-game-modal.md` — 5 шагов)
- Обложка на всю ширину модалки
- Fade-in + scale анимация
- Стилизованные кнопки (Steam, MI video)
- Плавное закрытие

### Этап 3: Страница игры

#### 5.7. GamePage (`07-game-page.md` — 5 шагов)
- Hero-секция с баннером на всю ширину
- Breadcrumbs над контентом
- Карточки статистики (rating, hours, status)
- Горизонтальный скролл похожих игр
- Статус-бейджи

### Этап 4: Подборки

#### 5.8. Collections (`08-collections.md` — создать)
- Отдельная страница для каждой подборки
- Список игр в подборке с рангами
- Описание подборки

### Этап 5: Глобальные изменения

#### 5.9. Глобальные стили (`09-global.md` — создать)
- Шрифты, отступы, border-radius
- Анимации появления страниц
- Scrollbar styling
- Responsive breakpoints

---

## 6. Команды проекта

```bash
npm run dev       # разработка (localhost:5173)
npm run build     # предсборка: sync → vite build → prerender
npm run sync      # скачать таблицу в src/data/*.json
npx oxlint        # линтер (НЕ ESLint)
```

---

## 7. Жёсткие ограничения

- Steam API: только CDN по `steamAppId`
- noembed-лимит: 20 проверок за сессию
- Автоповторы: всё кэшируется (Twitch 5 мин / 24 ч, YouTube — бессрочно)
- Построчный парсер подборок: НЕ переписывать
- Конфиги: не удалять `vite.config.js`, `package.json`, `vercel.json`
- `import.meta.env` в Node: не читать `.env` вручную

---

## 8. Текущий статус

- ✅ Все 8 планов созданы в `.gigacode_vsc/plans/`:
  - `01-pastel-theme.md`, `02-navbar.md`, `03-searchbar.md`, `04-gamecard.md`
  - `05-catalog.md`, `06-game-modal.md`, `07-game-page.md`
  - `10-homepage.md` (реализован 05.09.2026)
- ✅ Планы для MI-бейджей и статусов — не нужны (уже реализовано)
- ⏳ Планы для Collections (`08-collections.md`) и глобальных стилей (`09-global.md`) — нужно создать
- ⏳ Следующий шаг: начать реализацию с Этапа 1 (пастельная тема)

---

## 9. Примечания по реализации

- Использовать `edit` для правки существующих файлов
- Перед каждым изменением логики — описать план
- После изменений: `npm run build` + `npx oxlint`
- Обновлять `PLAN.md` при изменениях архитектуры
- Пользователь не программист — объяснять простым языком
