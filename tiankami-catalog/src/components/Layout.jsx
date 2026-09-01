import { Link, NavLink, Outlet } from 'react-router-dom'
import { FaTwitch, FaYoutube, FaDiscord } from 'react-icons/fa'

const Layout = () => {
  const navItems = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/collections', label: 'Подборки' },
    { to: '/schedule', label: 'Расписание' },
    { to: '/about', label: 'О канале' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-bg-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-accent-purple/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="font-heading text-xl text-accent-pink glow-pink">Tiankami</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-accent-pink ${isActive ? 'text-accent-pink' : 'text-white/80'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex gap-3 text-white/70">
            <a href="#" className="hover:text-accent-purple"><FaTwitch size={20} /></a>
            <a href="#" className="hover:text-accent-purple"><FaYoutube size={20} /></a>
            <a href="#" className="hover:text-accent-purple"><FaDiscord size={20} /></a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-bg-dark/60 border-t border-accent-purple/20 py-6 text-center text-white/50">
        <p>© 2025 Tiankami. Все права защищены.</p>
      </footer>
    </div>
  )
}

export default Layout