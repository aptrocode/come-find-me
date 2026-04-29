import { useState, useCallback, useEffect, Suspense, Component, useMemo, useRef } from 'react'
import { Icon } from '@iconify/react'
import type { ReactNode, ErrorInfo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useDrag } from '@use-gesture/react'
import { ContactShadows, Center } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../../store/useGameStore'
import { useAdminStore } from '../../../store/useAdminStore'
import CreatureModel from '../../atoms/CreatureModel'
import type { CreatureBounds } from '../../atoms/CreatureModel'
import BallModel from '../../atoms/BallModel'
import './EncounterScreen.css'

// Fallback hit box if bounding box hasn't been computed yet
const FALLBACK_HIT_HALF_W = 0.4
const FALLBACK_HIT_HALF_H = 0.8
const FALLBACK_HIT_HALF_D = 0.3

const GRAVITY = 9.8          // Realistic gravity for natural arc
const SPIN_SPEED_MIN = 4.0   // Spin for gentle throws
const SPIN_SPEED_MAX = 14.0  // Spin for max power throws

const OOB_Z_MIN = -8         // Out-of-bounds behind creature
const OOB_X_MAX = 6          // Out-of-bounds left/right
const OOB_Y_MAX = 8          // Out-of-bounds above

// Power thresholds — swipe velocity (px/ms) mapped to 0..1 power
const MIN_SWIPE_SPEED = 0.15  // Below this = minimum power throw
const MAX_SWIPE_SPEED = 2.5   // Above this = max power (capped)

// Throw velocity limits (world units/s)
const THROW_SPEED_MIN = 5.0   // Gentle lob
const THROW_SPEED_MAX = 22.0  // Hard throw, capped here to prevent overpower

// ─── Error Boundary ───────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode
  onError?: () => void
}
interface ErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[EncounterScreen] 3D render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="encounter-error">
          <span className="encounter-error-icon">⚠️</span>
          <p>Failed to load 3D scene</p>
          <button onClick={() => {
            this.setState({ hasError: false })
            this.props.onError?.()
          }}>
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Loading Fallback (inside Canvas) ──────────────────────────────
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#fdb913" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

// ─── Ball state type ──────────────────────────────────────────────
type BallPhase = 'idle' | 'dragging' | 'thrown'

// Shared data passed from DOM gesture layer into Canvas
interface GestureData {
  phase: BallPhase
  // drag offset in pixels
  mx: number
  my: number
  // final swipe movement in pixels (used for direction)
  swipeMx: number
  swipeMy: number
  // throw velocity (pixels/ms) — used for power
  vx: number
  vy: number
  // sequence counter to trigger new throws
  seq: number
}

// ─── ThrowBall (inside Canvas) ────────────────────────────────────
// The ball goes WHERE you swipe. You must aim at the creature.
// Swipe speed determines power (how far/fast the ball travels).
interface ThrowBallProps {
  gesture: GestureData
  onHit: () => void
  onMiss: () => void
  creatureBounds: React.RefObject<CreatureBounds | null>
  ballInFlightRef: React.RefObject<boolean>
}

interface ThrowBallProps {
  gesture: GestureData
  onHit: () => void
  onMiss: () => void
  creatureBounds: React.RefObject<CreatureBounds | null>
  ballInFlightRef: React.RefObject<boolean>
  creatureZ: number
  creatureY: number
}

