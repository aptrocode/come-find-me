import { create } from 'zustand'
import type { Creature } from '../types'
import { CREATURES } from '../config/creatures'
import {
  SPAWN_RADIUS_MIN, SPAWN_RADIUS_MAX, MAX_ACTIVE_SPAWNS,
  SPAWN_INTERVAL, SPAWN_LIFETIME, ENCOUNTER_RANGE, DESPAWN_RANGE,
  RARITY_WEIGHTS, CP_VARIANCE, CATCH_FLEE_THRESHOLD,
  XP_PER_CATCH, XP_PER_FLEE,
  BALL_THROW_THRESHOLD, BALL_DRAG_MULTIPLIER, BALL_THROW_MULTIPLIER,
  BALL_MASS, BALL_TENSION, BALL_FRICTION, BALL_WHIFF_THRESHOLD
} from '../config/constants'

// ─── Types ─────────────────────────────────────────────────────────
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
}

export interface DebugSettings {
  creatures: boolean
  spawn: boolean
  rarity: boolean
  catch: boolean
  physics: boolean
}

interface AdminStore {
  // Data
  creatures: Creature[]
  spawnConfig: SpawnConfig
  rarityWeights: RarityWeights
  catchConfig: CatchConfig
  encounterPhysics: EncounterPhysicsConfig
  debugSettings: DebugSettings

  // Creature CRUD
  addCreature: (creature: Creature) => void
  updateCreature: (id: string, updates: Partial<Creature>) => void
  deleteCreature: (id: string) => void

  // Config setters
  setSpawnConfig: (config: Partial<SpawnConfig>) => void
  setRarityWeights: (weights: Partial<RarityWeights>) => void
  setCatchConfig: (config: Partial<CatchConfig>) => void
  setEncounterPhysics: (config: Partial<EncounterPhysicsConfig>) => void
  setDebugSettings: (settings: Partial<DebugSettings>) => void

  // Reset
  resetToDefaults: () => void
  resetCreatures: () => void
  resetSpawnConfig: () => void
  resetRarityWeights: () => void
  resetCatchConfig: () => void
  resetEncounterPhysics: () => void

  // Persistence
  loadAdminConfig: () => void
}

