import { useState, useEffect } from "react";
import { FaPlus, FaTimesCircle, FaCheckCircle } from "react-icons/fa";

// URL веб-приложения Google Apps Script — замени на реальный после публикации
// URL прокси-сервера на Vercel (пересылает запрос в Google Apps Script)
const SCHEDULE_API_URL = "/api/schedule";

const ScheduleForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    game: "",
    streamLink: "https://twitch.tv/tiankami",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  /** Конвертирует YYYY-MM-DD → DD.MM.YYYY */
  const toRuDate = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}.${m}.${y}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.date || !formData.time || !formData.game.trim()) {
      setError("Заполни дату, время и игру");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(SCHEDULE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toRuDate(formData.date),
          time: formData.time,
          game: formData.game.trim(),
          streamLink: formData.streamLink || "https://twitch.tv/tiankami",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ date: "", time: "", game: "", streamLink: "https://twitch.tv/tiankami" });
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(result.error || "Ошибка отправки. Попробуй ещё раз.");
      }
    } catch (err) {
      console.error("[ScheduleForm] Ошибка:", err);
      setError("Ошибка отправки. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl mb-4 text-white flex items-center gap-2">
        <FaPlus className="text-purple-400" />
        Добавить стрим в расписание
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4"
      >
        {/* Поля ввода */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wide mb-1.5">
              Дата <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
              className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wide mb-1.5">
              Время <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange("time", e.target.value)}
              required
              className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wide mb-1.5">
            Игра <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Название игры"
            value={formData.game}
            onChange={(e) => handleChange("game", e.target.value)}
            required
            className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wide mb-1.5">
            Ссылка на стрим
          </label>
          <input
            type="text"
            placeholder="https://twitch.tv/tiankami"
            value={formData.streamLink}
            onChange={(e) => handleChange("streamLink", e.target.value)}
            className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
          />
        </div>

        {/* Статус */}
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm animate-pulse">
            <FaCheckCircle />
            <span>Стрим добавлен!</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Кнопка */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 flex items-center justify-center gap-2"
        >
          {loading ? (
            "Отправка..."
          ) : (
            <>
              <FaPlus size={14} />
              Добавить стрим
            </>
          )}
        </button>
      </form>
    </section>
  );
};

export default ScheduleForm;
