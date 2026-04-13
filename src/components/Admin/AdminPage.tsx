import { useEffect, useState, useCallback, useRef } from 'react'
import { useAdminStore } from '../../store/useAdminStore'
import type { Creature, CreatureType, Rarity } from '../../types'
import './AdminPage.css'

type AdminTab = 'creatures' | 'spawn' | 'rarity' | 'catch'

const CREATURE_TYPES: CreatureType[] = ['fire', 'water', 'grass', 'electric', 'dark', 'normal']
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary']

const TYPE_EMOJIS: Record<CreatureType, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑', normal: '⭐'
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aaa', uncommon: '#4ECDC4', rare: '#FFD700', legendary: '#FF6B35'
}

function uid() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Creature Editor Modal ─────────────────────────────────────────
interface CreatureEditorProps {
  creature: Creature | null // null = new creature
  onSave: (creature: Creature) => void
  onClose: () => void
}

function CreatureEditor({ creature, onSave, onClose }: CreatureEditorProps) {
  const isNew = !creature
  const [form, setForm] = useState<Creature>(creature ?? {
    id: uid(),
    name: '',
    type: 'normal',
    rarity: 'common',
    emoji: '❓',
    baseCatchRate: 0.5,
    baseCP: 100,
    description: '',
    color: '#4ECDC4',
    modelUrl: '',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = <K extends keyof Creature>(key: K, value: Creature[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleModelUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, we store the file name and copy it to public/models
    // In production, you'd upload to a server. For local dev, we use object URLs
    const objectUrl = URL.createObjectURL(file)
    updateField('modelUrl', objectUrl)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNew ? '✨ New Creature' : `✏️ Edit ${creature?.name}`}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="creature-form">
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Creature name..."
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Emoji</label>
              <input
                type="text"
                value={form.emoji}
                onChange={e => updateField('emoji', e.target.value)}
                maxLength={4}
                className="emoji-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Type</label>
              <select value={form.type} onChange={e => updateField('type', e.target.value as CreatureType)}>
                {CREATURE_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_EMOJIS[t]} {t}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label>Rarity</label>
              <select value={form.rarity} onChange={e => updateField('rarity', e.target.value as Rarity)}>
                {RARITIES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Base CP</label>
              <input
                type="number"
                value={form.baseCP}
                onChange={e => updateField('baseCP', Number(e.target.value))}
                min={10}
                max={9999}
              />
            </div>
            <div className="form-group flex-1">
              <label>Catch Rate</label>
              <input
                type="number"
                value={form.baseCatchRate}
                onChange={e => updateField('baseCatchRate', Number(e.target.value))}
                min={0.01}
                max={1}
                step={0.01}
              />
            </div>
            <div className="form-group flex-1">
              <label>Color</label>
              <input
                type="color"
                value={form.color}
                onChange={e => updateField('color', e.target.value)}
                className="color-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="A brief description..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>3D Model (GLB)</label>
            <div className="model-upload-row">
              <input
                type="text"
                value={form.modelUrl || ''}
                onChange={e => updateField('modelUrl', e.target.value)}
                placeholder="/models/creature.glb or upload..."
                className="model-url-input"
              />
              <button
                type="button"
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleModelUpload}
                style={{ display: 'none' }}
              />
            </div>
            {form.modelUrl && (
              <span className="model-status">✅ Model set</span>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {isNew ? '➕ Add Creature' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Page ────────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('creatures')
  const [editingCreature, setEditingCreature] = useState<Creature | null | 'new'>(null)

  const adminStore = useAdminStore()
  
  // Local state for the config form
  const [localSpawnConfig, setLocalSpawnConfig] = useState(adminStore.spawnConfig)
  const [localRarityWeights, setLocalRarityWeights] = useState(adminStore.rarityWeights)
  const [localCatchConfig, setLocalCatchConfig] = useState(adminStore.catchConfig)

  // Re-sync if store changes externally
  useEffect(() => {
    setLocalSpawnConfig(adminStore.spawnConfig)
    setLocalRarityWeights(adminStore.rarityWeights)
    setLocalCatchConfig(adminStore.catchConfig)
  }, [adminStore.spawnConfig, adminStore.rarityWeights, adminStore.catchConfig])

  const handleSaveCreature = useCallback((creature: Creature) => {
    if (editingCreature === 'new') {
      adminStore.addCreature(creature)
    } else {
      adminStore.updateCreature(creature.id, creature)
    }
    setEditingCreature(null)
  }, [editingCreature, adminStore])

  const handleDeleteCreature = useCallback((id: string) => {
    if (confirm('Delete this creature?')) {
      adminStore.deleteCreature(id)
    }
  }, [adminStore])

  const handleReset = useCallback(() => {
    if (confirm('Reset ALL settings to defaults? This will undo all your changes.')) {
      adminStore.resetToDefaults()
    }
  }, [adminStore])

  const handleApplyChanges = useCallback(() => {
    adminStore.setSpawnConfig(localSpawnConfig)
    adminStore.setRarityWeights(localRarityWeights)
    adminStore.setCatchConfig(localCatchConfig)
    alert('Changes applied & saved successfully!')
  }, [adminStore, localSpawnConfig, localRarityWeights, localCatchConfig])

  const tabs: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'creatures', icon: '🐾', label: 'Creatures' },
    { id: 'spawn', icon: '⚙️', label: 'Spawn' },
    { id: 'rarity', icon: '🎲', label: 'Rarity' },
    { id: 'catch', icon: '🎯', label: 'Catch' },
  ]


  return (
    <div className="admin-page">
      {/* Top Header */}
      <div className="admin-header">
        <a className="admin-back" href="/">← Play Game</a>
        <h1 className="admin-title">⚙️ Admin Panel</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-reset" onClick={handleReset} style={{ background: '#e74c3c' }}>🔄 Reset</button>
          <button className="admin-apply btn-primary" onClick={handleApplyChanges}>💾 Save & Apply</button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            <span className="admin-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">

        {/* ── Creatures Tab ──────────────────────── */}
        {activeTab === 'creatures' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Creature Registry</h2>
              <button className="btn-add" onClick={() => setEditingCreature('new')}>
                ✨ Add New
              </button>
            </div>

            <div className="creature-list">
              {adminStore.creatures.map(c => (
                <div key={c.id} className="creature-card" style={{ '--accent': c.color } as React.CSSProperties}>
                  <div className="creature-card-left">
                    <div className="creature-card-emoji">{c.emoji}</div>
                    <div className="creature-card-info">
                      <span className="creature-card-name">{c.name}</span>
                      <div className="creature-card-meta">
                        <span className="creature-card-type">{TYPE_EMOJIS[c.type]} {c.type}</span>
                        <span
                          className="creature-card-rarity"
                          style={{ color: RARITY_COLORS[c.rarity] }}
                        >
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
                    <button className="card-btn edit" onClick={() => setEditingCreature(c)}>✏️</button>
                    <button className="card-btn delete" onClick={() => handleDeleteCreature(c.id)}>🗑️</button>
                  </div>
                </div>
              ))}

              {adminStore.creatures.length === 0 && (
                <div className="empty-state">
                  <span>🌀</span>
                  <p>No creatures yet. Add your first one!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Spawn Settings Tab ─────────────────── */}
        {activeTab === 'spawn' && (
          <div className="admin-section">
            <h2>Spawn Configuration</h2>

            <div className="settings-grid">
              <div className="setting-item">
                <label>Min Spawn Radius</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={5}
                      max={500}
                      value={localSpawnConfig.spawnRadiusMin}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, spawnRadiusMin: Number(e.target.value) })}
                    />
                    <span className="setting-value">{localSpawnConfig.spawnRadiusMin}m</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Max Spawn Radius</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={5}
                      max={1000}
                      value={localSpawnConfig.spawnRadiusMax}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, spawnRadiusMax: Number(e.target.value) })}
                    />
                    <span className="setting-value">{localSpawnConfig.spawnRadiusMax}m</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Max Active Spawns</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={localSpawnConfig.maxActiveSpawns}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, maxActiveSpawns: Number(e.target.value) })}
                    />
                    <span className="setting-value">{localSpawnConfig.maxActiveSpawns}</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Spawn Interval</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={2000}
                      max={60000}
                      step={1000}
                      value={localSpawnConfig.spawnInterval}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, spawnInterval: Number(e.target.value) })}
                    />
                    <span className="setting-value">{(localSpawnConfig.spawnInterval / 1000).toFixed(0)}s</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Spawn Lifetime</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={30000}
                      max={1800000}
                      step={30000}
                      value={localSpawnConfig.spawnLifetime}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, spawnLifetime: Number(e.target.value) })}
                    />
                    <span className="setting-value">{(localSpawnConfig.spawnLifetime / 60000).toFixed(1)}min</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Encounter Range</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={5}
                      max={200}
                      value={localSpawnConfig.encounterRange}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, encounterRange: Number(e.target.value) })}
                    />
                    <span className="setting-value">{localSpawnConfig.encounterRange}m</span>
                </div>
              </div>

              <div className="setting-item">
                <label>Despawn Range</label>
                <div className="setting-control">
                    <input
                      type="range"
                      min={10}
                      max={500}
                      value={localSpawnConfig.despawnRange}
                      onChange={e => setLocalSpawnConfig({ ...localSpawnConfig, despawnRange: Number(e.target.value) })}
                    />
                    <span className="setting-value">{localSpawnConfig.despawnRange}m</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rarity Weights Tab ─────────────────── */}
        {activeTab === 'rarity' && (
          <div className="admin-section">
            <h2>Rarity Spawn Weights</h2>
            <p className="section-desc">Adjust the probability of each rarity tier spawning.</p>

            <div className="rarity-weights-container">
              {RARITIES.map(rarity => {
                const weight = localRarityWeights[rarity]
                const totalWeight = Object.values(localRarityWeights).reduce((a, b) => a + b, 0)
                const pct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0
                return (
                  <div key={rarity} className="rarity-weight-item">
                    <div className="rarity-weight-header">
                      <span className="rarity-weight-label" style={{ color: RARITY_COLORS[rarity] }}>
                        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                      </span>
                      <span className="rarity-weight-pct">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="rarity-weight-control">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={weight}
                          onChange={e => setLocalRarityWeights({ ...localRarityWeights, [rarity]: Number(e.target.value) })}
                          style={{ '--track-color': RARITY_COLORS[rarity] } as React.CSSProperties}
                        />
                      <span className="rarity-weight-val">{weight}</span>
                    </div>
                    <div className="rarity-weight-bar">
                      <div
                        className="rarity-weight-fill"
                        style={{
                          width: `${pct}%`,
                          background: RARITY_COLORS[rarity],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Catch Settings Tab ─────────────────── */}
        {activeTab === 'catch' && (
          <div className="admin-section">
            <h2>Catch Mechanics</h2>

            <div className="settings-grid">
              <div className="setting-item">
                <label>Flee Threshold</label>
                <p className="setting-desc">If random roll &gt; this value, creature flees.</p>
                <div className="setting-control">
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={localCatchConfig.catchFleeThreshold}
                      onChange={e => setLocalCatchConfig({ ...localCatchConfig, catchFleeThreshold: Number(e.target.value) })}
                    />
                    <span className="setting-value">{(localCatchConfig.catchFleeThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="setting-item">
                <label>CP Variance</label>
                <p className="setting-desc">±% range from base CP when spawning.</p>
                <div className="setting-control">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={localCatchConfig.cpVariance}
                      onChange={e => setLocalCatchConfig({ ...localCatchConfig, cpVariance: Number(e.target.value) })}
                    />
                    <span className="setting-value">±{(localCatchConfig.cpVariance * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="setting-item">
                <label>XP per Catch</label>
                <div className="setting-control">
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={localCatchConfig.xpPerCatch}
                      onChange={e => setLocalCatchConfig({ ...localCatchConfig, xpPerCatch: Number(e.target.value) })}
                      className="num-input"
                    />
                </div>
              </div>

              <div className="setting-item">
                <label>XP per Flee</label>
                <div className="setting-control">
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={localCatchConfig.xpPerFlee}
                      onChange={e => setLocalCatchConfig({ ...localCatchConfig, xpPerFlee: Number(e.target.value) })}
                      className="num-input"
                    />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Creature Editor Modal */}
      {editingCreature !== null && (
        <CreatureEditor
          creature={editingCreature === 'new' ? null : editingCreature}
          onSave={handleSaveCreature}
          onClose={() => setEditingCreature(null)}
        />
      )}
    </div>
  )
}
