import { Icon } from '@iconify/react'
import { useGameStore } from '../../../store/useGameStore'

export default function ProfileScreen() {
  const player = useGameStore(s => s.player)
  const uniqueCount = new Set(player.inventory.map(c => c.creature.id)).size

  return (
    <div className="profile-screen">
      <div className="profile-avatar-lg">
        <Icon icon="ph:user-circle-duotone" />
      </div>
      <h1 className="profile-name">{player.name}</h1>
      <div className="profile-level-badge">Level {player.level}</div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="psc-value">{player.totalCaught}</span>
          <span className="psc-label">Caught</span>
        </div>
        <div className="profile-stat-card">
          <span className="psc-value">{player.totalSeen}</span>
          <span className="psc-label">Seen</span>
        </div>
        <div className="profile-stat-card">
          <span className="psc-value">{uniqueCount}</span>
          <span className="psc-label">Unique</span>
        </div>
        <div className="profile-stat-card">
          <span className="psc-value">{player.xp}</span>
          <span className="psc-label">Total XP</span>
        </div>
      </div>
    </div>
  )
}
