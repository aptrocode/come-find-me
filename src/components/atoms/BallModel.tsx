import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

export default function BallModel(props: ThreeElements['group']) {
  const { scene } = useGLTF('/models/ball.glb')
  const group = useRef<THREE.Group>(null)

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/models/ball.glb')
