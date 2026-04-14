import { useAdminStore } from '../../store/useAdminStore'
import './DebugOverlay.css'

export default function DebugOverlay() {
  const { debugSettings, spawnConfig, rarityWeights, catchConfig, encounterPhysics, creatures } = useAdminStore()

  const activeSections = Object.entries(debugSettings)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key)

  if (activeSections.length === 0) return null

  return (
    <div className="debug-overlay">
      <div className="debug-header">🛠️ DEBUG MODE ACTIVE</div>
      <div className="debug-content">
        {debugSettings.spawn && (
          <div className="debug-item">
            <div className="debug-item-title">Spawn Config</div>
            <pre>{JSON.stringify(spawnConfig, null, 2)}</pre>
          </div>
        )}
        {debugSettings.rarity && (
          <div className="debug-item">
            <div className="debug-item-title">Rarity Weights</div>
            <pre>{JSON.stringify(rarityWeights, null, 2)}</pre>
          </div>
        )}
        {debugSettings.catch && (
          <div className="debug-item">
            <div className="debug-item-title">Catch Mechanics</div>
            <pre>{JSON.stringify(catchConfig, null, 2)}</pre>
          </div>
        )}
        {debugSettings.physics && (
          <div className="debug-item">
            <div className="debug-item-title">Ball Physics</div>
            <pre>{JSON.stringify(encounterPhysics, null, 2)}</pre>
          </div>
        )}
        {debugSettings.creatures && (
          <div className="debug-item">
            <div className="debug-item-title">Creature Count</div>
            <pre>{creatures.length} creatures registered</pre>
          </div>
        )}
      </div>
    </div>
  )
}
