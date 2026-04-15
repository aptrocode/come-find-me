import { useState, useCallback, Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Center, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { CaughtCreature } from '../../../types'
import { useAdminStore } from '../../../store/useAdminStore'
import CreatureModel from '../../atoms/CreatureModel'
import ErrorBoundary from '../../atoms/ErrorBoundary'
import './CreatureDetail.css'

// ─── Type config ──────────────────────────────────────────────────
const TYPE_EMOJI: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', dark: '🌑', normal: '✨',
}

const TYPE_GRADIENTS: Record<string, string> = {
  fire: 'linear-gradient(160deg, #1a0a00 0%, #2d1200 30%, #4a1a00 60%, #0a0e27 100%)',
  water: 'linear-gradient(160deg, #001a2e 0%, #00263d 30%, #003850 60%, #0a0e27 100%)',
  grass: 'linear-gradient(160deg, #0a1a00 0%, #122600 30%, #1a3800 60%, #0a0e27 100%)',
  electric: 'linear-gradient(160deg, #1a1500 0%, #2d2400 30%, #3d3000 60%, #0a0e27 100%)',
  dark: 'linear-gradient(160deg, #0d0020 0%, #1a0040 30%, #260060 60%, #0a0e27 100%)',
  normal: 'linear-gradient(160deg, #15102a 0%, #1e1840 30%, #2a2055 60%, #0a0e27 100%)',
}

// ─── Slow auto-rotate for the 3D model ────────────────────────────
function AutoRotate({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.3
    }
  })
  return <group ref={ref}>{children}</group>
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

  const modelUrl = creature.modelUrl || '/models/bikini-girl.glb'
  const typeEmoji = TYPE_EMOJI[creature.type] || '✨'
  const bgGradient = TYPE_GRADIENTS[creature.type] || TYPE_GRADIENTS.normal
  const rarityLabel = creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)

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
          <button className="detail-back-btn" onClick={handleClose}>
            ← Back
          </button>
          <button className="detail-fav-btn">☆</button>
        </div>

        {/* CP Badge */}
        <div className="detail-cp-badge">
          <span className="cp-label">CP</span>
          <span className="cp-value">{cp}</span>
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

                <AutoRotate>
                  <Center>
                    <CreatureModel url={modelUrl} scale={2.2} />
                  </Center>
                </AutoRotate>

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
              <span className="detail-stat-value" style={{ color: creature.color }}>{stats.attack}</span>
              <span className="detail-stat-label">Attack</span>
            </div>
            <div className="detail-stat-item">
              <span className="detail-stat-value" style={{ color: '#4ECDC4' }}>{stats.defense}</span>
              <span className="detail-stat-label">Defense</span>
            </div>
            <div className="detail-stat-item">
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
