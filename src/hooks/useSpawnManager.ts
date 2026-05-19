import { useEffect, useRef, useCallback } from 'react'
import type { Position, SpawnPoint, Rarity } from '../types'
import { randomPointInRadius, randomPointInPolygon, haversineDistance } from '../utils/geo'
import { rollCP, uid } from '../utils/random'
import { useGameStore } from '../store/useGameStore'
import { useAdminStore } from '../store/useAdminStore'

function rollRarityFromWeights(weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][]
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * totalWeight

  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity
  }

  return 'common'
}

export function useSpawnManager(playerPosition: Position | null) {
  const { spawns, addSpawn, removeSpawn, markSpawnDespawning, cleanExpiredSpawns } = useGameStore()
  const { creatures, spawnConfig, rarityWeights } = useAdminStore()

  const trySpawn = useCallback(() => {
    if (!playerPosition) return
    if (spawns.length >= spawnConfig.maxActiveSpawns) return

    // Roll rarity and pick a creature from admin-configured list
    const rarity = rollRarityFromWeights(rarityWeights)
    const candidates = creatures.filter(c => c.rarity === rarity)
    if (candidates.length === 0) return false

    const creature = candidates[Math.floor(Math.random() * candidates.length)]
    
    // Ensure we don't spawn outside the despawnRange, causing an instant despawn
    let spawnPos: Position | null = null;
    
    const { eventArea } = useAdminStore.getState();
    if (eventArea.enabled && eventArea.polygon.length >= 3) {
      // Spawn strictly within the event area
      spawnPos = randomPointInPolygon(eventArea.polygon);
    } 
    
    if (!spawnPos) {
      // Original logic: spawn around player
      const maxRadius = Math.min(spawnConfig.spawnRadiusMax, spawnConfig.despawnRange)
      const minRadius = Math.min(spawnConfig.spawnRadiusMin, maxRadius)
      spawnPos = randomPointInRadius(playerPosition, minRadius, maxRadius)
    }

    const now = Date.now()

    const spawn: SpawnPoint = {
      id: uid(),
      creature,
      position: spawnPos,
      spawnedAt: now,
      expiresAt: now + spawnConfig.spawnLifetime,
      cp: rollCP(creature.baseCP),
    }

    addSpawn(spawn)
    return true
  }, [playerPosition, spawns.length, addSpawn, creatures, spawnConfig, rarityWeights])

  // Distance checks for despawning
  useEffect(() => {
    if (!playerPosition) return

    spawns.forEach(spawn => {
      if (!spawn.isDespawning) {
        const dist = haversineDistance(playerPosition, spawn.position)
        if (dist > spawnConfig.despawnRange) {
          markSpawnDespawning(spawn.id)
        }
      }
    })
  }, [playerPosition, spawns, spawnConfig.despawnRange, markSpawnDespawning])

  const burstHappened = useRef(false)

  // Periodic spawn & cleanup
  useEffect(() => {
    if (!playerPosition) return

    // Ensure we have at least 3 creatures on first load/GPS acquisition
    if (!burstHappened.current && creatures.length > 0) {
      const needed = Math.max(0, 3 - spawns.length)
      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          setTimeout(() => trySpawn(), i * 150)
        }
      }
      burstHappened.current = true
    }

    const interval = setInterval(() => {
      cleanExpiredSpawns()
      trySpawn()
    }, spawnConfig.spawnInterval)

    return () => clearInterval(interval)
  }, [playerPosition, trySpawn, cleanExpiredSpawns, spawnConfig.spawnInterval, creatures.length]) 

  // ── Minimum spawn detector ──
  // Checks every 2 seconds if spawn count drops below minimum (2).
  // Immediately spawns replacements so the map never feels empty.
  useEffect(() => {
    if (!playerPosition || creatures.length === 0) return

    const MIN_SPAWNS = 2
    const CHECK_INTERVAL = 2000

    const checker = setInterval(() => {
      const currentSpawns = useGameStore.getState().spawns
      const activeCount = currentSpawns.filter(s => !s.isDespawning).length
      
      if (activeCount < MIN_SPAWNS) {
        const needed = MIN_SPAWNS - activeCount
        for (let i = 0; i < needed; i++) {
          setTimeout(() => trySpawn(), i * 200)
        }
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(checker)
  }, [playerPosition, trySpawn, creatures.length])

  return { spawns, removeSpawn }
}
