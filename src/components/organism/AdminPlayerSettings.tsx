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

        {/* Rotation Row */}
        <div className="setting-item">
          <label>Rotasi X (Pitch)</label>
          <p className="setting-desc">Putar model ke depan atau belakang.</p>
          <div className="setting-control">
            <input
              type="range" min={-180} max={180} step={1}
              value={config.rotationX || 0}
              onChange={e => onChange({ ...config, rotationX: Number(e.target.value) || 0 })}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.rotationX || 0}
              onChange={e => onChange({ ...config, rotationX: Number(e.target.value) || 0 })}
            />
            <span className="setting-unit">°</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Rotasi Y (Yaw/Heading)</label>
          <p className="setting-desc">Putar model ke kiri atau kanan.</p>
          <div className="setting-control">
            <input
              type="range" min={-180} max={180} step={1}
              value={config.rotationY || 0}
              onChange={e => onChange({ ...config, rotationY: Number(e.target.value) || 0 })}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.rotationY || 0}
              onChange={e => onChange({ ...config, rotationY: Number(e.target.value) || 0 })}
            />
            <span className="setting-unit">°</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Rotasi Z (Roll)</label>
          <p className="setting-desc">Miringkan model ke kiri atau kanan.</p>
          <div className="setting-control">
            <input
              type="range" min={-180} max={180} step={1}
              value={config.rotationZ || 0}
              onChange={e => onChange({ ...config, rotationZ: Number(e.target.value) || 0 })}
            />
            <input
              type="number" className="setting-input-manual"
              value={config.rotationZ || 0}
              onChange={e => onChange({ ...config, rotationZ: Number(e.target.value) || 0 })}
            />
            <span className="setting-unit">°</span>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
