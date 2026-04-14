import { useEffect, lazy, Suspense } from 'react'
import { Icon } from '@iconify/react'
import GameMap from './components/Map/GameMap'
import TopBar from './components/HUD/TopBar'
import BottomNav from './components/HUD/BottomNav'
import EncounterScreen from './components/Encounter/EncounterScreen'
import DebugOverlay from './components/Debug/DebugOverlay'
import { useGameStore } from './store/useGameStore'
import { useAdminStore } from './store/useAdminStore'
import './App.css'

const InventoryScreen = lazy(() => import('./components/Inventory/InventoryScreen'))

function App() {
  const { activeScreen, activeEncounter, loadSave } = useGameStore()
  const loadAdminConfig = useAdminStore(s => s.loadAdminConfig)

  useEffect(() => {
    loadSave()
    loadAdminConfig()
    const interval = setInterval(loadAdminConfig, 10000)
    return () => clearInterval(interval)
  }, [loadSave, loadAdminConfig])

  return (
    <div className="app">
      {/* Map always rendered underneath */}
      <GameMap />

      {/* HUD Overlay */}
      <TopBar />
      <BottomNav />

      {/* Debug Info Overlay */}
      <DebugOverlay />

      {/* Screens */}
      {activeScreen === 'inventory' && (
        <Suspense fallback={null}>
          <InventoryScreen />
        </Suspense>
      )}

      {activeScreen === 'profile' && (
        <ProfileScreen />
      )}

      {/* Encounter overlay (highest z-index) */}
      {activeEncounter && <EncounterScreen />}
    </div>
  )
}

function ProfileScreen() {
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

export default App
