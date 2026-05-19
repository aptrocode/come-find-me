import { useGameStore } from '../../../store/useGameStore'
import { Icon } from '@iconify/react'
import FullscreenButton from '../../atoms/FullscreenButton'
import './BottomNav.css'

export default function BottomNav() {
  const { activeScreen, setActiveScreen, player, isHudHidden } = useGameStore()
  const { name, level } = player

  if (isHudHidden) return null

  return (
    <div className="bottom-hud-container">
      {/* 1. Bottom-Left Circular Profile Trigger */}
      {activeScreen === 'map' && (
        <div 
          className="floating-profile-trigger"
          onClick={() => setActiveScreen('profile')}
          role="button"
          tabIndex={0}
        >
          <div className="avatar-circle">
            <img src="/images/profile.png" alt="Profile" className="avatar-img" />
          </div>
          <div className="profile-pill">
            <span className="profile-pill-name">{name}</span>
            <span className="profile-pill-level">Lv. {level}</span>
          </div>
        </div>
      )}

      {/* 2. Bottom-Right Floating Fullscreen Button (directly under map recenter) */}
      {activeScreen === 'map' && (
        <div className="floating-fullscreen-container">
          <FullscreenButton />
        </div>
      )}

      {/* 3. Bottom-Center Circular 'X' Close Button */}
      {activeScreen !== 'map' && (
        <button 
          className="floating-close-btn"
          onClick={() => setActiveScreen('map')}
          aria-label="Close Screen"
        >
          <Icon icon="ph:x-bold" style={{ fontSize: '20px' }} />
        </button>
      )}
    </div>
  )
}
