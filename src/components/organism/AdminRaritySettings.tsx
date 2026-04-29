import type { RarityWeights } from '../../types'
import AdminSectionCard from '../molecules/AdminSectionCard'

interface AdminRaritySettingsProps {
  weights: RarityWeights
  onChange: (weights: RarityWeights) => void
  onReset: () => void
  logMode: {
    checked: boolean
    onChange: (val: boolean) => void
  }
}

export default function AdminRaritySettings({
  weights,
  onChange,
  onReset,
  logMode
}: AdminRaritySettingsProps) {
  const updateWeight = (rarity: keyof RarityWeights, value: number) => {
    onChange({ ...weights, [rarity]: value })
  }

  return (
    <AdminSectionCard
      title="Rarity Weights"
      logMode={logMode}
      onReset={onReset}
    >
      <div className="settings-grid">
        {(Object.entries(weights) as [keyof RarityWeights, number][]).map(([key, value]) => (
          <div key={key} className="setting-item">
            <label>{key.charAt(0).toUpperCase() + key.slice(1)} Weight</label>
            <p className="setting-desc">Bobot probabilitas munculnya monster dengan tingkat kelangkaan {key}. Semakin besar bobot, semakin sering monster ini muncul.</p>
            <div className="setting-control">
              <input
                type="range" min={0} max={1000}
                value={value}
                onChange={e => updateWeight(key, Number(e.target.value))}
              />
              <input
                type="number" className="setting-input-manual"
                value={value}
                onChange={e => updateWeight(key, Number(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminSectionCard>
  )
}
