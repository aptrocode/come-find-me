import { useEffect, useRef, useCallback } from 'react'
import type { Position, SpawnPoint, Rarity } from '../types'
import { randomPointInRadius, haversineDistance } from '../utils/geo'
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
    const maxRadius = Math.min(spawnConfig.spawnRadiusMax, spawnConfig.despawnRange)
    const minRadius = Math.min(spawnConfig.spawnRadiusMin, maxRadius)
    const spawnPos = randomPointInRadius(playerPosition, minRadius, maxRadius)
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

  // Periodic spawn & cleanup
  useEffect(() => {
    // Initial burst — spawn a few right away
    if (playerPosition && spawns.length === 0) {
      const burstCount = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => trySpawn(), i * 300)
      }
    }

    intervalRef.current = setInterval(() => {
      cleanExpiredSpawns()
      trySpawn()
    }, spawnConfig.spawnInterval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playerPosition, trySpawn, cleanExpiredSpawns, spawns.length, spawnConfig.spawnInterval])

  return { spawns, removeSpawn }
}
