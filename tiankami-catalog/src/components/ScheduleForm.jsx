import { useState, useCallback } from "react";
import { FaPlus, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

// URL веб-приложения Google Apps Script — замени на реальный после публикации
const SCHEDULE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyrQYM-AifKnglwo2P7-pDnjkmf2eNz9_0z_DEQ21Iht5mR_4Ipf3sfH3M_I6AqxfcY/exec";

const ScheduleForm = ({ onSuccess }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [game, setGame] = useState("");
  const [streamLink, setStreamLink] = useState("https://twitch.tv/tiankami");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null

  const resetStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetStatus();

    // Валидация
    if (!date || !time || !game.trim()) {
      setStatus("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(SCHEDULE_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          game: game.trim(),
          streamLink: streamLink.trim() || "https://twitch.tv/tiankami",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        setDate("");
        setTime("");
        setGame("");
        setStreamLink("https://twitch.tv/tiankami");
        onSuccess?.();
      } else {
        setStatus("error");
        console.error("[ScheduleForm] Ошибка:", result.error);
      }
    } catch (err) {
      setStatus("error");
      console.error("[ScheduleForm] Ошибка отправки:", err);
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
            value={game}
            onChange={(e) => setGame(e.target.value)}
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
            value={streamLink}
            onChange={(e) => setStreamLink(e.target.value)}
            className="w-full bg-[#111827] border border-gray-700 text-white text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-500 transition"
          />
        </div>

        {/* Статус */}
        {status === "success" && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <FaCheckCircle />
            <span>Стрим добавлен!</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <FaTimesCircle />
            <span>Ошибка отправки. Проверьте поля и попробуйте снова.</span>
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
