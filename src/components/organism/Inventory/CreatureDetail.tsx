import { useState, useCallback, Suspense, useRef, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { CaughtCreature } from '../../../types'
import { useAdminStore } from '../../../store/useAdminStore'
import CreatureSequence from '../../atoms/CreatureSequence'
import ErrorBoundary from '../../atoms/ErrorBoundary'
import BackButton from '../../atoms/BackButton'
import './CreatureDetail.css'

// ─── Type config ──────────────────────────────────────────────────
const TYPE_EMOJI: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑', normal: '✨',
}

const TYPE_GRADIENTS: Record<string, string> = {
  fire: 'linear-gradient(160deg, #2d0e00 0%, #4a1a00 30%, #291a10 60%, #352b67 100%)',
  water: 'linear-gradient(160deg, #001f3f 0%, #003366 30%, #002244 60%, #352b67 100%)',
  grass: 'linear-gradient(160deg, #0f280a 0%, #1d4010 30%, #152210 60%, #352b67 100%)',
  electric: 'linear-gradient(160deg, #2d2800 0%, #4a4000 30%, #282510 60%, #352b67 100%)',
  dark: 'linear-gradient(160deg, #150a25 0%, #220f3a 30%, #1c152a 60%, #352b67 100%)',
  normal: 'linear-gradient(160deg, #221a3a 0%, #2e2455 30%, #242038 60%, #352b67 100%)',
}


// ─── 3D loading fallback ──────────────────────────────────────────
function DetailLoadingFallback() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 2
  })
  return (
    <mesh ref={ref}>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#fdb913" wireframe transparent opacity={0.4} />
    </mesh>
  )
}

// ─── Main Component ──────────────────────────────────────────────
interface CreatureDetailProps {
  entry: CaughtCreature
  onClose: () => void
}

