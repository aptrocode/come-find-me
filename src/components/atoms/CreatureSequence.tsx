import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { CreatureBounds } from './CreatureModel'

interface CreatureSequenceProps {
  sequenceUrl: string
  sequenceFrames: number
  sequenceFps: number
  sequenceScale?: number // controls physical width of the sprite in 3D units
  sequenceFormat?: string // file extension: 'webp' or 'png'
  scale?: number
  position?: [number, number, number]
  onBoundsComputed?: (bounds: CreatureBounds) => void
}

export default function CreatureSequence({
  sequenceUrl,
  sequenceFrames,
  sequenceFps,
  sequenceScale = 1.2,
  sequenceFormat = 'webp',
  scale = 1,
  position = [0, 0, 0],
  onBoundsComputed
}: CreatureSequenceProps) {
  const group = useRef<THREE.Group>(null)
  const boundsComputed = useRef(false)
  const frameIndex = useRef(0)
  const elapsed = useRef(0) // accumulator for delta-time based frame stepping
  const images = useRef<HTMLImageElement[]>([])
  
  // Dynamically calculate aspect ratio of the loaded sprites (height / width)
  const [aspectRatio, setAspectRatio] = useState(960 / 540) 

  const ext = sequenceFormat.replace(/^\./, '') // strip leading dot if present

  // Helper to resolve frame URL based on a template or fallback appending
  const getFrameUrl = (index: number) => {
    const padded = index.toString().padStart(5, '0')
    if (sequenceUrl.includes('{frame}')) {
      return `${sequenceUrl.replace('{frame}', padded)}.${ext}`
    }
    return `${sequenceUrl}${padded}.${ext}`
  }

  // Create a single WebGL texture initialized with a transparent 1x1 PNG data URL
  // generateMipmaps is disabled to prevent GL_INVALID_VALUE errors when
  // swapping the 1x1 placeholder for full-size frame images (sub-image
  // update dimension mismatch).
  const texture = useMemo(() => {
    const img = new Image()
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const tex = new THREE.Texture(img)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    img.onload = () => {
      tex.needsUpdate = true
    }
    return tex
  }, [])

  // Preload ALL frames into browser cache and store HTMLImageElement references
  useEffect(() => {
    images.current = []
    
    // Set initial placeholder frame
    const initialImg = new Image()
    initialImg.src = getFrameUrl(0)
    initialImg.onload = () => {
      if (frameIndex.current === 0 && initialImg.naturalWidth > 0) {
        texture.image = initialImg
        texture.needsUpdate = true
        // Set dynamic aspect ratio based on loaded image dimensions
        setAspectRatio(initialImg.naturalHeight / initialImg.naturalWidth)
      }
    }

    // Preload all frames
    for (let i = 0; i < sequenceFrames; i++) {
      const img = new Image()
      const url = getFrameUrl(i)
      img.onerror = () => {
        if (i === 0) console.warn(`[CreatureSequence] Failed to load image at: ${url}. Please check if the Sequence URL Prefix is correct!`)
      }
      img.src = url
      images.current.push(img)
    }
  }, [sequenceUrl, sequenceFrames, ext, texture])

  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps when tab regains focus
    const dt = Math.min(delta, 0.1)
    elapsed.current += dt

    const frameDuration = 1 / sequenceFps

    // Advance as many frames as needed to catch up (smooth looping)
    if (elapsed.current >= frameDuration) {
      const framesToAdvance = Math.floor(elapsed.current / frameDuration)
      elapsed.current -= framesToAdvance * frameDuration
      frameIndex.current = (frameIndex.current + framesToAdvance) % sequenceFrames
    }

    // Always ensure the texture shows the current frame if it's loaded
    const img = images.current[frameIndex.current]
    if (img && img.complete && img.naturalWidth > 0 && texture.image !== img) {
      texture.image = img
      texture.needsUpdate = true
      // Also fallback aspect ratio update if initial failed
      if (img.naturalHeight && img.naturalWidth) {
        const currentAspect = img.naturalHeight / img.naturalWidth
        if (Math.abs(aspectRatio - currentAspect) > 0.01) {
          setAspectRatio(currentAspect)
        }
      }
    }

    // Compute world-space bounding box based on the invisible geometry
    if (group.current && !boundsComputed.current && onBoundsComputed) {
      group.current.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(group.current)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)

      onBoundsComputed({
        halfWidth: size.x / 2,
        halfHeight: size.y / 2,
        halfDepth: 0.5, // Artificial depth for 2D hit detection
        centerY: center.y,
      })
      boundsComputed.current = true
    }
  })

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Invisible mesh for bounding box computation & physical collision sizing */}
      <mesh visible={false}>
        <boxGeometry args={[sequenceScale, sequenceScale * aspectRatio, 0.5]} />
      </mesh>

      {/* 2D Image Sequence rendered as a WebGL Texture on a Billboard plane */}
      <Billboard>
        <mesh>
          <planeGeometry args={[sequenceScale, sequenceScale * aspectRatio]} />
          <meshBasicMaterial 
            map={texture} 
            transparent={true} 
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </group>
  )
}
