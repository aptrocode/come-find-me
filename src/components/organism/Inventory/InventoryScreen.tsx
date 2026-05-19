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
  const { isHudHidden, setHudHidden } = useGameStore()
  const uniqueCount = new Set(inventory.map(c => c.creature.id)).size
  const [selectedCreature, setSelectedCreature] = useState<CaughtCreature | null>(null)

  const handleSelect = (creature: CaughtCreature) => {
    setSelectedCreature(creature)
    setHudHidden(true)
  }

  const handleClose = () => {
    setSelectedCreature(null)
    setHudHidden(false)
  }

  return (
    <div className={`inventory-screen ${isHudHidden ? 'hud-hidden' : ''}`}>
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
                onClick={() => handleSelect(entry)}
              >
                <div className="inv-card-emoji" style={{ filter: `drop-shadow(0 2px 8px ${current.color}40)` }}>
                  {current.emoji.startsWith('/') || current.emoji.startsWith('http') || current.emoji.includes('.') ? (
                    <img src={current.emoji} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${current.iconScale ?? 1.0})` }} />
                  ) : (
                    <span style={{ display: 'inline-block', transform: `scale(${current.iconScale ?? 1.0})` }}>{current.emoji}</span>
                  )}
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
          onClose={handleClose}
        />
      )}
    </div>
  )
}