export default function CreatureDetail({ entry, onClose }: CreatureDetailProps) {
  const [isClosing, setIsClosing] = useState(false)
  const { creatures } = useAdminStore()
  
  // Hydrate with latest admin data if available, otherwise fallback to caught snapshot
  const currentCreature = useMemo(() => {
    const latest = creatures.find(c => c.id === entry.creature.id)
    return latest || entry.creature
  }, [creatures, entry.creature])

  const { cp, caughtAt } = entry
  const creature = currentCreature


  const typeEmoji = TYPE_EMOJI[creature.type] || '✨'
  const bgGradient = TYPE_GRADIENTS[creature.type] || TYPE_GRADIENTS.normal
  const rarityLabel = creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)

  const sequenceUrl = creature.sequenceUrl || '/models/Gracie/webp/Gracie_'
  const sequenceFrames = creature.sequenceFrames ?? 121
  const sequenceFps = creature.sequenceFps ?? 30
  const sequenceScale = creature.sequenceScale ?? 1.2
  const sequenceFormat = creature.sequenceFormat || 'webp'

  const caughtDate = new Date(caughtAt)
  const dateStr = caughtDate.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const timeStr = caughtDate.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  })

  // Stable stats derived from CP (seeded by creature id hash so they don't re-randomize)
  const stats = useMemo(() => {
    // Simple hash from creature id + cp for deterministic "random" stats
    let hash = 0
    for (let i = 0; i < entry.id.length; i++) {
      hash = ((hash << 5) - hash) + entry.id.charCodeAt(i)
      hash |= 0
    }
    const seed1 = Math.abs(hash % 20)
    const seed2 = Math.abs((hash >> 4) % 20)
    const seed3 = Math.abs((hash >> 8) % 20)
    return {
      attack: Math.round(cp * 0.4 + seed1),
      defense: Math.round(cp * 0.3 + seed2),
      stamina: Math.round(cp * 0.3 + seed3),
    }
  }, [cp, entry.id])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  return (
    <div className={`creature-detail-overlay ${isClosing ? 'closing' : ''}`}>
      {/* Background */}
      <div className="detail-bg">
        <div className="detail-bg-gradient" style={{ background: bgGradient }} />
        <div className="detail-bg-noise" />
        <div className="detail-bg-particles">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="detail-particle"
              style={{ background: creature.color + '40' }}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="detail-scroll-content">
        {/* Top bar */}
        <div className="detail-top-bar">
          <BackButton onClick={handleClose} />
          
          <div className="detail-cp-badge">
            <span className="cp-label">CP</span>
            <span className="cp-value">{cp}</span>
          </div>

          <button className="detail-fav-btn" aria-label="Favorite">
            <Icon icon="ph:sparkle-duotone" />
          </button>
        </div>

        {/* 3D Model Viewer */}
        <div className="detail-3d-viewer">
          <Canvas camera={{ position: [0, 0.5, 3.5], fov: 40 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
            <ErrorBoundary fallback={
              <Center>
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#ff4d4d" wireframe />
                </mesh>
              </Center>
            }>
              <Suspense fallback={<DetailLoadingFallback />}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} color="#E8E0FF" />
                <directionalLight position={[-3, 4, -2]} intensity={0.4} color={creature.color} />
                <hemisphereLight args={[creature.color, '#0a0a1a', 0.3]} />

                  <CreatureSequence 
                    sequenceUrl={sequenceUrl}
                    sequenceFrames={sequenceFrames}
                    sequenceFps={sequenceFps}
                    sequenceScale={sequenceScale}
                    sequenceFormat={sequenceFormat}
                    scale={creature.modelScale ?? 2.2} 
                    position={[creature.modelX ?? 0, creature.modelY ?? -0.3, 0]} 
                  />

                <ContactShadows
                  position={[0, -1.5, 0]}
                  opacity={0.4}
                  scale={5}
                  blur={2.5}
                  color={creature.color}
                />

                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 1.8}
                  dampingFactor={0.08}
                  rotateSpeed={0.5}
                />
              </Suspense>
            </ErrorBoundary>
          </Canvas>
          <div className="detail-3d-hint">Drag to rotate</div>
        </div>

        {/* Info Card */}
        <div className="detail-info-card">
          <div className="detail-handle" />

          {/* Name + Type */}
          <div className="detail-name-row">
            <h2 className="detail-creature-name">{creature.name}</h2>
            <div className={`detail-type-badge type-${creature.type}`}>
              <span className="detail-type-icon">{typeEmoji}</span>
              {creature.type}
            </div>
          </div>

          {/* Rarity + Date */}
          <div className="detail-rarity-bar">
            <span className={`detail-rarity-tag detail-rarity-${creature.rarity}`}>
              {rarityLabel}
            </span>
            <span className="detail-caught-date">
              Caught {dateStr} • {timeStr}
            </span>
          </div>

          {/* Stats */}
          <div className="detail-stats-grid">
            <div className="detail-stat-item">
              <div className="detail-stat-icon-box" style={{ background: `${creature.color}15` }}>
                <Icon icon="ph:sword-duotone" style={{ color: creature.color }} />
              </div>
              <span className="detail-stat-value" style={{ color: creature.color }}>{stats.attack}</span>
              <span className="detail-stat-label">Attack</span>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-icon-box" style={{ background: '#4ECDC415' }}>
                <Icon icon="ph:shield-duotone" style={{ color: '#4ECDC4' }} />
              </div>
              <span className="detail-stat-value" style={{ color: '#4ECDC4' }}>{stats.defense}</span>
              <span className="detail-stat-label">Defense</span>
            </div>
            <div className="detail-stat-item">
              <div className="detail-stat-icon-box" style={{ background: '#FFE66D15' }}>
                <Icon icon="ph:lightning-duotone" style={{ color: '#FFE66D' }} />
              </div>
              <span className="detail-stat-value" style={{ color: '#FFE66D' }}>{stats.stamina}</span>
              <span className="detail-stat-label">Stamina</span>
            </div>
          </div>

          {/* Description */}
          <p className="detail-description">
            "{creature.description}"
          </p>
        </div>
      </div>
    </div>
  )
}
