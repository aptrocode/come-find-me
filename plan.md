# 🎮 First See Me — Pokemon GO-like Web Game

## Ringkasan Proyek

Web-based location game mirip Pokemon GO. Player membuka browser → muncul peta real-time (Mapbox GL JS) berpusat di lokasi mereka → monster/object spawn di sekitar berdasarkan GPS → player berjalan mendekati → tap untuk encounter → mini battle/catch UI.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | React 19 + TypeScript (sudah ada) |
| Build Tool | Vite 8 (sudah ada) |
| Peta | **Mapbox GL JS v3.x** (npm: `mapbox-gl`) |
| State Management | **Zustand** (ringan, minimal boilerplate) |
| Geolocation | Browser Geolocation API (watchPosition) |
| Asset | Dummy sprites via CSS / SVG / emoji (tanpa 3D berat) |
| Storage | LocalStorage (save progress, inventory) |
| Deployment | Vite build → static hosting |

---

## Arsitektur & Struktur Folder

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component + routing
├── index.css                   # Global styles & design tokens
│
├── config/
│   └── mapbox.ts               # Mapbox access token & map config
│   └── creatures.ts            # Data dummy creature/monster
│   └── constants.ts            # Game constants (spawn radius, catch rate, dll)
│
├── store/
│   └── useGameStore.ts          # Zustand store (inventory, score, status)
│
├── hooks/
│   └── useGeolocation.ts       # Wrapper Geolocation API (watchPosition)
│   └── useSpawnManager.ts      # Logic spawn creature berdasarkan lokasi
│   └── useMapbox.ts            # Hook inisialisasi & kontrol Mapbox map
│
├── components/
│   ├── Map/
│   │   └── GameMap.tsx          # Komponen peta utama (Mapbox GL)
│   │   └── PlayerMarker.tsx     # Marker player di peta
│   │   └── CreatureMarker.tsx   # Marker creature yang spawn
│   │
│   ├── HUD/
│   │   └── TopBar.tsx           # Status bar (level, nama, dll)
│   │   └── BottomNav.tsx        # Navigasi bawah (Map, Inventory, Profile)
│   │   └── Compass.tsx          # Arah kompas (optional)
│   │
│   ├── Encounter/
│   │   └── EncounterScreen.tsx  # Layar encounter saat tap creature
│   │   └── CatchAnimation.tsx   # Animasi menangkap
│   │   └── CreatureCard.tsx     # Card detail creature
│   │
│   ├── Inventory/
│   │   └── InventoryScreen.tsx  # List creature yang sudah ditangkap
│   │   └── CreatureEntry.tsx    # Item creature di inventory
│   │
│   └── UI/
│       └── Modal.tsx            # Reusable modal
│       └── Button.tsx           # Styled button
│       └── LoadingScreen.tsx    # Loading / GPS waiting screen
│
├── utils/
│   └── geo.ts                   # Haversine distance, bearing, dll
│   └── random.ts                # Random spawn logic
│   └── storage.ts               # LocalStorage helpers
│
└── types/
    └── index.ts                 # TypeScript types (Creature, Player, Position, dll)
```

---

## Fase Implementasi

### Fase 1: Foundation & Map Setup
> Map fullscreen + player marker bergerak real-time

**Tasks:**
- [ ] Install `mapbox-gl` + `@types/mapbox-gl`
- [ ] Buat `config/mapbox.ts` — simpan access token + default map style
- [ ] Buat `hooks/useGeolocation.ts` — wrapper `navigator.geolocation.watchPosition` dengan error handling & high accuracy
- [ ] Buat `hooks/useMapbox.ts` — init map, set center, handle resize
- [ ] Buat `components/Map/GameMap.tsx` — fullscreen Mapbox map (dark/game style)
- [ ] Buat `components/Map/PlayerMarker.tsx` — pulsing blue dot marker di posisi user
- [ ] Buat `components/UI/LoadingScreen.tsx` — tampilkan saat menunggu GPS fix
- [ ] Setup global CSS: fullscreen layout, dark theme, mobile-first

**Catatan Optimasi:**
- Gunakan `mapbox://styles/mapbox/dark-v11` untuk nuansa game
- `watchPosition` dengan `enableHighAccuracy: true`, `maximumAge: 2000`
- Map: disable rotation & pitch untuk performa mobile, enable kembali jika perlu
- Gunakan `map.easeTo()` untuk smooth camera follow

---

### Fase 2: Creature Spawn System
> Monster muncul di sekitar player berdasarkan lokasi

