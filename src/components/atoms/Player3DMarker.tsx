import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { KTX2Loader, MeshoptDecoder } from 'three-stdlib'

const sharedKtx2Loader = new KTX2Loader().setTranscoderPath('/basis/')

interface AnimatedModelProps {
  url: string
  heading: number
  scale?: number
  positionX?: number
  positionY?: number
  positionZ?: number
}

function AnimatedModel({ url, heading, scale = 2, positionX = 0, positionY = -1, positionZ = 0 }: AnimatedModelProps) {
  const group = useRef<THREE.Group>(null)
  const gl = useThree((state) => state.gl)
  
  const ktx2 = useMemo(() => {
    sharedKtx2Loader.detectSupport(gl)
    return sharedKtx2Loader
  }, [gl])

  const { scene, animations } = useGLTF(url, '/draco/', undefined, (loader) => {
    loader.setKTX2Loader(ktx2)
    loader.setMeshoptDecoder(MeshoptDecoder)
  })
  const { actions } = useAnimations(animations, group)

  // Play the first animation if it exists (e.g. walking/idle)
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstActionKey = Object.keys(actions)[0]
      actions[firstActionKey]?.play()
    }
  }, [actions])

  useFrame(() => {
    if (group.current) {
      // Mapbox bearing 0 is North.
      // In Three.js, positive Z is towards the viewer. If the model faces +Z by default,
      // we need to rotate it so it faces the heading direction.
      // We negate the heading and convert to radians.
      const targetRotation = -THREE.MathUtils.degToRad(heading)
      
      // Smoothly interpolate current rotation to target rotation
      // Using shortest path rotation
      let diff = targetRotation - group.current.rotation.y
      
      // Normalize difference to [-PI, PI]
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      
      group.current.rotation.y += diff * 0.1
    }
  })


  return (
    <group ref={group}>
      <primitive object={scene} scale={scale} position={[positionX, positionY, positionZ]} />
    </group>
  )
}

function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#e31e24" wireframe transparent opacity={0.5} />
    </mesh>
  )
}

export default function Player3DMarker({ 
  url, 
  heading, 
  scale = 2,
  positionX = 0,
  positionY = -1,
  positionZ = 0
}: { 
  url: string, 
  heading: number, 
  scale?: number,
  positionX?: number,
  positionY?: number,
  positionZ?: number
}) {
  return (
    <div style={{ width: 250, height: 250, transform: 'translate(-50%, -70%)', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 2, 7], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
        <Suspense fallback={<LoadingFallback />}>
          <AnimatedModel 
            url={url} 
            heading={heading} 
            scale={scale} 
            positionX={positionX}
            positionY={positionY}
            positionZ={positionZ}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
