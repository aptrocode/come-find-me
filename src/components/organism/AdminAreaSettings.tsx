import { Icon } from '@iconify/react'
import type { EventAreaConfig, MapConfig } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'
import AdminPolygonEditor from './AdminPolygonEditor'

interface AdminAreaSettingsProps {
  areaConfig: EventAreaConfig
  mapConfig: MapConfig
  onAreaChange: (area: EventAreaConfig) => void
  onMapChange: (map: MapConfig) => void
  onReset: () => void
}

export default function AdminAreaSettings({
  areaConfig,
  mapConfig,
  onAreaChange,
  onMapChange,
  onReset
}: AdminAreaSettingsProps) {
  return (
    <AdminSectionCard
      title="Event Area & Map"
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
          <label className="debug-toggle" style={{ justifyContent: 'flex-start' }}>
            <input
              type="checkbox"
              checked={areaConfig.enabled}
              onChange={e => onAreaChange({ ...areaConfig, enabled: e.target.checked })}
            />
            <span className="debug-label">Enable Event Play Area</span>
          </label>
        </div>

        {areaConfig.enabled && (
          <div style={{ gridColumn: '1 / -1' }}>
            <AdminPolygonEditor 
              polygon={areaConfig.polygon}
              color={areaConfig.color}
              opacity={areaConfig.opacity}
              onChange={poly => onAreaChange({ ...areaConfig, polygon: poly })}
            />
          </div>
        )}

        <div className="setting-item" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
          <label>Area Appearance</label>
          <div className="setting-control" style={{ gap: '20px' }}>
            <input
              type="color"
              value={areaConfig.color || '#4ecdc4'}
              onChange={e => onAreaChange({ ...areaConfig, color: e.target.value })}
              style={{ width: '60px', height: '40px', border: 'none', cursor: 'pointer' }}
            />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon icon="ph:ghost-duotone" />
              <input
                type="range" min={0} max={1} step={0.01}
                value={areaConfig.opacity ?? 0.2}
                onChange={e => onAreaChange({ ...areaConfig, opacity: Number(e.target.value) })}
              />
              <input
                type="number" className="setting-input-manual"
                step={0.01}
                value={(areaConfig.opacity ?? 0.2)}
                onChange={e => onAreaChange({ ...areaConfig, opacity: Number(e.target.value) })}
              />
              <span className="setting-unit">%</span>
            </div>
          </div>
          <p className="setting-desc" style={{ marginTop: '12px' }}>Transparansi visual area batas event pada peta utama.</p>
        </div>
      </div>

      <hr className="section-divider" style={{ margin: '32px 0' }} />

      <div className="section-header" style={{ marginBottom: '16px' }}>
        <h2>Map Config (Recenter)</h2>
      </div>
      
      <div className="settings-grid">
        <div className="setting-item">
          <label>Default Zoom</label>
          <p className="setting-desc">Tingkat perbesaran kamera saat pertama kali peta dimuat.</p>
          <div className="setting-control">
            <input
              type="range" min={14} max={22} step={0.1}
              value={mapConfig.defaultZoom}
              onChange={e => onMapChange({ ...mapConfig, defaultZoom: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={mapConfig.defaultZoom}
              onChange={e => onMapChange({ ...mapConfig, defaultZoom: Number(e.target.value) })}
            />
            <span className="setting-unit">x</span>
          </div>
        </div>
        
        <div className="setting-item">
          <label>Default Pitch (Tilt)</label>
          <p className="setting-desc">Sudut kemiringan kamera (tilt) untuk tampilan 3D pada peta.</p>
          <div className="setting-control">
            <input
              type="range" min={0} max={85} step={1}
              value={mapConfig.defaultPitch}
              onChange={e => onMapChange({ ...mapConfig, defaultPitch: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              value={mapConfig.defaultPitch}
              onChange={e => onMapChange({ ...mapConfig, defaultPitch: Number(e.target.value) })}
            />
            <span className="setting-unit">°</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Default Bearing (Rotasi)</label>
          <p className="setting-desc">Arah hadap kamera awal pada peta.</p>
          <div className="setting-control">
            <input
              type="range" min={0} max={360} step={1}
              value={mapConfig.defaultBearing ?? 0}
              onChange={e => onMapChange({ ...mapConfig, defaultBearing: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              value={mapConfig.defaultBearing ?? 0}
              onChange={e => onMapChange({ ...mapConfig, defaultBearing: Number(e.target.value) })}
            />
            <span className="setting-unit">°</span>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
