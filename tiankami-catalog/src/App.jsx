import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import CollectionsPage from './pages/CollectionsPage'
import SchedulePage from './pages/SchedulePage'
import AboutPage from './pages/AboutPage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:slug" element={<GamePage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}

export default App