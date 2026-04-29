import React from 'react'
import { Icon } from '@iconify/react'
import type { Creature, CreatureType, Rarity } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'
import './AdminCreatureRegistry.css'

interface AdminCreatureRegistryProps {
  creatures: Creature[]
  onEdit: (creature: Creature) => void
  onDelete: (id: string) => void
  onReset: () => void
  onAddNew: () => void
  logMode: {
    checked: boolean
    onChange: (val: boolean) => void
  }
}

const TYPE_EMOJIS: Record<CreatureType, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑', normal: '⭐'
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aaa', uncommon: '#4ECDC4', rare: '#FFD700', legendary: '#FF6B35'
}

export default function AdminCreatureRegistry({
  creatures,
  onEdit,
  onDelete,
  onReset,
  onAddNew,
  logMode
}: AdminCreatureRegistryProps) {
  return (
    <AdminSectionCard
      title="Creature Registry"
      badgeCount={creatures.length}
      logMode={logMode}
      onReset={onReset}
      resetLabel="Reset Registry"
      actions={
        <button className="btn-add btn-sm" onClick={onAddNew}>
          <Icon icon="ph:plus-bold" />
          Add New
        </button>
      }
    >
      <div className="creature-list">
        {creatures.map(c => (
          <div key={c.id} className="creature-card" style={{ '--accent': c.color } as React.CSSProperties}>
            <div className="creature-card-left">
              <div className="creature-card-emoji">{c.emoji}</div>
              <div className="creature-card-info">
                <span className="creature-card-name">{c.name}</span>
                <div className="creature-card-meta">
                  <span className="creature-card-type">{TYPE_EMOJIS[c.type as CreatureType]} {c.type}</span>
                  <span className="creature-card-rarity" style={{ color: RARITY_COLORS[c.rarity as Rarity] }}>
                    {c.rarity}
                  </span>
                </div>
              </div>
            </div>
            <div className="creature-card-stats">
              <span className="stat-badge">CP {c.baseCP}</span>
              <span className="stat-badge">{Math.round(c.baseCatchRate * 100)}%</span>
            </div>
            <div className="creature-card-actions">
              <button className="card-btn edit" onClick={() => onEdit(c)}>
                <Icon icon="ph:pencil-duotone" />
              </button>
              <button className="card-btn delete" onClick={() => onDelete(c.id)}>
                <Icon icon="ph:trash-duotone" />
              </button>
            </div>
          </div>
        ))}

        {creatures.length === 0 && (
          <div className="empty-state">
            <Icon icon="ph:wind-duotone" className="empty-icon" />
            <p>No creatures yet. Add your first one!</p>
          </div>
        )}
      </div>
    </AdminSectionCard>
  )
}
