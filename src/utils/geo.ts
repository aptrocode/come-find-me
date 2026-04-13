import type { Position } from '../types'

const EARTH_RADIUS = 6371000 // meters

/** Haversine distance between two positions in meters */
export function haversineDistance(a: Position, b: Position): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h))
}

/** Generate a random point within a given radius (meters) from center */
export function randomPointInRadius(center: Position, minRadius: number, maxRadius: number): Position {
  const radius = minRadius + Math.random() * (maxRadius - minRadius)
  const angle = Math.random() * 2 * Math.PI

  const dLat = (radius * Math.cos(angle)) / EARTH_RADIUS
  const dLng = (radius * Math.sin(angle)) / (EARTH_RADIUS * Math.cos(toRad(center.lat)))

  return {
    lat: center.lat + toDeg(dLat),
    lng: center.lng + toDeg(dLng),
    timestamp: Date.now(),
  }
}

/** Check if position B is within range (meters) of position A */
export function isWithinRange(a: Position, b: Position, range: number): boolean {
  return haversineDistance(a, b) <= range
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
