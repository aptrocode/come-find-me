import { useGameStore } from '../../../store/useGameStore'
import { Icon } from '@iconify/react'
import './TopBar.css'

export default function TopBar() {
  const { player, isHudHidden, setActiveScreen } = useGameStore()
  const { name, level, xp, xpToNext, totalCaught } = player
  const xpPercent = Math.round((xp / xpToNext) * 100)

  return (
    <div className={`top-bar ${isHudHidden ? 'hud-hidden' : ''}`}>
      <div className="top-bar-left">
        <div className="player-avatar" onClick={() => setActiveScreen('profile')}>
          <img src="/images/profile.png" alt="Profile" className="player-avatar-img" />
        </div>
        <div className="player-info" onClick={() => setActiveScreen('profile')} style={{ cursor: 'pointer' }}>
          <span className="player-name">{name}</span>
          <span className="player-level">Lv. {level}</span>
        </div>
      </div>
      <div className="top-bar-center">
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
          <span className="xp-bar-text">{xp} / {xpToNext} XP</span>
        </div>
      </div>
      <div className="top-bar-right">
        <div className="catch-count">
          <Icon icon="ph:target-duotone" className="catch-icon" />
          <span className="catch-num">{totalCaught}</span>
        </div>
      </div>
    </div>
  )
}
