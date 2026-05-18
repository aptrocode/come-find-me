import { useState, useEffect } from 'react'
import { useGameStore } from '../../../store/useGameStore'
import { useAuthStore } from '../../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

export default function ProfileScreen() {
  const player = useGameStore(s => s.player)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const uniqueCount = new Set(player.inventory.map(c => c.creature.id)).size

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('fsm_theme') as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
    localStorage.setItem('fsm_theme', theme)
  }, [theme])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="profile-avatar-lg">
          <img src="/images/profile.png" alt="Profile" className="profile-avatar-lg-img" />
        </div>
        <h1 className="profile-name">{player.name}</h1>
        {user?.email && (
          <p className="profile-email">{user.email}</p>
        )}
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

      {/* Theme Toggle Button */}
      <button className="profile-theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <Icon icon={theme === 'dark' ? 'ph:sun-dim-duotone' : 'ph:moon-stars-duotone'} />
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* Logout Button */}
      <button className="profile-logout-btn" onClick={handleLogout}>
        <Icon icon="ph:power-duotone" />
        <span>Logout</span>
      </button>
    </div>
  )
}
