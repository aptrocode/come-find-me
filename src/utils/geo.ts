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

/** Check if a point is inside a polygon using ray-casting algorithm */
export function isPointInPolygon(point: Position, polygon: Position[]): boolean {
  if (polygon.length < 3) return false;
  
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    // Ray-cast algorithm
    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  
  return isInside;
}

/** Generate a random point strictly within a polygon */
export function randomPointInPolygon(polygon: Position[]): Position | null {
  if (polygon.length < 3) return null;

  // 1. Calculate bounding box
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const vertex of polygon) {
    if (vertex.lat < minLat) minLat = vertex.lat;
    if (vertex.lat > maxLat) maxLat = vertex.lat;
    if (vertex.lng < minLng) minLng = vertex.lng;
    if (vertex.lng > maxLng) maxLng = vertex.lng;
  }

  // 2. Roll random points inside the bounding box until one hits inside the polygon
  // Cap at 1000 iterations to prevent infinite loops if something goes terribly wrong
  for (let attempts = 0; attempts < 1000; attempts++) {
    const randPoint: Position = {
      lat: minLat + Math.random() * (maxLat - minLat),
      lng: minLng + Math.random() * (maxLng - minLng),
      timestamp: Date.now()
    };

    if (isPointInPolygon(randPoint, polygon)) {
      return randPoint;
    }
  }

  // Fallback if the algorithm fails to find a point
  return polygon[0];
}

/** Check if position B is within range (meters) of position A */
export function isWithinRange(a: Position, b: Position, range: number): boolean {
  return haversineDistance(a, b) <= range
}

/** Create a GeoJSON polygon representing a circle of radius meters around center */
export function createGeoJSONCircle(center: { lat: number, lng: number }, radiusInMeters: number, points = 64) {
  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos(center.lat * Math.PI / 180));
  const distanceY = km / 110.574;
  
  for(let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([center.lng + x, center.lat + y]);
  }
  ret.push(ret[0]);
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [ret] }
  };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
