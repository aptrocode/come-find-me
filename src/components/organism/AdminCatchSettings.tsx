import type { CatchConfig } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'

interface AdminCatchSettingsProps {
  config: CatchConfig
  onChange: (config: CatchConfig) => void
  onReset: () => void
  logMode: {
    checked: boolean
    onChange: (val: boolean) => void
  }
}

export default function AdminCatchSettings({
  config,
  onChange,
  onReset,
  logMode
}: AdminCatchSettingsProps) {
  const updateField = <K extends keyof CatchConfig>(key: K, value: CatchConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <AdminSectionCard
      title="Catch Mechanics"
      logMode={logMode}
      onReset={onReset}
    >
      <div className="settings-grid">
        <div className="setting-item">
          <label>Flee Threshold (0-1)</label>
          <p className="setting-desc">Tingkat kesulitan atau peluang monster untuk melarikan diri saat ditangkap.</p>
          <div className="setting-control">
            <input
              type="range" min={0} max={1} step={0.01}
              value={config.catchFleeThreshold}
              onChange={e => updateField('catchFleeThreshold', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.01}
              value={config.catchFleeThreshold}
              onChange={e => updateField('catchFleeThreshold', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="setting-item">
          <label>CP Variance (0-1)</label>
          <p className="setting-desc">Variasi kekuatan (Combat Power) monster yang muncul secara acak.</p>
          <div className="setting-control">
            <input
              type="range" min={0} max={1} step={0.01}
              value={config.cpVariance}
              onChange={e => updateField('cpVariance', Number(e.target.value))}
            />
            <input
              type="number" className="setting-input-manual"
              step={0.01}
              value={config.cpVariance}
              onChange={e => updateField('cpVariance', Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </AdminSectionCard>
  )
}