async function saveAdminConfig(state: {
  creatures: Creature[]
  spawnConfig: SpawnConfig
  rarityWeights: RarityWeights
  catchConfig: CatchConfig
  encounterPhysics: EncounterPhysicsConfig
  debugSettings: DebugSettings
}) {
  try {
    await fetch('/api/admin-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    })
  } catch (err) {
    console.warn('Failed to save admin config to server', err)
  }
}

async function loadAdminConfigFromServer(): Promise<Partial<{
  creatures: Creature[]
  spawnConfig: SpawnConfig
  rarityWeights: RarityWeights
  catchConfig: CatchConfig
  encounterPhysics: EncounterPhysicsConfig
  debugSettings: DebugSettings
}> | null> {
  try {
    const res = await fetch('/api/admin-config')
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch {
    return null
  }
}


// ─── Defaults ───────────────────────────────────────────────────────
const defaultSpawnConfig: SpawnConfig = {
  spawnRadiusMin: SPAWN_RADIUS_MIN,
  spawnRadiusMax: SPAWN_RADIUS_MAX,
  maxActiveSpawns: MAX_ACTIVE_SPAWNS,
  spawnInterval: SPAWN_INTERVAL,
  spawnLifetime: SPAWN_LIFETIME,
  encounterRange: ENCOUNTER_RANGE,
  despawnRange: DESPAWN_RANGE,
}

const defaultRarityWeights: RarityWeights = {
  common: RARITY_WEIGHTS.common,
  uncommon: RARITY_WEIGHTS.uncommon,
  rare: RARITY_WEIGHTS.rare,
  legendary: RARITY_WEIGHTS.legendary,
}

const defaultCatchConfig: CatchConfig = {
  catchFleeThreshold: CATCH_FLEE_THRESHOLD,
  cpVariance: CP_VARIANCE,
  xpPerCatch: XP_PER_CATCH,
  xpPerFlee: XP_PER_FLEE,
}

const defaultEncounterPhysics: EncounterPhysicsConfig = {
  throwThreshold: BALL_THROW_THRESHOLD,
  dragMultiplier: BALL_DRAG_MULTIPLIER,
  throwMultiplier: BALL_THROW_MULTIPLIER,
  mass: BALL_MASS,
  tension: BALL_TENSION,
  friction: BALL_FRICTION,
  whiffThreshold: BALL_WHIFF_THRESHOLD,
}

const defaultDebugSettings: DebugSettings = {
  creatures: false,
  spawn: false,
  rarity: false,
  catch: false,
  physics: false,
}

// ─── Store ──────────────────────────────────────────────────────────
export const useAdminStore = create<AdminStore>((set) => ({
  creatures: [...CREATURES],
  spawnConfig: { ...defaultSpawnConfig },
  rarityWeights: { ...defaultRarityWeights },
  catchConfig: { ...defaultCatchConfig },
  encounterPhysics: { ...defaultEncounterPhysics },
  debugSettings: { ...defaultDebugSettings },

  addCreature: (creature) => {
    set((s) => {
      const updated = { ...s, creatures: [...s.creatures, creature] }
      saveAdminConfig(updated)
      return { creatures: updated.creatures }
    })
  },

  updateCreature: (id, updates) => {
    set((s) => {
      const creatures = s.creatures.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
      saveAdminConfig({ ...s, creatures })
      return { creatures }
    })
  },

  deleteCreature: (id) => {
    set((s) => {
      const creatures = s.creatures.filter((c) => c.id !== id)
      saveAdminConfig({ ...s, creatures })
      return { creatures }
    })
  },

  setSpawnConfig: (config) => {
    set((s) => {
      const spawnConfig = { ...s.spawnConfig, ...config }
      saveAdminConfig({ ...s, spawnConfig })
      return { spawnConfig }
    })
  },

  setRarityWeights: (weights) => {
    set((s) => {
      const rarityWeights = { ...s.rarityWeights, ...weights }
      saveAdminConfig({ ...s, rarityWeights })
      return { rarityWeights }
    })
  },

  setCatchConfig: (config) => {
    set((s) => {
      const catchConfig = { ...s.catchConfig, ...config }
      saveAdminConfig({ ...s, catchConfig })
      return { catchConfig }
    })
  },

  setEncounterPhysics: (config) => {
    set((s) => {
      const encounterPhysics = { ...s.encounterPhysics, ...config }
      saveAdminConfig({ ...s, encounterPhysics })
      return { encounterPhysics }
    })
  },

  setDebugSettings: (settings) => {
    set((s) => {
      const debugSettings = { ...s.debugSettings, ...settings }
      saveAdminConfig({ ...s, debugSettings })
      return { debugSettings }
    })
  },

  resetCreatures: () => {
    set((s) => {
      const creatures = [...CREATURES]
      saveAdminConfig({ ...s, creatures })
      return { creatures }
    })
  },

  resetSpawnConfig: () => {
    set((s) => {
      const spawnConfig = { ...defaultSpawnConfig }
      saveAdminConfig({ ...s, spawnConfig })
      return { spawnConfig }
    })
  },

  resetRarityWeights: () => {
    set((s) => {
      const rarityWeights = { ...defaultRarityWeights }
      saveAdminConfig({ ...s, rarityWeights })
      return { rarityWeights }
    })
  },

  resetCatchConfig: () => {
    set((s) => {
      const catchConfig = { ...defaultCatchConfig }
      saveAdminConfig({ ...s, catchConfig })
      return { catchConfig }
    })
  },

  resetEncounterPhysics: () => {
    set((s) => {
      const encounterPhysics = { ...defaultEncounterPhysics }
      saveAdminConfig({ ...s, encounterPhysics })
      return { encounterPhysics }
    })
  },

  resetToDefaults: () => {
    const defaults = {
      creatures: [...CREATURES],
      spawnConfig: { ...defaultSpawnConfig },
      rarityWeights: { ...defaultRarityWeights },
      catchConfig: { ...defaultCatchConfig },
      encounterPhysics: { ...defaultEncounterPhysics },
      debugSettings: { ...defaultDebugSettings },
    }
    saveAdminConfig(defaults)
    set(defaults)
  },

  loadAdminConfig: async () => {
    const saved = await loadAdminConfigFromServer()
    if (saved) {
      set({
        creatures: saved.creatures ?? [...CREATURES],
        spawnConfig: saved.spawnConfig ? { ...defaultSpawnConfig, ...saved.spawnConfig } : { ...defaultSpawnConfig },
        rarityWeights: saved.rarityWeights ? { ...defaultRarityWeights, ...saved.rarityWeights } : { ...defaultRarityWeights },
        catchConfig: saved.catchConfig ? { ...defaultCatchConfig, ...saved.catchConfig } : { ...defaultCatchConfig },
        encounterPhysics: saved.encounterPhysics ? { ...defaultEncounterPhysics, ...saved.encounterPhysics } : { ...defaultEncounterPhysics },
        debugSettings: saved.debugSettings ? { ...defaultDebugSettings, ...saved.debugSettings } : { ...defaultDebugSettings },
      })
    }
  },
}))
