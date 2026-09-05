import { useEffect, useState, useMemo } from "react";
import { fetchSchedule } from "../utils/loadData";
import { parseRuDate } from "../utils/date";
import { BRAND } from "../config/branding.js";
import { FaCalendarAlt, FaClock, FaGamepad, FaTwitch, FaExternalLinkAlt } from "react-icons/fa";
import ScheduleForm from "../components/ScheduleForm";

const SchedulePage = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule()
      .then((data) => {
        setSchedule(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[SchedulePage] Ошибка загрузки:", err);
        setLoading(false);
      });
  }, []);

  // Мета-теги
  useEffect(() => {
    document.title = `Расписание стримов — ${BRAND.name}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        `Расписание стримов Tiankami — когда и во что стримит.`,
      );
    }
    const setMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };
    setMeta("og:title", `Расписание стримов — ${BRAND.name}`);
    setMeta("og:description", `Расписание стримов Tiankami — когда и во что стримит.`);
    setMeta("og:type", "website");
    setMeta("og:url", `${BRAND.siteUrl}/schedule`);
    setMeta("og:image", `${BRAND.siteUrl}/assets/hero-CLDdwZDr.png`);
  }, []);

  const now = useMemo(() => new Date(), []);

  /** Парсит время HH:MM в Date (сегодня + время) */
  const parseTime = (timeStr, baseDate) => {
    if (!timeStr) return baseDate;
    const parts = timeStr.split(":");
    if (parts.length !== 2) return baseDate;
    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      parseInt(parts[0]),
      parseInt(parts[1]),
    );
  };

  const { upcoming, past } = useMemo(() => {
    const upcoming = [];
    const past = [];
    schedule.forEach((item) => {
      const date = parseRuDate(item.date);
      if (!date) return;
      // Сравниваем дату + время
      const dateTime = parseTime(item.time, date);
      if (dateTime >= now) {
        upcoming.push({ ...item, parsedDate: dateTime });
      } else {
        past.push({ ...item, parsedDate: dateTime });
      }
    });
    // Сортируем: ближайшие первыми
    upcoming.sort((a, b) => a.parsedDate - b.parsedDate);
    past.sort((a, b) => b.parsedDate - a.parsedDate);
    return { upcoming, past };
  }, [schedule, now]);

  const nearest = upcoming[0] || null;

  const formatDate = (date) => {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading)
    return <div className="text-center py-20">Загрузка расписания...</div>;

  return (
    <div>
      <h1 className="text-3xl mb-6">Расписание стримов</h1>

      {/* Ближайший стрим — крупно */}
      {nearest && (
        <section className="mb-8">
          <div className="bg-gradient-to-br from-[var(--accent-purple)]/40 to-[var(--accent-pink)]/40 rounded-2xl border-[var(--accent-purple)]/30 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-[var(--accent-purple)] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                Ближайший стрим
              </span>
              {isToday(nearest.parsedDate) && (
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full animate-pulse">
                  Сегодня
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-[var(--accent-purple)] text-xl" />
                <span className="text-xl sm:text-2xl font-heading font-bold text-white">
                  {formatDate(nearest.parsedDate)}
                </span>
              </div>
              {nearest.time && (
                <div className="flex items-center gap-2">
                  <FaClock className="text-white/50" />
                  <span className="text-lg text-white/80 font-mono">
                    {nearest.time}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <FaGamepad className="text-accent-pink" />
              <span className="text-lg text-white/90">
                Игра: <span className="font-bold">{nearest.game}</span>
              </span>
            </div>

            {nearest.streamLink && (
              <a
                href={nearest.streamLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-purple)] hover:brightness-110 text-white rounded-xl font-medium transition-all shadow-lg shadow-[var(--accent-purple)]/20 hover:shadow-[var(--accent-purple)]/40 hover:-translate-y-0.5"
              >
                <FaTwitch size={16} />
                Перейти на Twitch
                <FaExternalLinkAlt size={12} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Все предстоящие стримы */}
      {upcoming.length > 1 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl mb-4 text-white flex items-center gap-2">
            <FaCalendarAlt className="text-[var(--accent-purple)]" />
            Остальные стримы
          </h2>
          <div className="space-y-2">
            {upcoming.slice(1).map((item, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                    <FaCalendarAlt className="text-[var(--accent-purple)] shrink-0" />
                    <span>{formatDate(item.parsedDate)}</span>
                    {isToday(item.parsedDate) && (
                      <span className="text-red-400 text-xs font-bold">Сегодня</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGamepad className="text-accent-pink shrink-0" />
                    <span className="text-white truncate">{item.game}</span>
                  </div>
                </div>
                {item.time && (
                  <div className="flex items-center gap-1.5 text-white/60 shrink-0">
                    <FaClock />
                    <span className="font-mono text-sm">{item.time}</span>
                  </div>
                )}
                {item.streamLink && (
                  <a
                    href={item.streamLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[var(--accent-purple)] hover:text-white transition-colors"
                    title="Перейти на Twitch"
                  >
                    <FaTwitch size={18} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Прошедшие стримы */}
      {past.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-xl mb-4 text-white/50 flex items-center gap-2">
            <FaCalendarAlt className="text-white/30" />
            Прошедшие стримы
          </h2>
          <div className="space-y-2">
            {past.slice(0, 5).map((item, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center gap-4 opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                    <FaCalendarAlt className="shrink-0" />
                    <span>{formatDate(item.parsedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGamepad className="text-white/30 shrink-0" />
                    <span className="text-white/60 truncate">{item.game}</span>
                  </div>
                </div>
                {item.time && (
                  <div className="flex items-center gap-1.5 text-white/40 shrink-0">
                    <FaClock />
                    <span className="font-mono text-sm">{item.time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Нет стримов */}
      {upcoming.length === 0 && (
        <section className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-white/70 text-lg mb-2">
            Ближайших стримов не запланировано
          </p>
          <p className="text-white/40 text-sm">
            Следите за обновлениями на{" "}
            <a
              href={BRAND.links.twitch}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-purple)] hover:text-white underline"
            >
              Twitch
            </a>
          </p>
        </section>
      )}

      {/* Форма добавления */}
      <ScheduleForm onSuccess={() => fetchSchedule().then(setSchedule)} />
    </div>
  );
};

export default SchedulePage;
