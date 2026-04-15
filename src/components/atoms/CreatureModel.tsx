import { useGLTF } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { KTX2Loader, MeshoptDecoder } from 'three-stdlib'

// ─── Singleton Loader Store ───────────────────────────────────────
// We keep these outside to prevent multiple worker pools and memory leaks
// We initialize it immediately so we don't violate React's purity rules by reassigning it during render.
const sharedKtx2Loader = new KTX2Loader().setTranscoderPath('/basis/')

export interface CreatureBounds {
  halfWidth: number   // half-extent in X (left-right)
  halfHeight: number  // half-extent in Y (up-down)
  halfDepth: number   // half-extent in Z (front-back)
  centerY: number     // world-space center Y of the model
}

interface CreatureModelProps {
  url: string
  scale?: number
  position?: [number, number, number]
  onBoundsComputed?: (bounds: CreatureBounds) => void
}

export default function CreatureModel({ url, onBoundsComputed, ...props }: CreatureModelProps) {
  const gl = useThree((state) => state.gl)
  
  // Memoize the loader setup to avoid re-initializing on every render
  const ktx2 = useMemo(() => {
    sharedKtx2Loader.detectSupport(gl)
    return sharedKtx2Loader
  }, [gl])

  // Configure DRACO, KTX2 and Meshopt decoders from local public folder
  const { scene } = useGLTF(url, '/draco/', undefined, (loader) => {
    loader.setKTX2Loader(ktx2)
    loader.setMeshoptDecoder(MeshoptDecoder)
  })
  
  const group = useRef<THREE.Group>(null)
  const boundsComputed = useRef(false)

  // Compute world-space bounding box on the first rendered frame
  // (after Center and all parent transforms have been applied)
  useFrame(() => {
    if (group.current && !boundsComputed.current && onBoundsComputed) {
      // Update world matrices to include Center's repositioning
      group.current.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(group.current)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)

      onBoundsComputed({
        halfWidth: size.x / 2,
        halfHeight: size.y / 2,
        halfDepth: size.z / 2,
        centerY: center.y,
      })
      boundsComputed.current = true
    }
  })

  return (
    <group ref={group} dispose={null} scale={props.scale} position={props.position}>
      <primitive object={scene.clone()} />
    </group>
  )
}
