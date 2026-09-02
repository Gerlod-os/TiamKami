import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  FaTwitch,
  FaYoutube,
  FaDiscord,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const socialLinks = [
  {
    href: "https://twitch.tv/tiankami",
    icon: <FaTwitch size={20} />,
    label: "Twitch",
  },
  {
    href: "https://youtube.com/@tiankami",
    icon: <FaYoutube size={20} />,
    label: "YouTube",
  },
  {
    href: "https://discord.gg/tiankami",
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
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🎮
            </span>
            <span className="font-heading text-xl text-accent-pink">
              Tiankami
            </span>
          </Link>

          {/* Десктопное меню */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-accent-pink ${isActive ? "text-accent-pink" : "text-white/80"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Соцсети + мобильное меню */}
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
          <div className="md:hidden border-t border-white/10 bg-bg-dark/95">
            <nav className="flex flex-col px-4 py-3 gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg transition-colors ${isActive ? "bg-accent-pink/20 text-accent-pink" : "text-white/80 hover:bg-white/5"}`
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

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-bg-dark/60 border-t border-accent-purple/20 py-6 text-center text-white/50">
        <p>© 2025 Tiankami. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default Layout;
