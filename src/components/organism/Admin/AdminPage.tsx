import { useState, useCallback, useRef } from 'react'
import { Icon } from '@iconify/react'
import { useAdminStore } from '../../../store/useAdminStore'
import type { Creature, CreatureType, Rarity } from '../../../types'
import './AdminPage.css'

type AdminTab = 'creatures' | 'spawn' | 'rarity' | 'catch' | 'physics'

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
          <h3>
            <Icon icon={isNew ? "ph:sparkle-duotone" : "ph:pencil-duotone"} className="modal-header-icon" />
            {isNew ? 'New Creature' : `Edit ${creature?.name}`}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <Icon icon="ph:x-bold" />
          </button>
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
              <Icon icon={isNew ? "ph:plus-bold" : "ph:floppy-disk-back-duotone"} />
              {isNew ? 'Add Creature' : 'Save Changes'}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const adminStore = useAdminStore()
  
  // Local state for the config form
  const [localSpawnConfig, setLocalSpawnConfig] = useState(adminStore.spawnConfig)
  const [localRarityWeights, setLocalRarityWeights] = useState(adminStore.rarityWeights)
  const [localCatchConfig, setLocalCatchConfig] = useState(adminStore.catchConfig)
  const [localEncounterPhysics, setLocalEncounterPhysics] = useState(adminStore.encounterPhysics)
  const [localDebugSettings, setLocalDebugSettings] = useState(adminStore.debugSettings)

  // Re-sync if store changes externally (avoiding useEffect for synchronous setState)
  const [prevSyncData, setPrevSyncData] = useState({
    spawn: adminStore.spawnConfig,
    rarity: adminStore.rarityWeights,
    catch: adminStore.catchConfig,
    physics: adminStore.encounterPhysics,
    debug: adminStore.debugSettings
  })

  if (
    adminStore.spawnConfig !== prevSyncData.spawn ||
    adminStore.rarityWeights !== prevSyncData.rarity ||
    adminStore.catchConfig !== prevSyncData.catch ||
    adminStore.encounterPhysics !== prevSyncData.physics ||
    adminStore.debugSettings !== prevSyncData.debug
  ) {
    setPrevSyncData({
      spawn: adminStore.spawnConfig,
      rarity: adminStore.rarityWeights,
      catch: adminStore.catchConfig,
      physics: adminStore.encounterPhysics,
      debug: adminStore.debugSettings
    })
    setLocalSpawnConfig(adminStore.spawnConfig)
    setLocalRarityWeights(adminStore.rarityWeights)
    setLocalCatchConfig(adminStore.catchConfig)
    setLocalEncounterPhysics(adminStore.encounterPhysics)
    setLocalDebugSettings(adminStore.debugSettings)
  }

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
    if (confirm('Reset ALL settings to defaults (including all creatures)? This will undo all your changes.')) {
      adminStore.resetToDefaults()
    }
  }, [adminStore])

  const handleResetSection = useCallback((section: AdminTab) => {
    if (confirm(`Reset ${section} settings to defaults?`)) {
      switch (section) {
        case 'creatures': adminStore.resetCreatures(); break;
        case 'spawn': adminStore.resetSpawnConfig(); break;
        case 'rarity': adminStore.resetRarityWeights(); break;
        case 'catch': adminStore.resetCatchConfig(); break;
        case 'physics': adminStore.resetEncounterPhysics(); break;
      }
    }
  }, [adminStore])

  const handleApplyChanges = useCallback(() => {
    adminStore.setSpawnConfig(localSpawnConfig)
    adminStore.setRarityWeights(localRarityWeights)
    adminStore.setCatchConfig(localCatchConfig)
    adminStore.setEncounterPhysics(localEncounterPhysics)
    adminStore.setDebugSettings(localDebugSettings)
    alert('Changes applied & saved successfully!')
  }, [adminStore, localSpawnConfig, localRarityWeights, localCatchConfig, localEncounterPhysics, localDebugSettings])

  const tabs: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'creatures', icon: 'ph:paw-print-duotone', label: 'Creatures' },
    { id: 'spawn', icon: 'ph:map-pin-area-duotone', label: 'Spawn' },
    { id: 'rarity', icon: 'ph:dice-five-duotone', label: 'Rarity' },
    { id: 'catch', icon: 'ph:target-duotone', label: 'Catch' },
    { id: 'physics', icon: 'ph:atom-duotone', label: 'Physics' },
  ]


  return (
    <div className="admin-layout">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="admin-mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          <Icon icon="ph:list-bold" />
        </button>
        <h1 className="admin-mobile-title">Admin Panel</h1>
        <a className="admin-mobile-play" href="/">
          <Icon icon="ph:play-circle-duotone" />
        </a>
      </div>

      {/* Sidebar Overlay Backdrop (Mobile only) */}
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <Icon icon="ph:gear-duotone" className="sidebar-title-icon" />
            Config
          </h1>
          <a className="sidebar-back" href="/">
            <Icon icon="ph:arrow-left-bold" />
            <span>Play Game</span>
          </a>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id)
                setIsSidebarOpen(false)
              }}
            >
              <Icon icon={tab.icon} className="sidebar-link-icon" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-secondary sidebar-btn" onClick={handleReset}>
            <Icon icon="ph:arrows-counter-clockwise-bold" />
            Factory Reset
          </button>
          <button className="btn-primary sidebar-btn" onClick={handleApplyChanges}>
            <Icon icon="ph:floppy-disk-back-duotone" />
            Save Changes
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content-wrapper">

          {/* ── Creatures Tab ──────────────────────── */}
        {activeTab === 'creatures' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Creature Registry</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={localDebugSettings.creatures}
                    onChange={e => setLocalDebugSettings({ ...localDebugSettings, creatures: e.target.checked })}
                  />
                  <span className="debug-label">Log Mode</span>
                </label>
                <button className="btn-secondary btn-mini" onClick={() => handleResetSection('creatures')}>
                  <Icon icon="ph:arrows-counter-clockwise-bold" />
                  Reset Registry
                </button>
                <button className="btn-add btn-sm" onClick={() => setEditingCreature('new')}>
                  <Icon icon="ph:plus-bold" />
                  Add New
                </button>
              </div>
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
                    <button className="card-btn edit" onClick={() => setEditingCreature(c)}>
                      <Icon icon="ph:pencil-duotone" />
                    </button>
                    <button className="card-btn delete" onClick={() => handleDeleteCreature(c.id)}>
                      <Icon icon="ph:trash-duotone" />
                    </button>
                  </div>
                </div>
              ))}

              {adminStore.creatures.length === 0 && (
                <div className="empty-state">
                  <Icon icon="ph:wind-duotone" className="empty-icon" />
                  <p>No creatures yet. Add your first one!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Spawn Settings Tab ─────────────────── */}
        {activeTab === 'spawn' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Spawn Configuration</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={localDebugSettings.spawn}
                    onChange={e => setLocalDebugSettings({ ...localDebugSettings, spawn: e.target.checked })}
                  />
                  <span className="debug-label">Log Mode</span>
                </label>
                <button className="btn-secondary btn-mini" onClick={() => handleResetSection('spawn')}>
                  <Icon icon="ph:arrows-counter-clockwise-bold" />
                  Reset Defaults
                </button>
              </div>
            </div>

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
            <div className="section-header">
              <h2>Rarity Spawn Weights</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={localDebugSettings.rarity}
                    onChange={e => setLocalDebugSettings({ ...localDebugSettings, rarity: e.target.checked })}
                  />
                  <span className="debug-label">Log Mode</span>
                </label>
                <button className="btn-secondary btn-mini" onClick={() => handleResetSection('rarity')}>
                  <Icon icon="ph:arrows-counter-clockwise-bold" />
                  Reset Defaults
                </button>
              </div>
            </div>
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
                      <input
                        type="number"
                        className="setting-value-input"
                        value={weight}
                        onChange={e => setLocalRarityWeights({ ...localRarityWeights, [rarity]: Number(e.target.value) })}
                      />
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
            <div className="section-header">
              <h2>Catch Mechanics</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={localDebugSettings.catch}
                    onChange={e => setLocalDebugSettings({ ...localDebugSettings, catch: e.target.checked })}
                  />
                  <span className="debug-label">Log Mode</span>
                </label>
                <button className="btn-secondary btn-mini" onClick={() => handleResetSection('catch')}>
                  <Icon icon="ph:arrows-counter-clockwise-bold" />
                  Reset Defaults
                </button>
              </div>
            </div>

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

        {/* ── Encounter Physics Tab ──────────────── */}
        {activeTab === 'physics' && (
          <div className="admin-section">
            <div className="section-header">
              <h2>Ball Physics & Gestures</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="debug-toggle">
                  <input
                    type="checkbox"
                    checked={localDebugSettings.physics}
                    onChange={e => setLocalDebugSettings({ ...localDebugSettings, physics: e.target.checked })}
                  />
                  <span className="debug-label">Log Mode</span>
                </label>
                <button className="btn-secondary btn-mini" onClick={() => handleResetSection('physics')}>
                  <Icon icon="ph:arrows-counter-clockwise-bold" />
                  Reset Defaults
                </button>
              </div>
            </div>
            <p className="section-desc">Fine-tune the "feel" of throwing the capture ball.</p>

            <div className="settings-grid">
              <div className="setting-item">
                <label>Ambang Batas Lemparan (Throw Threshold)</label>
                <p className="setting-desc">Jarak geser minimum ke atas untuk memicu lemparan. Jika tarikan jari kurang dari ini, bola hanya akan memantul kembali ke posisi awal.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={-100}
                    max={-10}
                    value={localEncounterPhysics.throwThreshold}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, throwThreshold: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="setting-value-input"
                    value={localEncounterPhysics.throwThreshold}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, throwThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Sensitivitas Seret (Drag Sensitivity)</label>
                <p className="setting-desc">Mengatur seberapa responsif bola mengikuti gerakan jari saat diseret. Nilai lebih tinggi membuat bola terasa lebih "lengket" di jari.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0.001}
                    max={0.02}
                    step={0.001}
                    value={localEncounterPhysics.dragMultiplier}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, dragMultiplier: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.001}
                    className="setting-value-input"
                    value={localEncounterPhysics.dragMultiplier}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, dragMultiplier: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Kekuatan Lemparan (Throw Power)</label>
                <p className="setting-desc">Kecepatan meluncur bola ke arah target. Semakin tinggi nilainya, bola akan melesat lebih cepat dan menjangkau area yang lebih jauh.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0.005}
                    max={0.05}
                    step={0.001}
                    value={localEncounterPhysics.throwMultiplier}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, throwMultiplier: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.001}
                    className="setting-value-input"
                    value={localEncounterPhysics.throwMultiplier}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, throwMultiplier: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Massa Bola (Ball Mass)</label>
                <p className="setting-desc">Bobot bola dalam simulasi fisika. Bola yang lebih berat (nilai tinggi) akan terasa lebih lambat dan memerlukan tenaga lebih untuk dilempar.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0.1}
                    max={5}
                    step={0.1}
                    value={localEncounterPhysics.mass}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, mass: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className="setting-value-input"
                    value={localEncounterPhysics.mass}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, mass: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Tegangan Pegas (Spring Tension)</label>
                <p className="setting-desc">Mengatur kekakuan pegas saat bola kembali ke posisi awal. Semakin tinggi nilainya, bola akan kembali dengan lebih cepat dan reaktif.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={localEncounterPhysics.tension}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, tension: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="setting-value-input"
                    value={localEncounterPhysics.tension}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, tension: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Gesekan Pegas (Spring Friction)</label>
                <p className="setting-desc">Mengatur redaman pegas. Nilai tinggi akan menghentikan getaran bola lebih cepat saat kembali ke posisi awal tanpa terlalu banyak memantul.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={localEncounterPhysics.friction}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, friction: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="setting-value-input"
                    value={localEncounterPhysics.friction}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, friction: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Ambang Batas Meleset (Whiff Threshold)</label>
                <p className="setting-desc">Batas toleransi melenceng secara horizontal (kiri/kanan). Jika bola dilempar terlalu miring melewati batas ini, lemparan dianggap gagal total.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={localEncounterPhysics.whiffThreshold}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, whiffThreshold: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="setting-value-input"
                    value={localEncounterPhysics.whiffThreshold}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, whiffThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>

            </div>
            
            <hr className="section-divider" />

            <div className="section-header">
              <h2>Ground Visualization</h2>
            </div>
            <p className="section-desc">Atur tampilan dan posisi lantai (karpet) tempat bola memantul.</p>
            
            <div className="settings-grid">
              <div className="setting-item">
                <label>Posisi Lantai (Ground Level Y)</label>
                <p className="setting-desc">Mengatur level ketinggian lantai pantulan (invisible carpet). Lebih negatif = lantai lebih dalam.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={-5.0}
                    max={0.0}
                    step={0.01}
                    value={localEncounterPhysics.groundY}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundY: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.01}
                    className="setting-value-input"
                    value={localEncounterPhysics.groundY}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundY: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Tampilkan Lantai (Show Ground)</label>
                <p className="setting-desc">Tampilkan lantai secara visual di arena (membantu untuk melihat batas pantulan secara jelas).</p>
                <div className="setting-control" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                  <label className="debug-toggle" style={{ flex: 1, margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={localEncounterPhysics.showGround || false}
                      onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, showGround: e.target.checked })}
                    />
                    <span className="debug-label">Aktifkan Karpet</span>
                  </label>
                </div>
              </div>

              <div className="setting-item">
                <label>Warna Karpet (Ground Color)</label>
                <p className="setting-desc">Pilih warna untuk lantai visual saat diaktifkan.</p>
                <div className="setting-control">
                  <input
                    type="color"
                    value={localEncounterPhysics.groundColor || '#4ecdc4'}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundColor: e.target.value })}
                    style={{ width: '100%', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Transparansi (Opacity)</label>
                <p className="setting-desc">Mengatur tingkat kejelasan karpet (1 = padat, 0 = tembus pandang).</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={localEncounterPhysics.groundOpacity ?? 0.8}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundOpacity: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className="setting-value-input"
                    value={localEncounterPhysics.groundOpacity ?? 0.8}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundOpacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Kilau (Metalness)</label>
                <p className="setting-desc">Mengatur seberapa mengkilap/metalik pantulan cahaya pada karpet.</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={localEncounterPhysics.groundMetalness ?? 0.1}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundMetalness: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className="setting-value-input"
                    value={localEncounterPhysics.groundMetalness ?? 0.1}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundMetalness: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="setting-item">
                <label>Kekasaran (Roughness)</label>
                <p className="setting-desc">Mengatur kehalusan permukaan karpet (lebih besar = lebih matte/doff).</p>
                <div className="setting-control">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={localEncounterPhysics.groundRoughness ?? 0.8}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundRoughness: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    step={0.1}
                    className="setting-value-input"
                    value={localEncounterPhysics.groundRoughness ?? 0.8}
                    onChange={e => setLocalEncounterPhysics({ ...localEncounterPhysics, groundRoughness: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        </div>
      </main>

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
