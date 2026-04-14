import { useGameStore } from '../../store/useGameStore'
import { Icon } from '@iconify/react'
import type { GameScreen } from '../../types'
import './BottomNav.css'

const tabs: { id: GameScreen; icon: string; label: string }[] = [
  { id: 'map', icon: 'ph:map-trifold-duotone', label: 'Map' },
  { id: 'inventory', icon: 'ph:bag-simple-duotone', label: 'Collection' },
  { id: 'profile', icon: 'ph:user-circle-duotone', label: 'Profile' },
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
          <Icon icon={tab.icon} className="nav-icon" />
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
