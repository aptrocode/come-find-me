import { create } from 'zustand'
import type { SpawnPoint, CaughtCreature, GameScreen, EncounterResult, PlayerState } from '../types'
import { BASE_XP_TO_LEVEL, XP_LEVEL_MULTIPLIER } from '../config/constants'
import { saveGame, loadGame } from '../utils/storage'
import { useAdminStore } from './useAdminStore'

interface GameStore {
  // Player
  player: PlayerState

  // Navigation
  activeScreen: GameScreen
  setActiveScreen: (screen: GameScreen) => void
  isHudHidden: boolean
  setHudHidden: (hidden: boolean) => void

  // Spawns
  spawns: SpawnPoint[]
  addSpawn: (spawn: SpawnPoint) => void
  removeSpawn: (id: string) => void
  markSpawnDespawning: (id: string) => void
  cleanExpiredSpawns: () => void

  // Encounter
  activeEncounter: SpawnPoint | null
  encounterPhase: 'transitioning' | 'active' | null
  encounterResult: EncounterResult
  startEncounter: (spawn: SpawnPoint) => void
  setEncounterPhase: (phase: 'active' | null) => void
  attemptCatch: () => void
  resetThrow: () => void
  closeEncounter: () => void

  // Persistence
  loadSave: () => void
}

function calcXpToNext(level: number): number {
  return Math.round(BASE_XP_TO_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, level - 1))
}

function addXp(player: PlayerState, amount: number): PlayerState {
  let xp = player.xp + amount
  let level = player.level
  let xpToNext = player.xpToNext

  while (xp >= xpToNext) {
    xp -= xpToNext
    level++
    xpToNext = calcXpToNext(level)
  }

  return { ...player, xp, level, xpToNext }
}

const defaultPlayer: PlayerState = {
  name: 'Trainer',
  level: 1,
  xp: 0,
  xpToNext: calcXpToNext(1),
  inventory: [],
  totalCaught: 0,
  totalSeen: 0,
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: { ...defaultPlayer },
  activeScreen: 'map',
  isHudHidden: false,
  spawns: [],
  activeEncounter: null,
  encounterPhase: null,
  encounterResult: null,

  setActiveScreen: (screen) => {
    const { activeEncounter } = get()
    if (activeEncounter) {
      get().closeEncounter()
    }
    set({ 
      activeScreen: screen,
      isHudHidden: false // Always show HUD when switching main screens
    })
  },
  setHudHidden: (hidden) => set({ isHudHidden: hidden }),

  addSpawn: (spawn) => set((s) => ({ spawns: [...s.spawns, spawn] })),

  removeSpawn: (id) => set((s) => ({ spawns: s.spawns.filter(sp => sp.id !== id) })),

  markSpawnDespawning: (id) => set((s) => ({
    spawns: s.spawns.map(sp => 
      sp.id === id ? { ...sp, isDespawning: true, expiresAt: Math.min(sp.expiresAt, Date.now() + 500) } : sp
    )
  })),

  cleanExpiredSpawns: () => {
    const now = Date.now()
    set((s) => ({ spawns: s.spawns.filter(sp => sp.expiresAt > now) }))
  },

  startEncounter: (spawn) => {
    set((s) => ({
      activeEncounter: spawn,
      encounterPhase: 'transitioning',
      encounterResult: null,
      player: { ...s.player, totalSeen: s.player.totalSeen + 1 },
    }))
  },

  setEncounterPhase: (phase) => set({ encounterPhase: phase }),

  attemptCatch: () => {
    const { activeEncounter, player } = get()
    if (!activeEncounter) return

    // Read catch config from admin store
    const { catchConfig } = useAdminStore.getState()

    const { creature, cp, position } = activeEncounter
    const catchRate = Math.max(0.05, creature.baseCatchRate - (player.level * 0.01))
    const roll = Math.random()

    if (roll < catchRate) {
      // CAUGHT
      const caught: CaughtCreature = {
        id: `${creature.id}-${Date.now()}`,
        creature,
        cp,
        caughtAt: Date.now(),
        caughtLocation: position,
      }
      const updatedPlayer = addXp(
        {
          ...player,
          inventory: [...player.inventory, caught],
          totalCaught: player.totalCaught + 1,
        },
        catchConfig.xpPerCatch
      )
      set((s) => ({
        encounterResult: 'caught',
        player: updatedPlayer,
        spawns: s.spawns.filter(sp => sp.id !== activeEncounter.id),
      }))
      saveGame(updatedPlayer)
    } else if (roll > catchConfig.catchFleeThreshold) {
      // FLED
      const updatedPlayer = addXp(player, catchConfig.xpPerFlee)
      set((s) => ({
        encounterResult: 'fled',
        player: updatedPlayer,
        spawns: s.spawns.filter(sp => sp.id !== activeEncounter.id),
      }))
      saveGame(updatedPlayer)
    } else {
      // MISSED
      set({ encounterResult: 'missed' })
    }
  },

  resetThrow: () => set({ encounterResult: null }),

  closeEncounter: () => set({ activeEncounter: null, encounterPhase: null, encounterResult: null }),

  loadSave: () => {
    const saved = loadGame()
    if (saved) {
      set({ player: { ...defaultPlayer, ...saved, xpToNext: calcXpToNext(saved.level) } })
    }
  },
}))
