import { useState, useCallback, useEffect, Suspense, Component, useMemo, useRef } from 'react'
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

// ─── Constants for the throw arc ──────────────────────────────────
const BALL_START_POS: [number, number, number] = [0, -1.0, 1]
const BALL_START_SCALE = 0.25
const BALL_MIN_SCALE = 0.06

const CREATURE_Z = -3
const CREATURE_Y = 0.5

// Fallback hit box if bounding box hasn't been computed yet
const FALLBACK_HIT_HALF_W = 0.4
const FALLBACK_HIT_HALF_H = 0.8
const FALLBACK_HIT_HALF_D = 0.3

const GRAVITY = 9.8          // Realistic gravity for natural arc
const SPIN_SPEED = 10.0

const OOB_Z_MIN = -6
const OOB_X_MAX = 5

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
  // throw velocity (pixels/ms)
  vx: number
  vy: number
  // throw direction
  dx: number
  // sequence counter to trigger new throws
  seq: number
}

// ─── ThrowBall (inside Canvas) ────────────────────────────────────
interface ThrowBallProps {
  gesture: GestureData
  onHit: () => void
  onMiss: () => void
  creatureBounds: React.RefObject<CreatureBounds | null>
  ballInFlightRef: React.RefObject<boolean>
}

function ThrowBall({ gesture, onHit, onMiss, creatureBounds, ballInFlightRef }: ThrowBallProps) {
  const groupRef = useRef<THREE.Group>(null)
  const phase = useRef<BallPhase>('idle')
  const velocity = useRef({ x: 0, y: 0, z: 0 })
  const pos = useRef({ x: BALL_START_POS[0], y: BALL_START_POS[1], z: BALL_START_POS[2] })
  const scale = useRef(BALL_START_SCALE)
  const spin = useRef(0)
  const resolved = useRef(false)
  const bounceCount = useRef(0)
  const lastSeq = useRef(-1)
  const flightTime = useRef(0) // Track how long ball has been in the air

  const { encounterPhysics } = useAdminStore()
  const { camera, size } = useThree()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)

    // ── Detect new throw ──
    if (gesture.seq !== lastSeq.current && gesture.phase === 'thrown') {
      lastSeq.current = gesture.seq

      // Swipe power from gesture
      const speed = Math.sqrt(gesture.vx * gesture.vx + gesture.vy * gesture.vy)
      const clampedSpeed = Math.min(Math.max(speed, 0.3), 3.0)
      const power = clampedSpeed * encounterPhysics.throwMultiplier

      // ── Pokemon GO-style: launch from CURRENT position (wherever the ball was dragged) ──
      const launchX = pos.current.x
      const launchY = pos.current.y
      const launchZ = pos.current.z

      // Target position (creature center)
      const targetX = 0
      const targetY = CREATURE_Y
      const targetZ = CREATURE_Z

      // Distance to travel from current position
      const dz = targetZ - launchZ
      const dy = targetY - launchY
      const dx = targetX - launchX

      // Flight duration: shorter for strong swipes, longer for weak
      const tFlight = THREE.MathUtils.lerp(1.0, 0.4, Math.min(power, 1.0))

      // Compute initial velocities using projectile motion:
      //   position = start + v*t + 0.5*a*t²
      //   v = (target - start - 0.5*a*t²) / t
      const vz = dz / tFlight
      const vy_initial = (dy + 0.5 * GRAVITY * tFlight * tFlight) / tFlight

      // Horizontal: aim toward creature center + curve ball swerve from swipe direction
      const swerve = gesture.dx * clampedSpeed * 0.8
      const vx_initial = dx / tFlight + swerve

      velocity.current = {
        x: vx_initial,
        y: vy_initial,
        z: vz
      }

      // Keep position where it is (don't reset to center!)
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
      // Proper pixel-to-world conversion using camera projection math
      // Distance from camera (z=5) to ball plane (z=1) = 4
      const distToBall = camera.position.z - BALL_START_POS[2]
      const fov = (camera as THREE.PerspectiveCamera).fov
      const halfFovRad = THREE.MathUtils.degToRad(fov / 2)
      // World-space height visible at the ball's z-depth
      const worldHeight = 2 * distToBall * Math.tan(halfFovRad)
      const worldWidth = worldHeight * (size.width / size.height)
      // Pixels to world units
      const pxToWorldX = worldWidth / size.width
      const pxToWorldY = worldHeight / size.height
      // Apply drag multiplier as a fine-tune knob (normalized to default 0.015)
      const dragScale = encounterPhysics.dragMultiplier / 0.015
      pos.current.x = BALL_START_POS[0] + gesture.mx * pxToWorldX * dragScale
      pos.current.y = BALL_START_POS[1] + (-gesture.my) * pxToWorldY * dragScale
      pos.current.z = BALL_START_POS[2]
      scale.current = BALL_START_SCALE * 1.1
    }

    // ── Handle snap-back to idle ──
    if (gesture.phase === 'idle' && phase.current === 'dragging') {
      phase.current = 'idle'
    }

    // ── Physics update ──
    if (phase.current === 'idle') {
      pos.current.x = BALL_START_POS[0]
      pos.current.y = BALL_START_POS[1]
      pos.current.z = BALL_START_POS[2]
      scale.current = BALL_START_SCALE
      spin.current = 0
      bounceCount.current = 0
      flightTime.current = 0
      ballInFlightRef.current = false
    } else if (phase.current === 'thrown') {
      flightTime.current += dt

      // Apply gravity to Y velocity
      velocity.current.y -= GRAVITY * dt

      // Update position
      pos.current.x += velocity.current.x * dt
      pos.current.y += velocity.current.y * dt
      pos.current.z += velocity.current.z * dt

      // Spin animation (rolls forward + sideways based on swerve)
      spin.current += SPIN_SPEED * dt

      // Perspective scale: shrink as ball goes deeper into the scene
      const totalZ = BALL_START_POS[2] - CREATURE_Z
      const progress = Math.max(0, Math.min(1, (BALL_START_POS[2] - pos.current.z) / totalZ))
      scale.current = THREE.MathUtils.lerp(BALL_START_SCALE, BALL_MIN_SCALE, progress)

      // ── Hit detection using actual 3D model bounding box ──
      const bounds = creatureBounds.current
      const hw = bounds ? bounds.halfWidth : FALLBACK_HIT_HALF_W
      const hh = bounds ? bounds.halfHeight : FALLBACK_HIT_HALF_H
      const hd = bounds ? bounds.halfDepth : FALLBACK_HIT_HALF_D
      const cY = bounds ? bounds.centerY : CREATURE_Y

      // Check if ball is within the creature's z-depth range
      const inHitZone = pos.current.z <= CREATURE_Z + hd && pos.current.z >= CREATURE_Z - hd
      if (!resolved.current && inHitZone) {
        // Box-based hit: check if ball x,y falls within creature's width & height
        const withinX = Math.abs(pos.current.x) <= hw
        const withinY = Math.abs(pos.current.y - cY) <= hh

        if (withinX && withinY) {
          resolved.current = true
          // Snap ball to creature center for satisfying visual
          pos.current = { x: 0, y: cY, z: CREATURE_Z }
          groupRef.current.position.set(0, cY, CREATURE_Z)
          phase.current = 'idle'
          onHit()
          return
        }
      }
      // Mark as missed once ball flies past the hit zone
      if (!resolved.current && pos.current.z < CREATURE_Z - hd) {
        resolved.current = true
        // Ball flew past creature without hitting — continue flying
      }

      // ── Ground bounce ──
      const groundY = encounterPhysics.groundY
      if (pos.current.y <= groundY && velocity.current.y < 0) {
        if (bounceCount.current < 2) {
          pos.current.y = groundY
          velocity.current.y = -velocity.current.y * 0.4 // Damped bounce
          velocity.current.x *= 0.6 // Slow down laterally
          velocity.current.z *= 0.7 // Slow forward too
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
        flightTime.current > 3.0 // Safety timeout
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
    // Rolling spin that looks natural
    groupRef.current.rotation.set(spin.current * 0.7, spin.current * 0.2, spin.current * 0.5)
  })

  return (
    <group
      ref={groupRef}
      position={BALL_START_POS}
      scale={[BALL_START_SCALE, BALL_START_SCALE, BALL_START_SCALE]}
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
    phase: 'idle', mx: 0, my: 0, vx: 0, vy: 0, dx: 0, seq: 0
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
  const bind = useDrag(({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
    if (encounterResult) return // Don't allow throwing during result display
    if (ballInFlightRef.current) return // Block interaction while ball is in the air

    if (down) {
      setGesture(g => ({ ...g, phase: 'dragging', mx, my }))
    } else {
      const swipeUp = dy < 0 && Math.abs(my) > 20

      if (swipeUp) {
        seqRef.current++
        setGesture({
          phase: 'thrown',
          mx: 0, my: 0,
          vx, vy,
          dx,
          seq: seqRef.current,
        })
      } else {
        setGesture(g => ({ ...g, phase: 'idle', mx: 0, my: 0 }))
      }
    }
  }, {
    threshold: 0,           // Start tracking immediately
    pointer: { touch: true }, // Ensure touch works
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
    setGesture({ phase: 'idle', mx: 0, my: 0, vx: 0, vy: 0, dx: 0, seq: seqRef.current })
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
                  <Center position={[0, 0.5, -3]}>
                    <CreatureModel url={modelUrl} scale={2} onBoundsComputed={handleBoundsComputed} />
                  </Center>
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

          {!encounterResult && (
            <div className="encounter-prompt">
              Swipe to throw!
            </div>
          )}

          <div className="encounter-bottom-area">
            {encounterResult && (
              <div className={`encounter-result result-${encounterResult}`}>
                {encounterResult === 'caught' && (
                  <>
                    <span className="result-icon">🎉</span>
                    <span className="result-text">Gotcha! {creature.name} was caught!</span>
                  </>
                )}
                {encounterResult === 'fled' && (
                  <>
                    <span className="result-icon">💨</span>
                    <span className="result-text">{creature.name} fled!</span>
                  </>
                )}
                {encounterResult === 'missed' && (
                  <>
                    <span className="result-icon">❌</span>
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
