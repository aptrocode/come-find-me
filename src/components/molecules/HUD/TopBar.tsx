import { useGameStore } from '../../../store/useGameStore'
import { Icon } from '@iconify/react'
import './TopBar.css'

export default function TopBar() {
  const { player, activeScreen, setActiveScreen, isHudHidden } = useGameStore()
  const { level, xp, xpToNext } = player
  const xpPercent = Math.round((xp / xpToNext) * 100)

  if (isHudHidden) return null

  const handleCollectionClick = () => {
    if (activeScreen === 'inventory') {
      setActiveScreen('map')
    } else {
      setActiveScreen('inventory')
    }
  }

  return (
    <div className="top-hud-container">
      {/* 1. Centered Floating Level & XP Capsule */}
      <div className="floating-xp-container">
        <div className="floating-level-badge">Lv. {level}</div>
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
          <span className="xp-bar-text">{xp} / {xpToNext} XP</span>
        </div>
      </div>

      {/* 2. Top-Right Stacked Circular Floating Actions (Bag Only) */}
      {activeScreen === 'map' && (
        <div className="top-right-actions">
          <button 
            className="floating-action-btn bag-btn" 
            onClick={handleCollectionClick}
            aria-label="Collection"
          >
            <Icon icon="ph:bag-simple-bold" style={{ fontSize: '24px' }} />
          </button>
        </div>
      )}
    </div>
  )
}
