import type { EncounterPhysicsConfig } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'

interface AdminPhysicsSettingsProps {
  config: EncounterPhysicsConfig
  onChange: (config: EncounterPhysicsConfig) => void
  onReset: () => void
  logMode: {
    checked: boolean
    onChange: (val: boolean) => void
  }
}

export default function AdminPhysicsSettings({
  config,
  onChange,
  onReset,
  logMode
}: AdminPhysicsSettingsProps) {
  const updateField = <K extends keyof EncounterPhysicsConfig>(key: K, value: EncounterPhysicsConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <AdminSectionCard
      title="Encounter Physics"
      logMode={logMode}
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item">
          <label>Ball Mass</label>
          <p className="setting-desc">Berat bola tangkap yang mempengaruhi kecepatan dan lintasan lemparan.</p>
          <div className="setting-control">
            <input
              type="range" min={0.1} max={5} step={0.1}
              value={config.mass}
              onChange={e => updateField('mass', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={config.mass}
              onChange={e => updateField('mass', Number(e.target.value))}
            />
            <span className="setting-unit">kg</span>
          </div>
        </div>

        <hr className="section-divider" style={{ gridColumn: '1 / -1', margin: '16px 0' }} />

        <div className="setting-item">
          <label>Ground Visibility</label>
          <p className="setting-desc">Aktifkan untuk memunculkan visual lantai pada layar tangkap.</p>
          <div className="setting-control">
            <label className="debug-toggle">
              <input
                type="checkbox"
                checked={config.showGround ?? false}
                onChange={e => updateField('showGround', e.target.checked)}
              />
              <span className="debug-label">{config.showGround ? 'Visible' : 'Hidden'}</span>
            </label>
          </div>
        </div>

        {config.showGround && (
          <>
            <div className="setting-item">
              <label>Ground Color</label>
              <p className="setting-desc">Warna visual lantai untuk membantu kalibrasi posisi monster.</p>
              <div className="setting-control">
                <input
                  type="color"
                  value={config.groundColor || '#4ecdc4'}
                  onChange={e => updateField('groundColor', e.target.value)}
                  style={{ width: '100%', height: '40px', border: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="setting-item">
              <label>Opacity</label>
              <p className="setting-desc">Tingkat transparansi visual lantai di layar tangkap.</p>
              <div className="setting-control">
                <input
                  type="range" min={0} max={1} step={0.1}
                  value={config.groundOpacity ?? 0.8}
                  onChange={e => updateField('groundOpacity', Number(e.target.value))}
                />
                <input
                  type="number" className="setting-input-manual"
                  step={0.1}
                  value={config.groundOpacity ?? 0.8}
                  onChange={e => updateField('groundOpacity', Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminSectionCard>
  )
}
