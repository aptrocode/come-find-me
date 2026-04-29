import AdminSectionCard from '../molecules/AdminSectionCard'
import type { MapConfig } from '../../types'

interface AdminMapStyleSettingsProps {
  mapConfig: MapConfig
  onMapChange: (config: MapConfig) => void
  onReset: () => void
}

const PRESET_STYLES = [
  { id: 'mapbox://styles/mapbox/standard', name: 'Mapbox Standard' },
  { id: 'mapbox://styles/mapbox/standard-satellite', name: 'Mapbox Satellite' },
  { id: 'mapbox://styles/mapbox/streets-v12', name: 'Streets' },
  { id: 'mapbox://styles/mapbox/outdoors-v12', name: 'Outdoors' },
  { id: 'mapbox://styles/mapbox/light-v11', name: 'Light' },
  { id: 'mapbox://styles/mapbox/dark-v11', name: 'Dark' },
  { id: 'mapbox://styles/mapbox/navigation-day-v1', name: 'Nav Day' },
  { id: 'mapbox://styles/mapbox/navigation-night-v1', name: 'Nav Night' },
]

const LIGHT_PRESETS = [
  { id: 'day', name: 'Day' },
  { id: 'dusk', name: 'Dusk' },
  { id: 'dawn', name: 'Dawn' },
  { id: 'night', name: 'Night' },
]

export default function AdminMapStyleSettings({ mapConfig, onMapChange, onReset }: AdminMapStyleSettingsProps) {
  return (
    <AdminSectionCard
      title="Map Style Settings"
      icon="ph:palette-duotone"
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
          <label>Mapbox Style</label>
          <p className="setting-desc">Pilih tema dasar peta atau masukkan Style URL kustom.</p>
          <div className="setting-control" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              className="setting-input" 
              value={PRESET_STYLES.some(s => s.id === mapConfig.styleUrl) ? mapConfig.styleUrl : 'custom'}
              onChange={e => {
                if (e.target.value !== 'custom') {
                  onMapChange({ ...mapConfig, styleUrl: e.target.value })
                }
              }}
            >
              {PRESET_STYLES.map(style => (
                <option key={style.id} value={style.id}>{style.name}</option>
              ))}
              <option value="custom">-- Custom Style URL --</option>
            </select>
            
            <input
              type="text"
              className="setting-input"
              placeholder="mapbox://styles/..."
              value={mapConfig.styleUrl}
              onChange={e => onMapChange({ ...mapConfig, styleUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="setting-item">
          <label>Light Preset (Standard Style)</label>
          <p className="setting-desc">Hanya bekerja jika menggunakan Mapbox Standard style.</p>
          <div className="setting-control">
            <select 
              className="setting-input" 
              value={mapConfig.lightPreset}
              onChange={e => onMapChange({ ...mapConfig, lightPreset: e.target.value as MapConfig['lightPreset'] })}
            >
              {LIGHT_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="setting-item">
          <label>Show POI Labels</label>
          <p className="setting-desc">Tampilkan label gedung, toko, dan point of interest.</p>
          <div className="setting-control">
            <button 
              className={`toggle-btn ${mapConfig.showLabels ? 'active' : ''}`}
              onClick={() => onMapChange({ ...mapConfig, showLabels: !mapConfig.showLabels })}
            >
              {mapConfig.showLabels ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
