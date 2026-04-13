// Spawn system
export const SPAWN_RADIUS_MIN = 30        // meters
export const SPAWN_RADIUS_MAX = 150       // meters
export const MAX_ACTIVE_SPAWNS = 8
export const SPAWN_INTERVAL = 12_000      // ms — check every 12s
export const SPAWN_LIFETIME = 300_000     // ms — 5 minutes
export const ENCOUNTER_RANGE = 30         // meters — must be within to tap
export const DESPAWN_RANGE = 100          // meters — distance where creature starts despawning

// Catch mechanics
export const CATCH_FLEE_THRESHOLD = 0.85
export const CP_VARIANCE = 0.3            // ±30% from base CP
export const LEVEL_CATCH_PENALTY = 0.02   // per creature level

// Player
export const XP_PER_CATCH = 100
export const XP_PER_FLEE = 25
export const BASE_XP_TO_LEVEL = 500
export const XP_LEVEL_MULTIPLIER = 1.5

// Geolocation
export const GEO_HIGH_ACCURACY = true
export const GEO_MAX_AGE = 0              // ms, 0 forces fresh GPS reading instead of cache
export const GEO_TIMEOUT = 10000          // ms
export const MAP_UPDATE_THROTTLE = 100    // ms — max 10 updates/sec for smoother movement

// Rarity weights (for spawn selection)
export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 12,
  legendary: 3,
} as const