function ThrowBall({ gesture, onHit, onMiss, creatureBounds, ballInFlightRef, creatureZ, creatureY }: ThrowBallProps) {
  const groupRef = useRef<THREE.Group>(null)
  const phase = useRef<BallPhase>('idle')
  const velocity = useRef({ x: 0, y: 0, z: 0 })
  const pos = useRef({ x: 0, y: -1.0, z: 1 })
  const scale = useRef(0.25)
  const spin = useRef(0)
  const spinSpeed = useRef(SPIN_SPEED_MIN)
  const resolved = useRef(false)
  const bounceCount = useRef(0)
  const lastSeq = useRef(-1)
  const flightTime = useRef(0)

  const { encounterPhysics } = useAdminStore()
  const { camera, size } = useThree()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)

    // ── Detect new throw ──
    if (gesture.seq !== lastSeq.current && gesture.phase === 'thrown') {
      lastSeq.current = gesture.seq

      // ── Power from swipe speed ──
      const rawSpeed = Math.sqrt(gesture.vx * gesture.vx + gesture.vy * gesture.vy)
      const normalizedPower = Math.min(
        Math.max((rawSpeed - MIN_SWIPE_SPEED) / (MAX_SWIPE_SPEED - MIN_SWIPE_SPEED), 0),
        1
      )
      const power = Math.min(normalizedPower * encounterPhysics.throwMultiplier, 1.0)

      // ── Direction from swipe movement ──
      // Convert 2D screen swipe direction to 3D world direction:
      //   - Horizontal swipe (swipeMx) → X direction
      //   - Vertical swipe up (swipeMy negative) → Into the screen (Z) + upward (Y)
      const swipeLen = Math.sqrt(gesture.swipeMx * gesture.swipeMx + gesture.swipeMy * gesture.swipeMy)
      // Normalized 2D swipe direction
      const ndx = swipeLen > 1 ? gesture.swipeMx / swipeLen : 0
      const ndy = swipeLen > 1 ? gesture.swipeMy / swipeLen : -1 // Default to straight up

      // Map 2D swipe to 3D launch direction:
      //   Screen-X → World-X (left/right)
      //   Screen-Y (up) → World-Z (into screen, negative) + World-Y (upward arc)
      const upComponent = Math.max(-ndy, 0) // How much of the swipe is "up" (0..1)
      
      // 3D direction: X from horizontal swipe, Z from vertical swipe, Y gets arc
      const dirX = ndx * 0.5   // Horizontal aim sensitivity
      const dirZ = -(0.3 + upComponent * 0.7) // Strong forward push into scene
      const dirY = 0.15 + upComponent * 0.1 // Subtle upward arc, gravity handles the rest

      // Normalize the 3D direction
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
      const normDirX = dirLen > 0 ? dirX / dirLen : 0
      const normDirY = dirLen > 0 ? dirY / dirLen : 0.3
      const normDirZ = dirLen > 0 ? dirZ / dirLen : -1

      // Apply power to get final throw speed (world units/sec)
      const throwSpeed = THREE.MathUtils.lerp(THROW_SPEED_MIN, THROW_SPEED_MAX, power)

      velocity.current = {
        x: normDirX * throwSpeed,
        y: normDirY * throwSpeed + 1.5 + power * 1.5, // Mild arc boost, gravity does the rest
        z: normDirZ * throwSpeed,
      }

      // Spin scales with power
      spinSpeed.current = THREE.MathUtils.lerp(SPIN_SPEED_MIN, SPIN_SPEED_MAX, power)

      // Launch from current position (where ball was dragged to)
      phase.current = 'thrown'
      ballInFlightRef.current = true
      resolved.current = false
      spin.current = 0
      bounceCount.current = 0
      flightTime.current = 0
    }

    // ── Handle drag state ──
    if (gesture.phase === 'dragging' && phase.current !== 'thrown') {
      phase.current = 'dragging'
      const distToBall = camera.position.z - 1
      const fov = (camera as THREE.PerspectiveCamera).fov
      const halfFovRad = THREE.MathUtils.degToRad(fov / 2)
      const worldHeight = 2 * distToBall * Math.tan(halfFovRad)
      const worldWidth = worldHeight * (size.width / size.height)
      const pxToWorldX = worldWidth / size.width
      const pxToWorldY = worldHeight / size.height
      const dragScale = encounterPhysics.dragMultiplier / 0.015
      pos.current.x = 0 + gesture.mx * pxToWorldX * dragScale
      pos.current.y = -1.0 + (-gesture.my) * pxToWorldY * dragScale
      pos.current.z = 1
      scale.current = 0.25 * 1.1
    }

    // ── Handle snap-back to idle ──
    if (gesture.phase === 'idle' && phase.current === 'dragging') {
      phase.current = 'idle'
    }

    // ── Physics update ──
    if (phase.current === 'idle') {
      pos.current.x = 0
      pos.current.y = -1.0
      pos.current.z = 1
      scale.current = 0.25
      spin.current = 0
      bounceCount.current = 0
      flightTime.current = 0
      ballInFlightRef.current = false
    } else if (phase.current === 'thrown') {
      flightTime.current += dt

      // Apply gravity
      velocity.current.y -= GRAVITY * dt

      // Update position
      pos.current.x += velocity.current.x * dt
      pos.current.y += velocity.current.y * dt
      pos.current.z += velocity.current.z * dt

      // Spin animation
      spin.current += spinSpeed.current * dt

      // Perspective scale: shrink as ball goes deeper (relative to baseline)
      const totalZ = 1 - creatureZ
      const progress = Math.max(0, Math.min(1, (1 - pos.current.z) / totalZ))
      scale.current = THREE.MathUtils.lerp(0.25, 0.06, progress)

      // ── Hit detection using actual 3D model bounding box ──
      const bounds = creatureBounds.current
      const hw = bounds ? bounds.halfWidth : FALLBACK_HIT_HALF_W
      const hh = bounds ? bounds.halfHeight : FALLBACK_HIT_HALF_H
      const hd = bounds ? bounds.halfDepth : FALLBACK_HIT_HALF_D
      const cY = bounds ? bounds.centerY : creatureY

      const inHitZone = pos.current.z <= creatureZ + hd && pos.current.z >= creatureZ - hd
      if (!resolved.current && inHitZone) {
        const withinX = Math.abs(pos.current.x) <= hw
        const withinY = Math.abs(pos.current.y - cY) <= hh

        if (withinX && withinY) {
          resolved.current = true
          pos.current = { x: 0, y: cY, z: creatureZ }
          groupRef.current.position.set(0, cY, creatureZ)
          phase.current = 'idle'
          onHit()
          return
        }
      }
      // Ball flew past creature without hitting
      if (!resolved.current && pos.current.z < creatureZ - hd) {
        resolved.current = true
      }

      // ── Ground bounce ──
      const groundY = encounterPhysics.groundY
      if (pos.current.y <= groundY && velocity.current.y < 0) {
        if (bounceCount.current < 2) {
          pos.current.y = groundY
          velocity.current.y = -velocity.current.y * 0.4
          velocity.current.x *= 0.6
          velocity.current.z *= 0.7
          bounceCount.current++
        } else {
          phase.current = 'idle'
          if (!resolved.current) onMiss()
          resolved.current = true
          return
        }
      }

      // ── Out-of-bounds check ──
      if (
        pos.current.z < OOB_Z_MIN ||
        Math.abs(pos.current.x) > OOB_X_MAX ||
        pos.current.y > OOB_Y_MAX ||
        flightTime.current > 3.0
      ) {
        phase.current = 'idle'
        if (!resolved.current) onMiss()
        resolved.current = true
        return
      }
    }

    // ── Apply transforms ──
    groupRef.current.position.set(pos.current.x, pos.current.y, pos.current.z)
    const s = scale.current
    groupRef.current.scale.set(s, s, s)
    groupRef.current.rotation.set(spin.current * 0.7, spin.current * 0.2, spin.current * 0.5)
  })

  return (
    <group
      ref={groupRef}
      position={[0, -1.0, 1]}
      scale={[0.25, 0.25, 0.25]}
    >
      <Center>
        <BallModel />
      </Center>
    </group>
  )
}

