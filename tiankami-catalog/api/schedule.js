/**
 * Vercel Serverless Function — прокси для записи стрима в Google Таблицу.
 *
 * Принимает POST-запрос и пересылает данные в Google Apps Script.
 * Это решает проблему CORS: браузер шлёт запрос на свой же домен,
 * а сервер Vercel делает запрос к Google без CORS-ограничений.
 *
 * URL: POST /api/schedule
 * Body: { date, time, game, streamLink }
 */

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyrQYM-AifKnglwo2P7-pDnjkmf2eNz9_0z_DEQ21Iht5mR_4Ipf3sfH3M_I6AqxfcY/exec";

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Парсим тело запроса
  let body;
  try {
    body = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON" });
  }

  const { date, time, game, streamLink } = body;

  // Валидация обязательных полей
  if (!date || !time || !game) {
    return res.status(400).json({
      success: false,
      error: "Не все поля заполнены (date, time, game обязательны)",
    });
  }

  try {
    // Пересылаем запрос в Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        game,
        streamLink: streamLink || "https://twitch.tv/tiankami",
      }),
    });

    // Google возвращает opaque response при no-cors — ловим ошибку если есть
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Google Apps Script вернул ${response.status}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Proxy] Ошибка при отправке в Google:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Ошибка сервера",
    });
  }
}
