import { useEffect, lazy, Suspense } from 'react'
import GameMap from '../components/organism/Map/GameMap'
import TopBar from '../components/molecules/HUD/TopBar'
import BottomNav from '../components/molecules/HUD/BottomNav'
import FullscreenButton from '../components/atoms/FullscreenButton'
import EncounterScreen from '../components/organism/Encounter/EncounterScreen'
import DebugOverlay from '../components/molecules/Debug/DebugOverlay'
import ProfileScreen from '../components/organism/Profile/ProfileScreen'
import { useGameStore } from '../store/useGameStore'
import { useAdminStore } from '../store/useAdminStore'
import { useAuthStore } from '../store/useAuthStore.ts'
import './home.css'

const InventoryScreen = lazy(() => import('../components/organism/Inventory/InventoryScreen'))

export default function HomePage() {
  const { activeScreen, activeEncounter, loadSave } = useGameStore()
  const loadAdminConfig = useAdminStore(s => s.loadAdminConfig)
  const authUser = useAuthStore(s => s.user)

  useEffect(() => {
    loadSave()
    loadAdminConfig()
    document.title = 'First See Mie'
    const interval = setInterval(loadAdminConfig, 10000)
    return () => clearInterval(interval)
  }, [loadSave, loadAdminConfig])

  // Sync auth user name into game state
  useEffect(() => {
    if (authUser?.name) {
      useGameStore.setState(s => ({ player: { ...s.player, name: authUser.name } }))
    }
  }, [authUser])

  return (
    <div className="home-page">
      {/* Map always rendered underneath */}
      <GameMap />

      {/* HUD Overlay */}
      <TopBar />
      <BottomNav />

      {/* Utilities - Only show on Map tab */}
      {activeScreen === 'map' && !activeEncounter && (
        <div style={{ position: 'fixed', top: '7%', right: '10px', zIndex: 1000 }}>
          <FullscreenButton />
        </div>
      )}

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
