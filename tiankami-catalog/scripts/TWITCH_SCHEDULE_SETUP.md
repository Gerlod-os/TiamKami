# Установка скрипта Twitch Schedule для Google Sheets

## Что делает скрипт

Автоматически загружает расписание стримов из Twitch API и записывает в лист «Расписание» Google Таблицы.

**Формат данных:** `date | time | game | streamLink`
- `date` — DD.MM.YYYY (например: 05.09.2026)
- `time` — HH:MM (например: 19:00)
- `game` — название игры из категории
- `streamLink` — https://twitch.tv/tiankami

---

## Шаг 1: Создание приложения на Twitch Dev Portal

1. Зайди на [dev.twitch.tv/console](https://dev.twitch.tv/console)
2. Нажми **«Register Your Application»**
3. Заполни:
   - **Name:** `Tiankami Schedule` (или любое)
   - **OAuth Redirect URLs:** `http://localhost` (не важно, токен не нужен)
   - **Category:** `Tools`
4. Нажми **«Create»**
5. Скопируй **Client ID** — он понадобится в шаге 3

---

## Шаг 2: Получение App Access Token

1. На странице приложения нажми **«Manage»**
2. Прокрути вниз до секции **«Client Secrets»** — скопируй **Client Secret**
3. Открой браузер и перейди по URL (замени `YOUR_CLIENT_ID` и `YOUR_CLIENT_SECRET`):

```
https://id.twitch.tv/oauth2/token?id=YOUR_CLIENT_ID&secret=YOUR_CLIENT_SECRET&grant_type=client_credentials
```

4. В ответе найди поле `access_token` — скопируй его (длина ~80 символов, начинается с `...`)
5. **Важно:** токен живёт 1 год, но лучше обновлять раз в несколько месяцев

---

## Шаг 3: Настройка Google Таблицы

1. Открой таблицу tiankami-catalog
2. Создай новый лист с именем **«Расписание»** (точно так же, без пробелов)
3. В первом ряду (A1:D1) напиши заголовки:

| A | B | C | D |
|---|---|---|---|
| date | time | game | streamLink |

4. В меню выбери: **Расширения → Apps Script**
5. Откроется редактор Apps Script
6. Удали весь код в файле `Code.gs`
7. Вставь код из файла `scripts/twitch-schedule-script.txt` (весь контент)
8. Нажми 💾 (сохранить)

---

## Шаг 4: Настройка переменных

1. В редакторе Apps Script нажми ⚙️ (иконка шестерёнки) — **Project Settings**
2. Прокрути до секции **«Script Properties»**
3. Нажми **«Add Key»** и добавь 3 переменные:

| Key | Value |
|---|---|
| `TWITCH_CLIENT_ID` | Client ID из шага 1 |
| `TWITCH_ACCESS_TOKEN` | Access Token из шага 2 |
| `TWITCH_BROADCASTER_ID` | ID канала Tiankami (см. шаг 5) |

4. Нажми **«Save»**

---

## Шаг 5: Получение BROADCASTER_ID

Есть 2 способа:

**Способ A (простой):**
1. Зайди на [twitchtracker.com/channels/tiankami](https://twitchtracker.com/channels/tiankami)
2. Найди **Channel ID** в информации о канале

**Способ B (через API):**
1. Открой в браузере:
```
https://api.twitch.tv/helix/users?login=tiankami
```
2. Добавь заголовок `Client-Id: <твой_client_id>` (через расширение браузера для API)
3. Или используй curl:
```bash
curl -H "Client-Id: YOUR_CLIENT_ID" "https://api.twitch.tv/helix/users?login=tiankami"
```
4. В ответе найди `"id": "..."` — это и есть broadcaster_id

---

## Шаг 6: Проверка работы

1. В редакторе Apps Script выбери функцию `updateSchedule` в выпадающем списке сверху
2. Нажми ▶️ **Run**
3. Дай разрешения (Google спросит доступ к таблицам и внешним API)
4. Проверь логи (View → Logs) — должно быть:
```
📡 Запрос расписания из Twitch API...
✅ Получено N стримов.
✅ Расписание обновлено.
```
5. Вернись в Google Таблицу — лист «Расписание» должен заполниться

---

## Шаг 7: Автоматический запуск

1. В редакторе Apps Script выбери функцию `installTrigger`
2. Нажми ▶️ **Run**
3. Дай разрешения
4. Готово! Скрипт будет обновлять расписание автоматически каждые 6 часов

Проверить триггеры:
- Выбери функцию `listTriggers` → Run
- В логах увидишь:
```
📋 Текущие триггеры:
  - updateSchedule: без описания
```

---

## Ручное обновление

Если нужно обновить расписание прямо сейчас:
1. Открой Apps Script
2. Выбери `updateSchedule` → Run
3. Проверь лог и лист «Расписание»

---

## Отладка

**Функция `checkConfig`** — проверяет, все ли переменные заданы:
- Выбери `checkConfig` → Run
- В логах увидишь статус каждой переменной

**Частые ошибки:**

| Ошибка | Решение |
|---|---|
| `❌ ОШИБКА: Не все переменные настроены` | Проверь Script Properties (шаг 4) |
| `401 Unauthorized` | Токен истёк — получи новый (шаг 2) |
| `403 Forbidden` | Проверь Client-Id и broadcaster_id |
| `429 Too Many Requests` | Слишком часто обновляешь — подожди |

---

## Обновление токена

Токен живёт 1 год, но лучше проверять раз в месяц:
1. Повтори **Шаг 2** для получения нового токена
2. В Apps Script: ⚙️ → Script Properties → измени `TWITCH_ACCESS_TOKEN`
3. Сохрани

---

## Удаление триггера

Если нужно отключить автообновление:
1. В Apps Script: ⏰ (иконка триггеров слева)
2. Удали триггер `updateSchedule`

---

## Приём данных из формы (дополнительно)

Форма на сайте `/schedule` отправляет POST-запросы в Google Apps Script. Добавь эту функцию в тот же скрипт:

```javascript
/**
 * Принимает данные из формы ScheduleForm и записывает в лист «Расписание».
 * Вызывается автоматически при POST-запросе с сайта.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { date, time, game, streamLink = "https://twitch.tv/tiankami" } = data;

    if (!date || !time || !game) {
      throw new Error("Не все поля заполнены");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Расписание");
    if (!sheet) {
      sheet = ss.insertSheet("Расписание");
      sheet.appendRow(["date", "time", "game", "streamLink"]);
    }

    sheet.appendRow([date, time, game, streamLink]);

    // Сортировка по дате
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const range = sheet.getRange(2, 1, lastRow - 1, 4);
      range.sort({ column: 1, ascending: true });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Публикация скрипта как веб-приложения

1. В редакторе Apps Script нажми **«Развернуть»** → **«Новое развертывание»**
2. Нажми на шестерёнку → **«Веб-приложение»**
3. Настрой:
   - **Описание:** `Tiankami Schedule API`
   - **Выполнять как:** `От моего имени`
   - **У кого есть доступ:** `Все, даже анонимные`
4. Нажми **«Развернуть»**
5. Скопируй **URL веб-приложения** (заканчивается на `/exec`)
6. Вставь URL в `src/components/ScheduleForm.jsx` вместо `YOUR_SCRIPT_ID`:

```javascript
const SCHEDULE_WEBAPP_URL = "https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec";
```

7. Нажми **«Управление развёртываниями»** → удали старую версию (если была)
