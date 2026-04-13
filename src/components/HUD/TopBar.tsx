import { useGameStore } from '../../store/useGameStore'
import './TopBar.css'

export default function TopBar() {
  const { name, level, xp, xpToNext, totalCaught } = useGameStore(s => s.player)
  const xpPercent = Math.round((xp / xpToNext) * 100)

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="player-avatar">👤</div>
        <div className="player-info">
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
          <span className="catch-icon">🎯</span>
          <span className="catch-num">{totalCaught}</span>
        </div>
      </div>
    </div>
  )
}