**Tasks:**
- [ ] Buat `types/index.ts` — define `Creature`, `SpawnPoint`, `PlayerState`, `Position`
- [ ] Buat `config/creatures.ts` — daftar 10-15 dummy creatures (nama, tipe, rarity, emoji/icon, stats)
- [ ] Buat `config/constants.ts` — spawn radius (50-200m), max active spawns (8), spawn interval (15s), despawn time (5min)
- [ ] Buat `utils/geo.ts` — `haversineDistance()`, `randomPointInRadius()`, `isWithinRange()`
- [ ] Buat `utils/random.ts` — weighted random berdasarkan rarity
- [ ] Buat `hooks/useSpawnManager.ts`:
  - Generate spawn points di sekitar player
  - Spawn interval timer
  - Despawn creature yang sudah expired / terlalu jauh
  - Max spawns limiter
- [ ] Buat `components/Map/CreatureMarker.tsx` — marker animasi di peta (bounce/glow effect)
- [ ] Render creature markers di `GameMap.tsx`

**Catatan Optimasi:**
- Spawn logic di `requestIdleCallback` atau throttled interval
- Marker menggunakan HTML overlay (Mapbox `Marker` class), bukan canvas layer — lebih fleksibel untuk animasi CSS
- Creature data minimal di memory, no image preloading sampai encounter
- Gunakan `Set` / `Map` untuk tracking spawn IDs, avoid array scanning

---

### Fase 3: HUD & Game UI
> UI overlay di atas peta: status bar, navigasi, info

**Tasks:**
- [ ] Buat `store/useGameStore.ts` — Zustand store: player info, inventory, active encounter
- [ ] Buat `components/HUD/TopBar.tsx` — player name, level, XP bar
- [ ] Buat `components/HUD/BottomNav.tsx` — tab navigation (Map / Inventory / Profile)
- [ ] Buat `components/UI/Button.tsx` — reusable styled button dengan variants
- [ ] Buat `components/UI/Modal.tsx` — reusable modal/drawer
- [ ] Integrasikan HUD overlay di `App.tsx`
- [ ] Tambah proximity indicator — jika creature dekat, UI feedback (pulse, glow border)

**Design Notes:**
- UI harus semi-transparent / glassmorphism agar peta tetap terlihat
- Gunakan `backdrop-filter: blur()` untuk glass effect
- Z-index management: Map (0) → Creature markers (10) → HUD (100) → Modal (200)
- Semua animasi pakai CSS transitions / keyframes, bukan JS

---

### Fase 4: Encounter & Catch System
> Tap creature → encounter screen → catch mechanic

**Tasks:**
- [ ] Buat `components/Encounter/EncounterScreen.tsx`:
  - Fullscreen overlay
  - Creature display (besar, animasi idle)
  - Info: nama, tipe, CP/level
  - Tombol "Throw Ball" / catch action
  - Catch probability system (random + rarity modifier)
  - Result: caught / fled
- [ ] Buat `components/Encounter/CatchAnimation.tsx` — animasi lempar bola (CSS keyframes)
- [ ] Buat `components/Encounter/CreatureCard.tsx` — card detail creature
- [ ] Update `useGameStore` — handle encounter flow, add to inventory on catch
- [ ] Buat `utils/storage.ts` — save/load game state ke LocalStorage
- [ ] Auto-save setiap catch / event penting

**Catch Mechanic (Simple):**
```
catchRate = baseCatchRate(rarity) - (creatureLevel * 0.02)
roll = Math.random()
if (roll < catchRate) → CAUGHT
else if (roll > 0.85) → FLED
else → MISSED (bisa coba lagi)
```

---

### Fase 5: Inventory & Collection
> Lihat dan kelola creature yang sudah ditangkap

**Tasks:**
- [ ] Buat `components/Inventory/InventoryScreen.tsx` — grid/list semua creature
- [ ] Buat `components/Inventory/CreatureEntry.tsx` — card per creature (nama, tipe, CP, waktu tangkap)
- [ ] Filter & sort (by tipe, rarity, waktu)
- [ ] Detail view saat tap creature
- [ ] Collection progress — "X / Total caught"
- [ ] Empty state yang menarik

---

### Fase 6: Polish & Optimization
> Final touches untuk experience premium

**Tasks:**
- [ ] Tambah sound effects (optional, Web Audio API)
- [ ] Haptic feedback via `navigator.vibrate()` saat catch
- [ ] Smooth transitions antar screen
- [ ] Error boundaries & fallback UI
- [ ] Offline indicator
- [ ] Performance audit:
  - Bundle size check
  - Lazy load Encounter & Inventory screens
  - Debounce/throttle geolocation updates
  - Remove unused Mapbox features
