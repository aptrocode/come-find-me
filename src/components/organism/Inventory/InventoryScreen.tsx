import { useState } from 'react'
import { useGameStore } from '../../../store/useGameStore'
import { useAdminStore } from '../../../store/useAdminStore'
import { Icon } from '@iconify/react'
import type { CaughtCreature } from '../../../types'
import CreatureDetail from './CreatureDetail'
import './InventoryScreen.css'

export default function InventoryScreen() {
  const { inventory, totalCaught } = useGameStore(s => s.player)
  const { creatures } = useAdminStore()
  const uniqueCount = new Set(inventory.map(c => c.creature.id)).size
  const [selectedCreature, setSelectedCreature] = useState<CaughtCreature | null>(null)

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
          {[...inventory].reverse().map((entry) => {
            const current = creatures.find(c => c.id === entry.creature.id) || entry.creature
            
            return (
              <div
                key={entry.id}
                className={`inv-card rarity-card-${current.rarity}`}
                onClick={() => setSelectedCreature(entry)}
              >
                <div className="inv-card-emoji" style={{ filter: `drop-shadow(0 2px 8px ${current.color}40)` }}>
                  {current.emoji}
                </div>
                <div className="inv-card-info">
                  <span className="inv-card-name">{current.name}</span>
                  <span className="inv-card-cp">CP {entry.cp}</span>
                </div>
                <div className={`inv-card-rarity rarity-dot-${current.rarity}`} />
              </div>
            )
          })}
        </div>
      )}

      {/* Creature Detail Overlay */}
      {selectedCreature && (
        <CreatureDetail
          entry={selectedCreature}
          onClose={() => setSelectedCreature(null)}
        />
      )}
    </div>
  )
}
