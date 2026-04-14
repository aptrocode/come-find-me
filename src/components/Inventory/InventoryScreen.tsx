import { useGameStore } from '../../store/useGameStore'
import { Icon } from '@iconify/react'
import './InventoryScreen.css'

export default function InventoryScreen() {
  const { inventory, totalCaught } = useGameStore(s => s.player)
  const uniqueCount = new Set(inventory.map(c => c.creature.id)).size

  return (
    <div className="inventory-screen">
      <div className="inventory-header">
        <h1 className="inventory-title">Collection</h1>
        <div className="inventory-stats">
          <span className="stat">{totalCaught} caught</span>
          <span className="stat-sep">•</span>
          <span className="stat">{uniqueCount} unique</span>
        </div>
      </div>

      {inventory.length === 0 ? (
        <div className="inventory-empty">
          <Icon icon="ph:bag-simple-duotone" className="empty-icon-glyph" />
          <p className="empty-text">No creatures yet!</p>
          <p className="empty-sub">Explore the map and catch some.</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {[...inventory].reverse().map((entry) => (
            <div key={entry.id} className={`inv-card rarity-card-${entry.creature.rarity}`}>
              <div className="inv-card-emoji" style={{ filter: `drop-shadow(0 2px 8px ${entry.creature.color}40)` }}>
                {entry.creature.emoji}
              </div>
              <div className="inv-card-info">
                <span className="inv-card-name">{entry.creature.name}</span>
                <span className="inv-card-cp">CP {entry.cp}</span>
              </div>
              <div className={`inv-card-rarity rarity-dot-${entry.creature.rarity}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
