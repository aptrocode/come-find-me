import type { SpawnConfig } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'

interface AdminSpawnSettingsProps {
  config: SpawnConfig
  onChange: (config: SpawnConfig) => void
  onReset: () => void
  logMode: {
    checked: boolean
    onChange: (val: boolean) => void
  }
}

export default function AdminSpawnSettings({
  config,
  onChange,
  onReset,
  logMode
}: AdminSpawnSettingsProps) {
  const updateField = <K extends keyof SpawnConfig>(key: K, value: SpawnConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <AdminSectionCard
      title="Spawn Configuration"
      logMode={logMode}
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item">
          <label>Min Spawn Radius</label>
          <p className="setting-desc">Jarak minimal monster muncul dari posisi pemain.</p>
          <div className="setting-control">
            <input
              type="range" min={5} max={500}
              value={config.spawnRadiusMin}
              onChange={e => updateField('spawnRadiusMin', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.spawnRadiusMin}
              onChange={e => updateField('spawnRadiusMin', Number(e.target.value))}
            />
            <span className="setting-unit">m</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Max Spawn Radius</label>
          <p className="setting-desc">Jarak maksimal monster muncul dari posisi pemain.</p>
          <div className="setting-control">
            <input
              type="range" min={5} max={1000}
              value={config.spawnRadiusMax}
              onChange={e => updateField('spawnRadiusMax', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.spawnRadiusMax}
              onChange={e => updateField('spawnRadiusMax', Number(e.target.value))}
            />
            <span className="setting-unit">m</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Max Active Spawns</label>
          <p className="setting-desc">Jumlah maksimal monster yang dapat aktif bersamaan di peta.</p>
          <div className="setting-control">
            <input
              type="range" min={1} max={50}
              value={config.maxActiveSpawns}
              onChange={e => updateField('maxActiveSpawns', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.maxActiveSpawns}
              onChange={e => updateField('maxActiveSpawns', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="setting-item">
          <label>Spawn Interval</label>
          <p className="setting-desc">Waktu tunggu antara setiap kemunculan monster baru.</p>
          <div className="setting-control">
            <input
              type="range" min={2000} max={60000} step={1000}
              value={config.spawnInterval}
              onChange={e => updateField('spawnInterval', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.spawnInterval}
              onChange={e => updateField('spawnInterval', Number(e.target.value))}
            />
            <span className="setting-unit">ms</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Spawn Lifetime</label>
          <p className="setting-desc">Durasi monster bertahan di peta sebelum menghilang otomatis.</p>
          <div className="setting-control">
            <input
              type="range" min={30000} max={1800000} step={30000}
              value={config.spawnLifetime}
              onChange={e => updateField('spawnLifetime', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.spawnLifetime}
              onChange={e => updateField('spawnLifetime', Number(e.target.value))}
            />
            <span className="setting-unit">ms</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Despawn Range</label>
          <p className="setting-desc">Jarak aman di mana monster akan menghilang jika pemain menjauh.</p>
          <div className="setting-control">
            <input
              type="range" min={10} max={2000} step={10}
              value={config.despawnRange}
              onChange={e => updateField('despawnRange', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.despawnRange}
              onChange={e => updateField('despawnRange', Number(e.target.value))}
            />
            <span className="setting-unit">m</span>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
