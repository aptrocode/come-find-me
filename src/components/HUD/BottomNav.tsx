import { useGameStore } from '../../store/useGameStore'
import type { GameScreen } from '../../types'
import './BottomNav.css'

const tabs: { id: GameScreen; icon: string; label: string }[] = [
  { id: 'map', icon: '🗺️', label: 'Map' },
  { id: 'inventory', icon: '🎒', label: 'Collection' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav() {
  const { activeScreen, setActiveScreen } = useGameStore()

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeScreen === tab.id ? 'active' : ''}`}
          onClick={() => setActiveScreen(tab.id)}
          aria-label={tab.label}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
