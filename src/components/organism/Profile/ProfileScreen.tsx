import { useGameStore } from '../../../store/useGameStore'
import { Icon } from '@iconify/react'

export default function ProfileScreen() {
  const player = useGameStore(s => s.player)
  const uniqueCount = new Set(player.inventory.map(c => c.creature.id)).size

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="profile-avatar-lg">
          <img src="/images/profile.png" alt="Profile" className="profile-avatar-lg-img" />
        </div>
        <h1 className="profile-name">{player.name}</h1>
        <div className="profile-level-badge">Level {player.level}</div>
      </div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card caught">
          <div className="psc-icon-wrapper">
            <Icon icon="ph:paw-print-duotone" />
          </div>
          <span className="psc-value">{player.totalCaught}</span>
          <span className="psc-label">Caught</span>
        </div>
        <div className="profile-stat-card seen">
          <div className="psc-icon-wrapper">
            <Icon icon="ph:eye-duotone" />
          </div>
          <span className="psc-value">{player.totalSeen}</span>
          <span className="psc-label">Seen</span>
        </div>
        <div className="profile-stat-card unique">
          <div className="psc-icon-wrapper">
            <Icon icon="ph:shooting-star-duotone" />
          </div>
          <span className="psc-value">{uniqueCount}</span>
          <span className="psc-label">Unique</span>
        </div>
        <div className="profile-stat-card xp">
          <div className="psc-icon-wrapper">
            <Icon icon="ph:lightning-duotone" />
          </div>
          <span className="psc-value">{player.xp}</span>
          <span className="psc-label">Total XP</span>
        </div>
      </div>
    </div>
  )
}
