import { create } from 'zustand'
import type { 
  Creature, SpawnConfig, RarityWeights, CatchConfig, 
  EncounterPhysicsConfig, DebugSettings, EventAreaConfig, MapConfig, PlayerConfig 
} from '../types'

interface AdminState {
  creatures: Creature[]
  spawnConfig: SpawnConfig
  rarityWeights: RarityWeights
  catchConfig: CatchConfig
  encounterPhysics: EncounterPhysicsConfig
  debugSettings: DebugSettings
  eventArea: EventAreaConfig
  mapConfig: MapConfig
  playerConfig: PlayerConfig

  // Actions
  loadAdminConfig: () => Promise<void>
  saveAdminConfig: () => Promise<void>
  
  setCreatures: (creatures: Creature[]) => void
  addCreature: (creature: Creature) => void
  updateCreature: (id: string, creature: Creature) => void
  deleteCreature: (id: string) => void
  
  setSpawnConfig: (config: SpawnConfig) => void
  setRarityWeights: (weights: RarityWeights) => void
  setCatchConfig: (config: CatchConfig) => void
  setEncounterPhysics: (config: EncounterPhysicsConfig) => void
  setDebugSettings: (settings: DebugSettings) => void
  setEventArea: (area: EventAreaConfig) => void
  setMapConfig: (config: MapConfig) => void
  setPlayerConfig: (config: PlayerConfig) => void

  // Resets
  resetToDefaults: () => Promise<void>
  resetCreatures: () => void
  resetSpawnConfig: () => void
  resetRarityWeights: () => void
  resetCatchConfig: () => void
  resetEncounterPhysics: () => void
  resetEventArea: () => void
  resetMapConfig: () => void
  resetPlayerConfig: () => void
  setLastZoom: (zoom: number) => void
}

type AdminStateData = Pick<AdminState, 'creatures' | 'spawnConfig' | 'rarityWeights' | 'catchConfig' | 'encounterPhysics' | 'debugSettings' | 'eventArea' | 'mapConfig' | 'playerConfig'>

const DEFAULT_CONFIG: AdminStateData = {
  creatures: [],
  spawnConfig: {
    spawnRadiusMin: 5,
    spawnRadiusMax: 15,
    maxActiveSpawns: 5,
    spawnInterval: 12000,
    spawnLifetime: 300000,
    encounterRange: 8,
    despawnRange: 20
  },
  rarityWeights: {
    common: 60,
    uncommon: 25,
    rare: 12,
    legendary: 3
  },
  catchConfig: {
    catchFleeThreshold: 0.85,
    cpVariance: 0.3,
    xpPerCatch: 100,
    xpPerFlee: 25
  },
  encounterPhysics: {
    throwThreshold: -30,
    dragMultiplier: 0.015,
    throwMultiplier: 0.01,
    mass: 1,
    tension: 170,
    friction: 30,
    whiffThreshold: 250,
    groundY: -2.54,
    showGround: false,
    groundColor: "#4ecdc4",
    groundOpacity: 0.8,
    groundMetalness: 0.1,
    groundRoughness: 0.8
  },
  debugSettings: {
    creatures: false,
    spawn: false,
    rarity: false,
    catch: false,
    physics: false
  },
  eventArea: {
    enabled: false,
    polygon: [],
    color: "#3d5755",
    opacity: 0.72
  },
  mapConfig: {
    defaultZoom: 20,
    defaultPitch: 60,
    defaultBearing: 0,
    styleUrl: "mapbox://styles/mapbox/standard",
    lightPreset: "dusk",
    showLabels: true
  },
  playerConfig: {
    scale: 2,
    positionX: 0,
    positionY: -1,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0
  }
}

export const useAdminStore = create<AdminState>((set, get) => ({
  ...DEFAULT_CONFIG,

  loadAdminConfig: async () => {
    try {
      const res = await fetch('/api/admin-config')
      const data = await res.json()
      if (data) {
        set({ 
          ...data,
          playerConfig: {
            ...DEFAULT_CONFIG.playerConfig,
            ...(data.playerConfig || {})
          }
        })
      }
    } catch (e) {
      console.error('Failed to load admin config', e)
    }
  },

  saveAdminConfig: async () => {
    const { 
      creatures, spawnConfig, rarityWeights, catchConfig, 
      encounterPhysics, debugSettings, eventArea, mapConfig, playerConfig 
    } = get()
    
    try {
      await fetch('/api/admin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatures, spawnConfig, rarityWeights, catchConfig, 
          encounterPhysics, debugSettings, eventArea, mapConfig, playerConfig
        })
      })
    } catch (e) {
      console.error('Failed to save admin config', e)
    }
  },

  setCreatures: (creatures) => { set({ creatures }); get().saveAdminConfig() },
  addCreature: (creature) => { 
    set((s) => ({ creatures: [...s.creatures, creature] }))
    get().saveAdminConfig() 
  },
  updateCreature: (id, creature) => {
    set((s) => ({ creatures: s.creatures.map(c => c.id === id ? creature : c) }))
    get().saveAdminConfig()
  },
  deleteCreature: (id) => {
    set((s) => ({ creatures: s.creatures.filter(c => c.id !== id) }))
    get().saveAdminConfig()
  },

  setSpawnConfig: (spawnConfig) => { set({ spawnConfig }); get().saveAdminConfig() },
  setRarityWeights: (rarityWeights) => { set({ rarityWeights }); get().saveAdminConfig() },
  setCatchConfig: (catchConfig) => { set({ catchConfig }); get().saveAdminConfig() },
  setEncounterPhysics: (encounterPhysics) => { set({ encounterPhysics }); get().saveAdminConfig() },
  setDebugSettings: (debugSettings) => { set({ debugSettings }); get().saveAdminConfig() },
  setEventArea: (eventArea) => { set({ eventArea }); get().saveAdminConfig() },
  setMapConfig: (mapConfig) => { set({ mapConfig }); get().saveAdminConfig() },
  setPlayerConfig: (playerConfig) => { set({ playerConfig }); get().saveAdminConfig() },

  resetToDefaults: async () => {
    set({ ...DEFAULT_CONFIG })
    await get().saveAdminConfig()
  },

  resetCreatures: () => { set({ creatures: DEFAULT_CONFIG.creatures }); get().saveAdminConfig() },
  resetSpawnConfig: () => { set({ spawnConfig: DEFAULT_CONFIG.spawnConfig }); get().saveAdminConfig() },
  resetRarityWeights: () => { set({ rarityWeights: DEFAULT_CONFIG.rarityWeights }); get().saveAdminConfig() },
  resetCatchConfig: () => { set({ catchConfig: DEFAULT_CONFIG.catchConfig }); get().saveAdminConfig() },
  resetEncounterPhysics: () => { set({ encounterPhysics: DEFAULT_CONFIG.encounterPhysics }); get().saveAdminConfig() },
  resetEventArea: () => { set({ eventArea: DEFAULT_CONFIG.eventArea }); get().saveAdminConfig() },
  resetMapConfig: () => { set({ mapConfig: DEFAULT_CONFIG.mapConfig }); get().saveAdminConfig() },
  resetPlayerConfig: () => { set({ playerConfig: DEFAULT_CONFIG.playerConfig }); get().saveAdminConfig() },
  
  setLastZoom: (zoom: number) => {
    localStorage.setItem('fsm_last_zoom', zoom.toString())
  },
}))