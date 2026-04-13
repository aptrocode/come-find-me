import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_CONFIG } from '../config/mapbox'
import type { Position } from '../types'

interface UseMapboxOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  position: Position | null
}

export function useMapbox({ containerRef, position }: UseMapboxOptions) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const initializedRef = useRef(false)

  // Initialize map once we have a position and container
  useEffect(() => {
    if (initializedRef.current || !containerRef.current || !position) return

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_CONFIG.style,
      center: [position.lng, position.lat],
      zoom: MAPBOX_CONFIG.defaultZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      pitch: 60, // Initial tilt for 3D perspective
      bearing: 0, // Initial rotation
      pitchWithRotate: MAPBOX_CONFIG.pitchEnabled,
      dragRotate: MAPBOX_CONFIG.rotateEnabled,
      touchPitch: MAPBOX_CONFIG.pitchEnabled,
      attributionControl: false,
    })

    // Set atmosphere and dusk lighting to make it look like a game
    map.on('style.load', () => {
      map.setConfigProperty('basemap', 'lightPreset', 'dusk')
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      setMapReady(true)
    })

    mapRef.current = map
    initializedRef.current = true

    return () => {
      map.remove()
      mapRef.current = null
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, !!position])

  return { map: mapRef.current, mapReady }
}
