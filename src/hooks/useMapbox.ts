import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_CONFIG } from '../config/mapbox'
import { useAdminStore } from '../store/useAdminStore'
import type { Position } from '../types'

interface UseMapboxOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  position: Position | null
}

export function useMapbox({ containerRef, position }: UseMapboxOptions) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const initializedRef = useRef(false)
  const { mapConfig } = useAdminStore()

  useEffect(() => {
    if (initializedRef.current || !containerRef.current || !position) return

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken

    const savedZoom = localStorage.getItem('fsm_last_zoom')
    const initialZoom = savedZoom ? parseFloat(savedZoom) : mapConfig.defaultZoom

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_CONFIG.style,
      center: [position.lng, position.lat],
      zoom: initialZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      pitch: mapConfig.defaultPitch, // Initial tilt for 3D perspective
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

    const { setLastZoom } = useAdminStore.getState()
    map.on('zoomend', () => {
      setLastZoom(map.getZoom())
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
