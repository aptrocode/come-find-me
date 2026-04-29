import React, { useState, useCallback, useRef } from 'react'
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
    modelUrl: '',
    modelX: 0,
    modelY: 0,
    modelZ: -3,
    modelScale: 2.5,
  })

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = <K extends keyof Creature>(key: K, value: Creature[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleModelUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await fetch('/api/upload-model', {
        method: 'POST',
        headers: {
          'x-filename': file.name
        },
        body: file // Stream binary data directly
      })
      
      const result = await response.json()
      if (result.success) {
        updateField('modelUrl', result.url)
      } else {
        alert('Upload failed: ' + result.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload error. Check console for details.')
    } finally {
      setUploading(false)
    }
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

          <div className="form-group">
            <label>Emoji Icon</label>
            <input
              type="text"
              value={form.emoji}
              onChange={e => updateField('emoji', e.target.value)}
              maxLength={4}
              className="emoji-input"
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

          <div className="form-group full-width" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', marginTop: '10px' }}>
            <label style={{ color: 'var(--admin-secondary)', fontSize: '0.9rem' }}>3D Visual Configuration</label>
            <div className="model-upload-row" style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={form.modelUrl || ''}
                onChange={e => updateField('modelUrl', e.target.value)}
                placeholder="/models/creature.glb or upload..."
                className="model-url-input"
              />
              <button
                type="button"
                className={`upload-btn ${uploading ? 'uploading' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Icon icon={uploading ? "ph:spinner-gap-bold" : "ph:file-arrow-up-duotone"} className={uploading ? "spin" : ""} />
                {uploading ? 'Upload' : 'Upload GLB'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleModelUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
              <label style={{ color: 'var(--admin-secondary)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>3D Alignment</label>
              <button 
                type="button" 
                className="btn-tiny" 
                onClick={() => {
                  const isDefaultModel = !form.modelUrl || form.modelUrl.includes('bikini-girl.glb');
                  if (isDefaultModel) {
                    setForm(f => ({ ...f, modelX: -1.35, modelY: -0.8, modelZ: -3, modelScale: 2 }));
                  } else {
                    setForm(f => ({ ...f, modelX: 0, modelY: 0, modelZ: -3, modelScale: 2.5 }));
                  }
                }}
                style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--admin-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Icon icon="ph:arrow-counter-clockwise-bold" style={{ marginRight: '4px' }} />
                Reset Recommend
              </button>
            </div>

            <div className="model-alignment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Model X</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelX ?? 0}
                  onChange={e => updateField('modelX', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Model Y</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelY ?? 0}
                  onChange={e => updateField('modelY', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Model Z</label>
                <input
                  type="number"
                  step={0.1}
                  value={form.modelZ ?? -3}
                  onChange={e => updateField('modelZ', Number(e.target.value))}
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'auto' }}>
                <label style={{ fontSize: '0.7rem' }}>Scale</label>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={form.modelScale ?? 2}
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
