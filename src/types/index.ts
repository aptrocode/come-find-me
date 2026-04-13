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
  modelUrl?: string    // Path to GLB model (e.g. '/models/bikini-girl.glb')
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

