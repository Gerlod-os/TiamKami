import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import FxPanel from "./FxPanel";
import TwitchHeaderWidget from "./TwitchHeaderWidget";
import { MASCOTS } from "../config/mascots.js";
import {
  FaTwitch,
  FaYoutube,
  FaDiscord,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import { BRAND } from "../config/branding.js";

const socialLinks = [
  {
    href: BRAND.links.twitch,
    icon: <FaTwitch size={20} />,
    label: "Twitch",
  },
  {
    href: BRAND.links.youtube,
    icon: <FaYoutube size={20} />,
    label: "YouTube",
  },
  {
    href: BRAND.links.discord,
    icon: <FaDiscord size={20} />,
    label: "Discord",
  },
];

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Главная" },
    { to: "/catalog", label: "Каталог" },
    { to: "/collections", label: "Подборки" },
    { to: "/schedule", label: "Расписание" },
    { to: "/about", label: "О канале" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-bg-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-accent-purple/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            {/* Рогалик-геймпад — фирменный маскот в стиле канала */}
            <svg
              viewBox="0 0 64 64"
              className="w-12 h-12 drop-shadow-lg flex-shrink-0"
              role="img"
              aria-label="Маскот канала — геймпад-рогалик"
            >
              <defs>
                <linearGradient
                  id="gamepadGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FFB6C1" />
                  <stop offset="100%" stopColor="#C9A0DC" />
                </linearGradient>
              </defs>
              {/* Корпус геймпада */}
              <rect
                x="8"
                y="20"
                width="48"
                height="28"
                rx="8"
                fill="url(#gamepadGrad)"
              />
              {/* D-pad */}
              <rect x="16" y="26" width="8" height="16" fill="#1a1a2e" rx="2" />
              <rect x="12" y="30" width="16" height="8" fill="#1a1a2e" rx="2" />
              {/* Кнопки */}
              <circle cx="44" cy="30" r="4" fill="#FF6B6B" />
              <circle cx="50" cy="34" r="4" fill="#4ECDC4" />
              <circle cx="40" cy="34" r="4" fill="#4ECDC4" />
              <circle cx="46" cy="38" r="4" fill="#FF6B6B" />
              {/* Глаза-рогалика */}
              <circle cx="26" cy="28" r="3" fill="#1a1a2e" />
              <circle cx="38" cy="28" r="3" fill="#1a1a2e" />
              <circle cx="27" cy="27" r="1" fill="#fff" />
              <circle cx="39" cy="27" r="1" fill="#fff" />
              {/* Улыбка */}
              <path
                d="M 28 34 Q 32 38 36 34"
                stroke="#1a1a2e"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <span className="font-heading text-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              {BRAND.name}
            </span>
          </Link>

          {/* Десктопное меню */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link relative transition-colors group ${isActive ? "text-[var(--accent-purple)] active" : "text-white/80 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Соцсети + Twitch-виджет + мобильное меню */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-3 text-white/70">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-purple"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
            {/* Twitch-виджет в шапке (скрыт на мобильных) */}
            <div className="hidden sm:block">
              <TwitchHeaderWidget />
            </div>
            <button
              className="md:hidden text-white text-2xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-white/10 bg-bg-dark/95 animate-slide-down"
            onClick={(e) => {
              // Закрываем при клике на фон (не на ссылки)
              if (e.target === e.currentTarget) {
                setMobileMenuOpen(false);
              }
            }}
          >
            <nav className="flex flex-col px-4 py-3 gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-[var(--accent-pink)]/20 text-[var(--accent-pink)] active" : "text-white/80 hover:bg-white/5"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex gap-4 pt-2 border-t border-white/10 mt-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-accent-purple"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main
        id="main-content"
        className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full"
      >
        <Outlet />
      </main>

      <footer className="bg-bg-dark/60 border-t border-accent-purple/20 py-6 text-center text-white/50">
        <img
          src={MASCOTS.hero.src}
          alt={MASCOTS.hero.alt}
          className="w-16 h-16 mx-auto mb-2 opacity-80 hover:opacity-100 transition-opacity"
        />
        <p>© {new Date().getFullYear()} Tiankami. Все права защищены.</p>
      </footer>
      <FxPanel />
    </div>
  );
};

export default Layout;