// ─── Main Component ────────────────────────────────────────────────
export default function EncounterScreen() {
  const { activeEncounter, encounterPhase, encounterResult, attemptCatch, resetThrow, closeEncounter, setEncounterPhase } = useGameStore()
  const [showFlash, setShowFlash] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [throwKey, setThrowKey] = useState(0)

  // Creature bounding box (auto-computed from the 3D model)
  const creatureBoundsRef = useRef<CreatureBounds | null>(null)
  const handleBoundsComputed = useCallback((bounds: CreatureBounds) => {
    creatureBoundsRef.current = bounds
  }, [])

  // Track whether the ball is currently in flight (blocks gesture input)
  const ballInFlightRef = useRef(false)

  // Gesture data shared between DOM layer and Canvas
  const [gesture, setGesture] = useState<GestureData>({
    phase: 'idle', mx: 0, my: 0, swipeMx: 0, swipeMy: 0, vx: 0, vy: 0, seq: 0
  })
  const seqRef = useRef(0)

  // Safety timeout
  useEffect(() => {
    if (encounterPhase === 'transitioning') {
      const safety = setTimeout(() => setEncounterPhase('active'), 4000)
      return () => clearTimeout(safety)
    }
  }, [encounterPhase, setEncounterPhase])

  const sceneReady = useMemo(() => encounterPhase === 'active', [encounterPhase])

  // ── Gesture handler (DOM layer) ──
  // Passes both drag position (for visual ball following finger) and
  // final swipe movement + velocity (for throw direction + power)
  const bind = useDrag(({ down, movement: [mx, my], velocity: [vx, vy], direction: [, dy] }) => {
    if (encounterResult) return
    if (ballInFlightRef.current) return

    if (down) {
      setGesture(g => ({ ...g, phase: 'dragging', mx, my }))
    } else {
      // Need upward swipe component to trigger throw
      const swipeUp = dy < 0 && Math.abs(my) > 20

      if (swipeUp) {
        seqRef.current++
        setGesture({
          phase: 'thrown',
          mx: 0, my: 0,
          swipeMx: mx,  // Pass final swipe position for direction
          swipeMy: my,
          vx, vy,       // Pass velocity for power
          seq: seqRef.current,
        })
      } else {
        setGesture(g => ({ ...g, phase: 'idle', mx: 0, my: 0 }))
      }
    }
  }, {
    threshold: 0,
    pointer: { touch: true },
  })

  const handleHit = useCallback(() => {
    setShowFlash(true)
    setTimeout(() => {
      setShowFlash(false)
      attemptCatch()
    }, 400)
  }, [attemptCatch])

  const handleMiss = useCallback(() => {
    useGameStore.setState({ encounterResult: 'missed' })
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      closeEncounter()
      setIsClosing(false)
    }, 400)
  }, [closeEncounter])

  const handleTryAgain = useCallback(() => {
    setThrowKey((k) => k + 1)
    setGesture({ phase: 'idle', mx: 0, my: 0, swipeMx: 0, swipeMy: 0, vx: 0, vy: 0, seq: seqRef.current })
    resetThrow()
  }, [resetThrow])

  const handleCanvasError = useCallback(() => {
    setThrowKey((k) => k + 1)
  }, [])

  // Auto-respawn after miss
  useEffect(() => {
    if (encounterResult === 'missed') {
      const timer = setTimeout(() => handleTryAgain(), 1500)
      return () => clearTimeout(timer)
    }
  }, [encounterResult, handleTryAgain])

  const { encounterPhysics } = useAdminStore()
  
  if (!activeEncounter) return null

  const { creature, cp } = activeEncounter
  const rarityLabel = creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)
  const isTransitioning = encounterPhase !== 'active'
  const modelUrl = creature.modelUrl || '/models/bikini-girl.glb'

  return (
    <div className={`encounter-overlay ${isTransitioning || isClosing ? 'transitioning' : ''} ${isClosing ? 'closing-zoom' : ''}`}>
      <div className="encounter-backdrop" />

      {/* 3D Scene */}
      {!isTransitioning && (
        <div className="encounter-3d-scene">
          <CanvasErrorBoundary onError={handleCanvasError}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <Suspense fallback={<LoadingFallback />}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} color="#E8E0FF" />
                <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#4ECDC4" />
                <hemisphereLight args={['#1a1a4e', '#0a0a1a', 0.5]} />

                {/* Target Model */}
                {(!encounterResult || encounterResult === 'missed') && (
                  <CreatureModel 
                    url={modelUrl} 
                    scale={creature.modelScale ?? 2.5} 
                    position={[creature.modelX ?? 0, creature.modelY ?? 0, creature.modelZ ?? -3]} 
                    onBoundsComputed={handleBoundsComputed} 
                  />
                )}

                {/* Shadows */}
                <ContactShadows position={[0, -2, -3]} opacity={0.4} scale={5} blur={2} />

                {/* Ground Visualization */}
                {encounterPhysics.showGround && (
                  <mesh renderOrder={-1} rotation={[-Math.PI / 2, 0, 0]} position={[0, encounterPhysics.groundY, -3]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial 
                      color={encounterPhysics.groundColor} 
                      transparent 
                      opacity={encounterPhysics.groundOpacity ?? 0.8} 
                      metalness={encounterPhysics.groundMetalness ?? 0.1}
                      roughness={encounterPhysics.groundRoughness ?? 0.8}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                )}

                {/* Ball */}
                {(!encounterResult || encounterResult === 'missed') && (
                  <ThrowBall
                    key={throwKey}
                    gesture={gesture}
                    onHit={handleHit}
                    onMiss={handleMiss}
                    creatureBounds={creatureBoundsRef}
                    ballInFlightRef={ballInFlightRef}
                    creatureZ={creature.modelZ ?? -3}
                    creatureY={creature.modelY ?? 0}
                  />
                )}
              </Suspense>
            </Canvas>
          </CanvasErrorBoundary>
        </div>
      )}

      {/* Gesture capture overlay (DOM layer, covers full screen for dragging from anywhere) */}
      {!isTransitioning && !encounterResult && (
        <div
          className="encounter-gesture-area"
          {...bind()}
          style={{ position: 'absolute', inset: 0, height: '100%', zIndex: 15, touchAction: 'none', cursor: 'grab' }}
        />
      )}

      {/* Loading indicator */}
      {isTransitioning && !isClosing && (
        <div className="encounter-loading">
          <div className="encounter-loading-spinner" />
          <p>Approaching {creature.name}...</p>
        </div>
      )}

      {/* Flash */}
      {showFlash && <div className="encounter-flash" />}

      {/* UI Overlay */}
      {sceneReady && !isTransitioning && (
        <div className="encounter-content-3d">
          <div className="encounter-header-info">
            <h2 className="encounter-name">{creature.name}</h2>
            <div className="encounter-meta">
              <span className={`encounter-rarity rarity-tag-${creature.rarity}`}>{rarityLabel}</span>
              <span className="encounter-type">{creature.type}</span>
              <span className="encounter-cp">CP {cp}</span>
            </div>
          </div>

          {!encounterResult && gesture.phase === 'idle' && (
            <div className="encounter-prompt">
              Swipe to throw!
            </div>
          )}

          <div className="encounter-bottom-area">
            {encounterResult && (
              <div className={`encounter-result result-${encounterResult}`}>
                {encounterResult === 'caught' && (
                  <>
                    <Icon icon="ph:confetti-duotone" className="result-icon" />
                    <span className="result-text">Gotcha! {creature.name} was caught!</span>
                  </>
                )}
                {encounterResult === 'fled' && (
                  <>
                    <Icon icon="ph:wind-duotone" className="result-icon" />
                    <span className="result-text">{creature.name} fled!</span>
                  </>
                )}
                {encounterResult === 'missed' && (
                  <>
                    <Icon icon="ph:x-circle-duotone" className="result-icon" />
                    <span className="result-text">Missed! Try again!</span>
                  </>
                )}
              </div>
            )}

            <div className="encounter-actions-3d">
              {(encounterResult === 'caught' || encounterResult === 'fled') && (
                <button className="close-btn" onClick={handleClose}>
                  Continue
                </button>
              )}
              {(!encounterResult || encounterResult === 'missed') && (
                <button className="run-btn" onClick={handleClose}>
                  Run Away
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
