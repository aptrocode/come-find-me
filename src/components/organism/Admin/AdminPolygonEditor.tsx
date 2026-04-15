import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Icon } from '@iconify/react'
import { MAPBOX_CONFIG } from '../../../config/mapbox'
import type { Position } from '../../../types'
import './AdminPolygonEditor.css'

interface AdminPolygonEditorProps {
  polygon: Position[]
  color: string
  opacity: number
  onChange: (poly: Position[]) => void
}

export default function AdminPolygonEditor({ polygon, color, opacity, onChange }: AdminPolygonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const polygonRef = useRef(polygon)
  const onChangeRef = useRef(onChange)
  const [mapReady, setMapReady] = useState(false)
  
  // Keep refs up to date to avoid stale closures and unnecessary re-renders
  useEffect(() => {
    polygonRef.current = polygon
    onChangeRef.current = onChange
  }, [polygon, onChange])

  // Initialization
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_CONFIG.style,
      center: polygonRef.current.length > 0 
        ? [polygonRef.current[0].lng, polygonRef.current[0].lat] 
        : [106.8271528, -6.175110],
      zoom: 16,
      attributionControl: false,
    })

    map.on('load', () => {
      // Add Sources
      map.addSource('polygon-area', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
      map.addSource('polygon-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })

      // Add Layers
      map.addLayer({
        id: 'polygon-fill',
        type: 'fill',
        source: 'polygon-area',
        paint: {
          'fill-color': color,
          'fill-opacity': opacity
        }
      })
      map.addLayer({
        id: 'polygon-line',
        type: 'line',
        source: 'polygon-area',
        paint: {
          'line-color': color,
          'line-width': 3
        }
      })
      map.addLayer({
        id: 'polygon-nodes',
        type: 'circle',
        source: 'polygon-points',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF6B35',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Click to add point
      map.on('click', (e) => {
        const newPoint: Position = {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
          timestamp: Date.now()
        }
        onChangeRef.current([...polygonRef.current, newPoint])
      })

      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [color, opacity]) // Re-running setup when dependencies change is safe due to 'mapRef.current' check.

  // Update Geometry whenever polygon prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    try {
      const areaSource = map.getSource('polygon-area') as mapboxgl.GeoJSONSource
      const pointsSource = map.getSource('polygon-points') as mapboxgl.GeoJSONSource

      if (!areaSource || !pointsSource) return

      // Points GeoJSON
      pointsSource.setData({
        type: 'FeatureCollection',
        features: polygon.map((p, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { index: i }
        }))
      })

      // Polygon GeoJSON (needs at least 3 points to fill, 2 to draw line)
      if (polygon.length >= 2) {
        const coords = polygon.map(p => [p.lng, p.lat])
        if (polygon.length >= 3) {
          coords.push([...coords[0]]) // Close the polygon for mapbox
        }
        
        const isPolygon = polygon.length >= 3;
        const geometry = isPolygon 
          ? { type: 'Polygon' as const, coordinates: [coords] as number[][][] }
          : { type: 'LineString' as const, coordinates: coords as number[][] };

        areaSource.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry,
            properties: {}
          }]
        })
      } else {
        areaSource.setData({ type: 'FeatureCollection', features: [] })
      }

      // Update layer colors (on search or prop change)
      if (map.getLayer('polygon-fill')) {
        map.setPaintProperty('polygon-fill', 'fill-color', color || '#4ecdc4')
        map.setPaintProperty('polygon-fill', 'fill-opacity', opacity ?? 0.2)
      }
      if (map.getLayer('polygon-line')) {
        map.setPaintProperty('polygon-line', 'line-color', color || '#4ecdc4')
      }
    } catch (err) {
      console.warn("Map update error", err)
    }
  }, [polygon, color, opacity, mapReady]) // Important to track polygon, color and opacity changes!

  const handleFlyToMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.")
    navigator.geolocation.getCurrentPosition((pos) => {
       mapRef.current?.flyTo({
         center: [pos.coords.longitude, pos.coords.latitude],
         zoom: 17
       })
    }, () => alert("Gagal mengambil lokasi GPS."))
  }

  const handleUndo = () => {
    if (polygon.length === 0) return
    const newPoly = [...polygon]
    newPoly.pop()
    onChange(newPoly)
  }

  const handleClear = () => {
    if (confirm("Reset seluruh batas area ini?")) {
      onChange([])
    }
  }

  return (
    <div className="admin-polygon-editor">
      <div className="editor-map" ref={containerRef} />
      <div className="editor-controls">
        <button onClick={handleUndo} disabled={polygon.length === 0} className="btn-secondary btn-mini">
          <Icon icon="ph:arrow-u-up-left-bold" /> Undo Ke Belakang
        </button>
        <button onClick={handleClear} disabled={polygon.length === 0} className="btn-secondary btn-mini" style={{ color: '#FF6B35' }}>
          <Icon icon="ph:trash-duotone" /> Hapus Semua
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={handleFlyToMe} className="btn-primary btn-mini">
          <Icon icon="ph:crosshair-bold" /> Cari Lokasiku
        </button>
      </div>
      <div className="editor-stats">
        Titik Node: {polygon.length} {polygon.length < 3 && "(Min. 3 node untuk membentuk area)"}
      </div>
      <div className="editor-hint">
        💡 Klik bebas di map untuk membuat garis batas terluar area event Anda.
      </div>
    </div>
  )
}
