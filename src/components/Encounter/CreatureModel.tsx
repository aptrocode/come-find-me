import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

interface CreatureModelProps {
  url: string
  scale?: number
  position?: [number, number, number]
}

export default function CreatureModel({ url, ...props }: CreatureModelProps) {
  const { scene } = useGLTF(url)
  const group = useRef<THREE.Group>(null)

  return (
    <group ref={group} dispose={null} scale={props.scale} position={props.position}>
      <primitive object={scene.clone()} />
    </group>
  )
}
