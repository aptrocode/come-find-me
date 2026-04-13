import { useState, useCallback, useEffect, Suspense, Component, useMemo } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import { a, useSpring } from '@react-spring/three'
import { useDrag } from '@use-gesture/react'
import type { FullGestureState } from '@use-gesture/react'
import { ContactShadows, Center } from '@react-three/drei'
import { useGameStore } from '../../store/useGameStore'
import CreatureModel from './CreatureModel'
import BallModel from './BallModel'
import './EncounterScreen.css'

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
      <meshStandardMaterial color="#4ECDC4" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

// ─── Draggable Ball ────────────────────────────────────────────────
interface DraggableBallProps {
  onHit: () => void
}

function DraggableBall({ onHit }: DraggableBallProps) {
  const [isThrown, setIsThrown] = useState(false)
  const [{ position, scale }, api] = useSpring(() => ({
    position: [0, -1.1, 1] as [number, number, number],
    scale: [0.2, 0.2, 0.2] as [number, number, number],
  }))

  const bind = useDrag(({ down, movement: [mx, my] }: FullGestureState<'drag'>) => {
    if (isThrown) return

    if (down) {
      api.start({
        position: [mx * 0.005, -1.1 - my * 0.005, 1] as [number, number, number],
        scale: [0.3, 0.3, 0.3] as [number, number, number],
      })
    } else {
      if (my < -30) {
        // Thrown upwards
        setIsThrown(true)
        api.start({
          position: [mx * 0.01, -0.5, -3],
          scale: [0.2, 0.2, 0.2] as [number, number, number],
          config: { mass: 1, tension: 170, friction: 30 },
          onRest: () => {
            if (Math.abs(mx) > 250) {
              // WHIFF
              setTimeout(() => {
                api.start({
                  position: [0, -1.1, 1] as [number, number, number],
                  scale: [0.2, 0.2, 0.2] as [number, number, number],
                  immediate: true,
                })
                setIsThrown(false)
              }, 300)
            } else {
              onHit()
            }
          },
        })
      } else {
        // Snap back
        api.start({
          position: [0, -2.5, 1] as [number, number, number],
          scale: [0.5, 0.5, 0.5] as [number, number, number],
          config: { tension: 300, friction: 20 },
        })
      }
    }
  })

  const bindProps = (bind as unknown as (...args: unknown[]) => unknown)()

  return (
    <a.group
      {...(bindProps as ThreeElements['group'])}
      position={position as unknown as [number, number, number]}
      scale={scale as unknown as [number, number, number]}
    >
      <Center>
        <BallModel />
      </Center>
    </a.group>
  )
}

// ─── Main Component ────────────────────────────────────────────────
export default function EncounterScreen() {
  const { activeEncounter, encounterPhase, encounterResult, attemptCatch, resetThrow, closeEncounter, setEncounterPhase } = useGameStore()
  const [showFlash, setShowFlash] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [throwKey, setThrowKey] = useState(0)

  // Safety timeout: if stuck in "transitioning" for more than 4 seconds, force to "active"
  useEffect(() => {
    if (encounterPhase === 'transitioning') {
      const safety = setTimeout(() => {
        setEncounterPhase('active')
      }, 4000)
      return () => clearTimeout(safety)
    }
  }, [encounterPhase, setEncounterPhase])

  // Derive sceneReady from encounterPhase
  const sceneReady = useMemo(() => encounterPhase === 'active', [encounterPhase])

  const handleHit = useCallback(() => {
    setShowFlash(true)
    setTimeout(() => {
      setShowFlash(false)
      attemptCatch()
    }, 400)
  }, [attemptCatch])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      closeEncounter()
      setIsClosing(false)
    }, 400)
  }, [closeEncounter])

  const handleTryAgain = useCallback(() => {
    setThrowKey((k) => k + 1)
    resetThrow()
  }, [resetThrow])

  const handleCanvasError = useCallback(() => {
    // On error retry, just re-key the throwKey to remount
    setThrowKey((k) => k + 1)
  }, [])

  // Auto-respawn after a short delay if catch failed
  useEffect(() => {
    if (encounterResult === 'missed') {
      const timer = setTimeout(() => {
        handleTryAgain()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [encounterResult, handleTryAgain])

  if (!activeEncounter) return null

  const { creature, cp } = activeEncounter
  const rarityLabel = creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)
  const isTransitioning = encounterPhase !== 'active'

  // Determine which model URL to use
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
                {/* Use simple lights instead of heavy Environment preset */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} color="#E8E0FF" />
                <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#4ECDC4" />
                <hemisphereLight args={['#1a1a4e', '#0a0a1a', 0.5]} />

                {/* Target Model */}
                {(!encounterResult || encounterResult === 'missed') && (
                  <Center position={[0, 0.5, -3]}>
                    <CreatureModel url={modelUrl} scale={2} />
                  </Center>
                )}

                {/* Shadows */}
                <ContactShadows position={[0, -2, -3]} opacity={0.4} scale={5} blur={2} />

                {/* Throwing Ball */}
                {(!encounterResult || encounterResult === 'missed') && (
                  <DraggableBall key={throwKey} onHit={handleHit} />
                )}
              </Suspense>
            </Canvas>
          </CanvasErrorBoundary>
        </div>
      )}

      {/* Loading indicator during transition */}
      {isTransitioning && !isClosing && (
        <div className="encounter-loading">
          <div className="encounter-loading-spinner" />
          <p>Approaching {creature.name}...</p>
        </div>
      )}

      {/* White flash for catching impact */}
      {showFlash && <div className="encounter-flash" />}

      {/* UI Overlay */}
      {sceneReady && !isTransitioning && (
        <div className="encounter-content-3d">
          {/* Header Info */}
          <div className="encounter-header-info">
            <h2 className="encounter-name">{creature.name}</h2>
            <div className="encounter-meta">
              <span className={`encounter-rarity rarity-tag-${creature.rarity}`}>{rarityLabel}</span>
              <span className="encounter-type">{creature.type}</span>
              <span className="encounter-cp">CP {cp}</span>
            </div>
          </div>

          {/* Prompt */}
          {!encounterResult && (
            <div className="encounter-prompt">
              Swipe UP to throw the ball!
            </div>
          )}

          {/* Bottom Actions & Result */}
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