- [ ] PWA support (manifest.json, service worker — optional)
- [ ] Responsive: pastikan optimal di mobile portrait

---

## Data Model (TypeScript Types)

```typescript
interface Position {
  lat: number
  lng: number
  accuracy?: number
  timestamp: number
}

interface Creature {
  id: string
  name: string
  type: 'fire' | 'water' | 'grass' | 'electric' | 'dark' | 'normal'
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  emoji: string           // Dummy visual
  baseCatchRate: number   // 0.0 - 1.0
  baseCP: number          // Base combat power
  description: string
}

interface SpawnPoint {
  id: string
  creature: Creature
  position: Position
  spawnedAt: number       // timestamp
  expiresAt: number       // timestamp
  cp: number              // Rolled CP for this instance
}

interface CaughtCreature {
  id: string
  creature: Creature
  cp: number
  caughtAt: number
  caughtLocation: Position
}

interface PlayerState {
  name: string
  level: number
  xp: number
  inventory: CaughtCreature[]
  totalCaught: number
  totalSeen: number
}
```

---

## Dummy Creature List (Contoh)

| Nama | Tipe | Rarity | Emoji | Base Catch Rate |
|------|------|--------|-------|-----------------|
| Flamepup | Fire | Common | 🔥 | 0.70 |
| Aquafin | Water | Common | 🐟 | 0.70 |
| Leafling | Grass | Common | 🌿 | 0.70 |
| Voltkit | Electric | Uncommon | ⚡ | 0.50 |
| Shadowmew | Dark | Uncommon | 🌑 | 0.50 |
| Blazewolf | Fire | Rare | 🐺 | 0.30 |
| Tideclaw | Water | Rare | 🦀 | 0.30 |
| Thornvine | Grass | Rare | 🌹 | 0.30 |
| Stormdrake | Electric | Legendary | 🐉 | 0.10 |
| Voidreaper | Dark | Legendary | 👻 | 0.10 |

---

## Optimasi Web (Penting!)

### Bundle & Loading
- **Code splitting**: Lazy load `EncounterScreen` dan `InventoryScreen` (React.lazy + Suspense)
- **Mapbox GL JS**: ~200KB gzipped — load sekali, cache browser
- **Tree shaking**: import hanya yang dibutuhkan
- **Preload**: CSS & font di `<head>`

### Geolocation
- `watchPosition` dengan `maximumAge: 3000ms` untuk hemat battery
- Throttle map updates ke max 1x per detik
- Fallback ke `getCurrentPosition` jika watch gagal

### Rendering
- Batasi creature markers on-screen (max 8-10)
- Gunakan `will-change: transform` pada elemen yang sering bergerak
- CSS animations > JS animations (GPU accelerated)
- `React.memo` pada marker components
- Avoid re-render map saat HUD update (isolasi state)

### Memory
- Cleanup spawns yang expired
- Dispose Mapbox markers yang di-remove
- LocalStorage max 5MB — compress inventory jika perlu

### Mobile
- `touch-action: manipulation` — no double-tap zoom delay
- Viewport meta: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`
- Full-height: `100dvh` (dynamic viewport height)

---

## Mapbox Config

```typescript
// config/mapbox.ts
export const MAPBOX_CONFIG = {
  accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN', // Perlu diisi
  style: 'mapbox://styles/mapbox/dark-v11',
  defaultZoom: 17,      // Street-level zoom untuk game
  maxZoom: 19,
  minZoom: 14,
  pitchEnabled: false,   // Disable 3D tilt untuk performa
  rotateEnabled: false,  // Disable rotasi untuk konsistensi
}
```

---

## Kebutuhan Sebelum Mulai

> [!IMPORTANT]
> **Mapbox Access Token** diperlukan untuk menjalankan peta.
> Daftar gratis di https://account.mapbox.com — free tier: 50,000 map loads/bulan.

> [!NOTE]
> Semua creature menggunakan **emoji/SVG sebagai dummy**. Bisa diganti asset real nanti.
> Tidak ada backend/server — semua logic client-side, data di LocalStorage.

---

## Urutan Eksekusi

```
Fase 1 (Foundation)  →  bisa demo: peta + player marker
Fase 2 (Spawning)    →  bisa demo: creature muncul di sekitar
Fase 3 (HUD)         →  bisa demo: UI game lengkap
Fase 4 (Encounter)   →  bisa demo: tangkap creature
Fase 5 (Inventory)   →  bisa demo: lihat koleksi
Fase 6 (Polish)      →  production ready
```

Setiap fase menghasilkan **demo-able increment** — bisa di-test dan di-review sebelum lanjut.
