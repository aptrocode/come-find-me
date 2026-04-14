import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'

export default function GirlModel(props: ThreeElements['group']) {
  const { scene } = useGLTF('/models/bikini-girl.glb')
  const group = useRef<THREE.Group>(null)

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/models/bikini-girl.glb')
