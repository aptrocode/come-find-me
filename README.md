# 🎮 First See Mie — Pokemon GO-like Web Game

**First See Mie** is a location-based mobile-first web game that brings the Pokémon GO experience to the browser. Explore your real-world surroundings, discover unique creatures, and capture them to build your collection.

![Project Preview](https://via.placeholder.com/800x450.png?text=First+See+Me+Game+Map) _<!-- Note: This is a placeholder, actual screenshots can be added later -->_

## ✨ Features

- **📍 Real-time Map**: Powered by Mapbox GL JS, featuring a custom dark-themed game map that follows your GPS position.
- **👾 Dynamic Spawning**: Creatures appear in your vicinity based on real-world coordinates and rarity weights.
- **⚔️ 3D Encounter System**: Immersive capture experience using React Three Fiber (R3F) and Three.js.
- **🎒 Inventory Management**: Track your collection, see creature details, and monitor your progress.
- **🛠️ Real-time Admin Panel**: A built-in dashboard for live configuration of spawn rates, creature stats, and game balance without restarts.
- **📱 Mobile First**: Optimized for touch interactions and high-performance mobile browser experience.

## 🚀 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Map & Geo**: [Mapbox GL JS v3](https://docs.mapbox.com/mapbox-gl-js/)
- **3D Engine**: [Three.js](https://threejs.org/) & [@react-three/fiber](https://r3f.docs.pmnd.rs/)
- **Animation**: [@react-spring/three](https://www.react-spring.dev/) & [@use-gesture/react](https://use-gesture.netlify.app/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Package Manager**: [Bun](https://bun.sh/)

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A [Mapbox Access Token](https://account.mapbox.com/).

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd first-see-me
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Configure environment:
   Create a `.env` file in the root directory and add your Mapbox token:

   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. Run the development server:
   ```bash
   bun dev
   ```
   The app will be available at `http://localhost:5678`.

## 📂 Project Structure

```text
src/
├── components/          # Atomic Design components
│   ├── atoms/           # Basic 3D models and base UI
│   ├── molecules/       # UI groups (HUD, Debug, Loading, UI)
│   └── organism/        # Full screens (Map, Encounter, Admin, Inventory, Profile)
├── store/               # Zustand state management (Game & Admin)
├── hooks/               # Custom hooks (Geolocation, Spawn logic, Mapbox)
├── utils/               # Helper functions (Geo, math)
├── types/               # TypeScript interfaces and types
└── public/              # Static assets and 3D models
```

## ⚙️ Administration

The game includes a powerful Admin Panel at `/admin`. This panel allows developers to:

- Modify creature statistics and rarity in real-time.
- Adjust spawn radii and intervals.
- Tweak catch rates and XP rewards.

Changes are persisted to `admin-config.json` via a custom Vite server middleware.

---

Built with ❤️ for location-aware gaming.
