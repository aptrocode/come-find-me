export interface Position {
  lat: number
  lng: number
  accuracy?: number
  timestamp: number
}

export type CreatureType = 'fire' | 'water' | 'grass' | 'electric' | 'dark' | 'normal'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Creature {
  id: string
  name: string
  type: CreatureType
  rarity: Rarity
  emoji: string
  baseCatchRate: number
  baseCP: number
  description: string
  color: string        // Theme color for UI
  modelX?: number      // Sprite X offset in 3D space
  modelY?: number      // Sprite Y offset in 3D space
  modelZ?: number      // Sprite Z offset (depth) in 3D space
  modelScale?: number  // Group scale multiplier
  sequenceUrl?: string // Path prefix for 2D image sequence (e.g. '/models/Gracie/webp/Gracie_')
  sequenceFrames?: number // Total frames in sequence
  sequenceFps?: number // Playback speed in frames per second
  sequenceScale?: number // Display size of the 2D sprite (distanceFactor for Html)
  sequenceFormat?: string // File extension: 'webp' or 'png'
  iconScale?: number // Scale multiplier for the map/inventory emoji icon (default 1.0)
}

export interface SpawnPoint {
  id: string
  creature: Creature
  position: Position
  spawnedAt: number
  expiresAt: number
  cp: number
  isDespawning?: boolean
}

export interface CaughtCreature {
  id: string
  creature: Creature
  cp: number
  caughtAt: number
  caughtLocation: Position
}

export interface PlayerState {
  name: string
  level: number
  xp: number
  xpToNext: number
  inventory: CaughtCreature[]
  totalCaught: number
  totalSeen: number
}

export type GameScreen = 'map' | 'inventory' | 'profile'
export type EncounterResult = 'caught' | 'fled' | 'missed' | null

// ─── Admin Configuration Types ─────────────────────────────────────

export interface SpawnConfig {
  spawnRadiusMin: number
  spawnRadiusMax: number
  maxActiveSpawns: number
  spawnInterval: number
  spawnLifetime: number
  encounterRange: number
  despawnRange: number
}

export interface RarityWeights {
  common: number
  uncommon: number
  rare: number
  legendary: number
}

export interface CatchConfig {
  catchFleeThreshold: number
  cpVariance: number
  xpPerCatch: number
  xpPerFlee: number
}

export interface EncounterPhysicsConfig {
  throwThreshold: number
  dragMultiplier: number
  throwMultiplier: number
  mass: number
  tension: number
  friction: number
  whiffThreshold: number
  groundY: number
  showGround: boolean
  groundColor: string
  groundOpacity: number
  groundMetalness: number
  groundRoughness: number
}

export interface DebugSettings {
  creatures: boolean
  spawn: boolean
  rarity: boolean
  catch: boolean
  physics: boolean
}

export interface EventAreaConfig {
  enabled: boolean
  polygon: Position[]
  color: string
  opacity: number
}

export interface MapConfig {
  defaultZoom: number
  defaultPitch: number
  defaultBearing: number
  styleUrl?: string
  lightPreset?: 'day' | 'dusk' | 'dawn' | 'night'
  showLabels?: boolean
  creatureMarkerScale?: number
}

export interface PlayerConfig {
  scale: number
  positionX: number
  positionY: number
  positionZ: number
  rotationX: number
  rotationY: number
  rotationZ: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: number
  saveData?: PlayerState | null
}

