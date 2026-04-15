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
    if (candidates.length === 0) return

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
    if (!burstHappened.current && spawns.length < 3) {
      const needed = 3 - spawns.length
      for (let i = 0; i < needed; i++) {
        // We use a small delay between spawns to avoid potential coordinate collisions 
        // if the random logic hits similar spots, though unlikely.
        setTimeout(() => trySpawn(), i * 100)
      }
      burstHappened.current = true
    }

    const interval = setInterval(() => {
      cleanExpiredSpawns()
      trySpawn()
    }, spawnConfig.spawnInterval)

    return () => clearInterval(interval)
  }, [playerPosition, trySpawn, cleanExpiredSpawns, spawnConfig.spawnInterval]) // Removed spawns.length from deps to prevent re-runs on every spawn

  return { spawns, removeSpawn }
}
