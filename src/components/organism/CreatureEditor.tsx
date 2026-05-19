import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { Creature, CreatureType, Rarity } from '../../types'
import './CreatureEditor.css'

interface CreatureEditorProps {
  creature: Creature | null // null = new creature
  onSave: (creature: Creature) => void
  onClose: () => void
}

const CREATURE_TYPES: CreatureType[] = ['fire', 'water', 'grass', 'electric', 'dark', 'normal']
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary']

const TYPE_EMOJIS: Record<CreatureType, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑', normal: '⭐'
}

function uid() {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export default function CreatureEditor({ creature, onSave, onClose }: CreatureEditorProps) {
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
    modelX: 0,
    modelY: 0,
    modelZ: -3,
    modelScale: 1,
  })

  const updateField = <K extends keyof Creature>(key: K, value: Creature[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

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
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Creature name..."
              required
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Icon (Emoji or WebP/PNG URL)</label>
            <input
              type="text"
              value={form.emoji}
              onChange={e => updateField('emoji', e.target.value)}
              placeholder="e.g., 🦊 or /models/Cabai/icon.webp"
            />
          </div>

          <div className="form-group">
            <label>Icon Scale</label>
            <input
              type="number"
              min={0.1}
              max={5}
              step={0.05}
              value={form.iconScale ?? 1.0}
              onChange={e => updateField('iconScale', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Theme Color</label>
            <input
              type="color"
              value={form.color}
              onChange={e => updateField('color', e.target.value)}
              className="color-input"
              style={{ padding: '4px', height: '48px' }}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <div className="select-wrapper">
              <select value={form.type} onChange={e => updateField('type', e.target.value as CreatureType)}>
                {CREATURE_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_EMOJIS[t]} {t}</option>
                ))}
              </select>
              <Icon icon="ph:caret-down-bold" className="select-chevron" />
            </div>
          </div>

          <div className="form-group">
            <label>Rarity</label>
            <div className="select-wrapper">
              <select value={form.rarity} onChange={e => updateField('rarity', e.target.value as Rarity)}>
                {RARITIES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Icon icon="ph:caret-down-bold" className="select-chevron" />
            </div>
          </div>

          <div className="form-group">
            <label>Base CP</label>
            <input
              type="number"
              value={form.baseCP}
              onChange={e => updateField('baseCP', Number(e.target.value))}
              min={10}
              max={9999}
            />
          </div>

          <div className="form-group">
            <label>Catch Rate (0-1)</label>
            <input
              type="number"
              value={form.baseCatchRate}
              onChange={e => updateField('baseCatchRate', Number(e.target.value))}
              min={0.01}
              max={1}
              step={0.01}
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="A brief description of this creature..."
              rows={3}
            />
          </div>

          {/* ─── 2D Sprite Configuration ─────────────────────────── */}
          <div className="form-group full-width" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', marginTop: '10px' }}>
            <label style={{ color: 'var(--admin-secondary)', fontSize: '0.9rem' }}>2D Sprite Configuration</label>
            
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.75rem' }}>Sequence URL Prefix</label>
              <input
                type="text"
                value={form.sequenceUrl || ''}
                onChange={e => updateField('sequenceUrl', e.target.value)}
                placeholder="/models/Gracie/webp/Gracie_"
                style={{ padding: '8px 12px' }}
              />
              <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginTop: '4px', display: 'block' }}>
                E.g., '/models/Gracie/webp/Gracie_' or use {'{frame}'} template for custom patterns (e.g. '/models/Cabai/webp/Cabai_{'{frame}'}_result')
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Total Frames</label>
                <input
                  type="number"
                  min={1}
                  value={form.sequenceFrames ?? 121}
                  onChange={e => updateField('sequenceFrames', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Playback FPS</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.sequenceFps ?? 30}
                  onChange={e => updateField('sequenceFps', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Sprite Scale</label>
                <input
                  type="number"
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={form.sequenceScale ?? 1.2}
                  onChange={e => updateField('sequenceScale', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem' }}>Format</label>
                <div className="select-wrapper">
                  <select 
                    value={form.sequenceFormat || 'webp'} 
                    onChange={e => updateField('sequenceFormat', e.target.value)}
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="webp">WebP</option>
                    <option value="png">PNG</option>
                  </select>
                  <Icon icon="ph:caret-down-bold" className="select-chevron" />
                </div>
              </div>
            </div>

            {/* ─── 2D Alignment ────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
              <label style={{ color: 'var(--admin-secondary)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>2D Alignment</label>
              <button 
                type="button" 
                className="btn-tiny" 
                onClick={() => {
                  setForm(f => ({ ...f, modelX: 0, modelY: 0, modelZ: -3, modelScale: 1 }));
                }}
                style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--admin-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Icon icon="ph:arrow-counter-clockwise-bold" style={{ marginRight: '4px' }} />
                Reset Default
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Offset X</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelX ?? 0}
                  onChange={e => updateField('modelX', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Offset Y</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelY ?? 0}
                  onChange={e => updateField('modelY', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Depth (Z)</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelZ ?? -3}
                  onChange={e => updateField('modelZ', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Group Scale</label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={form.modelScale ?? 1}
                  onChange={e => updateField('modelScale', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <Icon icon={isNew ? "ph:plus-bold" : "ph:floppy-disk-back-duotone"} />
              {isNew ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
