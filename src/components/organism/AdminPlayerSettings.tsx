import AdminSectionCard from '../molecules/AdminSectionCard'
import type { PlayerConfig } from '../../types'

interface AdminPlayerSettingsProps {
  config: PlayerConfig
  onChange: (config: PlayerConfig) => void
  onReset: () => void
}

export default function AdminPlayerSettings({ config, onChange, onReset }: AdminPlayerSettingsProps) {
  return (
    <AdminSectionCard
      title="Player Model Settings"
      icon="ph:user-circle-duotone"
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
          <label>Scale (Ukuran)</label>
          <p className="setting-desc">Membesarkan atau mengecilkan model 3D player.</p>
          <div className="setting-control">
            <input
              type="range" min={0.1} max={10} step={0.1}
              value={config.scale}
              onChange={e => onChange({ ...config, scale: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={config.scale}
              onChange={e => onChange({ ...config, scale: Number(e.target.value) })}
            />
            <span className="setting-unit">x</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Offset X (Kiri / Kanan)</label>
          <p className="setting-desc">Geser posisi 3D model ke kiri atau ke kanan.</p>
          <div className="setting-control">
            <input
              type="range" min={-5} max={5} step={0.1}
              value={config.positionX}
              onChange={e => onChange({ ...config, positionX: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={config.positionX}
              onChange={e => onChange({ ...config, positionX: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="setting-item">
          <label>Offset Y (Atas / Bawah)</label>
          <p className="setting-desc">Geser posisi 3D model ke atas atau ke bawah.</p>
          <div className="setting-control">
            <input
              type="range" min={-5} max={5} step={0.1}
              value={config.positionY}
              onChange={e => onChange({ ...config, positionY: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={config.positionY}
              onChange={e => onChange({ ...config, positionY: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="setting-item">
          <label>Offset Z (Maju / Mundur)</label>
          <p className="setting-desc">Geser posisi 3D model ke depan atau ke belakang.</p>
          <div className="setting-control">
            <input
              type="range" min={-5} max={5} step={0.1}
              value={config.positionZ}
              onChange={e => onChange({ ...config, positionZ: Number(e.target.value) })}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.1}
              value={config.positionZ}
              onChange={e => onChange({ ...config, positionZ: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
