import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGeolocation } from "../../../hooks/useGeolocation";
import { useMapbox } from "../../../hooks/useMapbox";
import { useSpawnManager } from "../../../hooks/useSpawnManager";
import { useGameStore } from "../../../store/useGameStore";
import { isWithinRange } from "../../../utils/geo";
import { ENCOUNTER_RANGE, MAP_UPDATE_THROTTLE } from "../../../config/constants";
import type { SpawnPoint } from "../../../types";
import { useAdminStore } from "../../../store/useAdminStore";
import LoadingScreen from "../../molecules/UI/LoadingScreen";

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const { position, error, loading } = useGeolocation();
  const { map, mapReady } = useMapbox({ containerRef, position });
  const { spawns } = useSpawnManager(position);
  const { startEncounter, activeEncounter, encounterPhase, setEncounterPhase } = useGameStore();
  const { eventArea, mapConfig } = useAdminStore();

  const handleCreatureTap = useCallback(
    (spawn: SpawnPoint) => {
      if (!position || encounterPhase) return;
      if (isWithinRange(position, spawn.position, ENCOUNTER_RANGE)) {
        startEncounter(spawn);
      } else {
        // Just for demo, let's allow tapping anyway or provide feedback
        startEncounter(spawn);
      }
    },
    [position, encounterPhase, startEncounter],
  );

  // Handle Encounter Transition
  useEffect(() => {
    if (!map || !mapReady || !activeEncounter) return;

    if (encounterPhase === "transitioning") {
      map.flyTo({
        center: [activeEncounter.position.lng, activeEncounter.position.lat],
        zoom: 19,
        pitch: 80,
        bearing: map.getBearing() + 45, // give it a slight dramatic rotation
        duration: 2000,
      });

      const timer = setTimeout(() => {
        setEncounterPhase("active");
      }, 2000);

      return () => clearTimeout(timer);
    } else if (encounterPhase === null && position) {
      // Revert map back when encounter ends
      const savedZoom = localStorage.getItem('fsm_last_zoom');
      const targetZoom = savedZoom ? parseFloat(savedZoom) : mapConfig.defaultZoom;

      map.flyTo({
        center: [position.lng, position.lat],
        zoom: targetZoom,
        pitch: mapConfig.defaultPitch,
        bearing: 0,
        duration: 1500,
      });
    }
  }, [
    map,
    mapReady,
    activeEncounter,
    encounterPhase,
    setEncounterPhase,
    position,
    mapConfig,
  ]);

  // Update player marker position
  useEffect(() => {
    if (!map || !mapReady || !position) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < MAP_UPDATE_THROTTLE) return;
    lastUpdateRef.current = now;

    if (!playerMarkerRef.current) {
      // Create player marker
      const el = document.createElement("div");
      el.className = "player-marker";
      el.innerHTML = `
        <div class="player-pulse"></div>
        <div class="player-dot"></div>
      `;
      playerMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map);

      // Center map on player initially, respecting last zoom
      const savedZoom = localStorage.getItem('fsm_last_zoom');
      const targetZoom = savedZoom ? parseFloat(savedZoom) : mapConfig.defaultZoom;
      map.flyTo({ center: [position.lng, position.lat], zoom: targetZoom, duration: 1000 });
    } else {
      playerMarkerRef.current.setLngLat([position.lng, position.lat]);
    }

    if (playerMarkerRef.current) {
      playerMarkerRef.current.getElement().style.display = encounterPhase
        ? "none"
        : "block";
    }
  }, [map, mapReady, position, encounterPhase]);

  // Setup Mapbox Source and Layers for creatures
  useEffect(() => {
    if (!map || !mapReady) return;

    if (!map.getSource("creature-spawns")) {
      map.addSource("creature-spawns", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Event Area Source & Layer
      if (!map.getSource("event-area")) {
        map.addSource("event-area", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        // Add area fill
        map.addLayer({
          id: "event-area-fill",
          type: "fill",
          source: "event-area",
          paint: {
            "fill-color": eventArea.color || "#4ecdc4",
            "fill-opacity": eventArea.opacity ?? 0.1,
          },
        });

        // Add area border
        map.addLayer({
          id: "event-area-border",
          type: "line",
          source: "event-area",
          paint: {
            "line-color": eventArea.color || "#4ecdc4",
            "line-width": 3,
            "line-opacity": 0.5,
          },
        });
      }

      // Glow layer
      map.addLayer({
        id: "creature-glow-layer",
        type: "circle",
        source: "creature-spawns",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, ["*", 15, ["coalesce", ["get", "scale"], 1]],
            19, ["*", 30, ["coalesce", ["get", "scale"], 1]]
          ],
          "circle-opacity": ["*", ["coalesce", ["get", "scale"], 1], 0.4],
          "circle-blur": 0.5,
        },
      });

      // Symbol layer for emoji
      if (!map.getLayer("creature-symbol-layer")) {
        map.addLayer({
          id: "creature-symbol-layer",
          type: "symbol",
          source: "creature-spawns",
          layout: {
            "icon-image": ["get", "emoji"],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14, ["*", 0.5, ["coalesce", ["get", "scale"], 1]],
              19, ["*", 1.2, ["coalesce", ["get", "scale"], 1]]
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
          paint: {
            "icon-opacity": ["coalesce", ["get", "scale"], 1]
          }
        });
        
        // Click handler
        map.on("click", "creature-symbol-layer", (e) => {
          if (!e.features || !e.features[0]) return;
          const feature = e.features[0];
          const spawnId = feature.properties?.id;
          
          const spawn = useGameStore.getState().spawns.find(s => s.id === spawnId);
          if (spawn) handleCreatureTap(spawn);
        });
        
        map.on("mouseenter", "creature-symbol-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "creature-symbol-layer", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    }
  }, [map, mapReady, handleCreatureTap, eventArea.color, eventArea.opacity]);

  // Update Event Area geometry
  useEffect(() => {
    if (!map || !mapReady) return;
    try {
      const source = map.getSource("event-area") as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (eventArea.enabled && eventArea.polygon.length >= 3) {
        // Mapbox requires Polygons to be closed (first coordinate === last coordinate)
        const coords = eventArea.polygon.map(p => [p.lng, p.lat]);
        coords.push([...coords[0]]); // Close the polygon

        const feature = {
          type: "Feature" as const,
          geometry: { 
            type: "Polygon" as const, 
            coordinates: [coords] 
          },
          properties: {}
        };

        source.setData({
          type: "FeatureCollection",
          features: [feature],
        });
      } else {
        source.setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      // Update layer colors/opacity reactively
      if (map.getLayer("event-area-fill")) {
        map.setPaintProperty("event-area-fill", "fill-color", eventArea.color || "#4ecdc4");
        map.setPaintProperty("event-area-fill", "fill-opacity", eventArea.opacity ?? 0.1);
      }
      if (map.getLayer("event-area-border")) {
        map.setPaintProperty("event-area-border", "line-color", eventArea.color || "#4ecdc4");
      }
    } catch (e) {
      console.error("Event area update error:", e);
    }
  }, [map, mapReady, eventArea]);

  // Update GeoJSON data when spawns change
  useEffect(() => {
    if (!map || !mapReady) return;

    let animationFrameId: number;

    const renderSpawns = () => {
      try {
        const source = map.getSource("creature-spawns") as mapboxgl.GeoJSONSource;
        if (!source) return;

        // Ensure all emojis in spawns have been added as images
        spawns.forEach(spawn => {
          const emoji = spawn.creature.emoji;
          if (emoji && !map.hasImage(emoji)) {
            const size = 64;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = 4;
              ctx.shadowOffsetY = 2;
              ctx.font = "46px 'Apple Color Emoji', 'Segoe UI Emoji', Arial, sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(emoji, size / 2, size / 2 + 4);
              map.addImage(emoji, ctx.getImageData(0, 0, size, size));
            }
          }
        });

        // Ensure layout property is set without crashing when layer missing
        if (map.getLayer("creature-symbol-layer")) {
          const currentSymVis = map.getLayoutProperty("creature-symbol-layer", "visibility") || "visible";
          const currentGlowVis = map.getLayoutProperty("creature-glow-layer", "visibility") || "visible";
          
          const targetVis = encounterPhase ? "none" : "visible";
          
          if (currentSymVis !== targetVis) {
            map.setLayoutProperty("creature-symbol-layer", "visibility", targetVis);
          }
          if (currentGlowVis !== targetVis) {
            map.setLayoutProperty("creature-glow-layer", "visibility", targetVis);
          }
        }

        let needsAnimation = false;
        const now = Date.now();

        const features = spawns.map((spawn) => {
          let scale = 1;
          if (spawn.isDespawning) {
            const timeRemaining = Math.max(0, spawn.expiresAt - now);
            scale = timeRemaining / 500;
            if (timeRemaining > 0) {
              needsAnimation = true;
            }
          }

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [spawn.position.lng, spawn.position.lat],
            },
            properties: {
              id: spawn.id,
              emoji: spawn.creature.emoji,
              color: spawn.creature.color,
              rarity: spawn.creature.rarity,
              scale,
            },
          }
        });

        source.setData({
          type: "FeatureCollection",
          features,
        });

        if (needsAnimation) {
          animationFrameId = requestAnimationFrame(renderSpawns);
        }
      } catch (e) {
        console.error("Map layer update error:", e);
      }
    };

    renderSpawns();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [map, mapReady, spawns, encounterPhase]);

  // Recenter button
  const handleRecenter = useCallback(() => {
    if (!map || !position) return;
    const savedZoom = localStorage.getItem('fsm_last_zoom');
    const targetZoom = savedZoom ? parseFloat(savedZoom) : mapConfig.defaultZoom;

    map.flyTo({
      center: [position.lng, position.lat],
      zoom: targetZoom,
      pitch: mapConfig.defaultPitch,
      bearing: 0,
      duration: 800,
    });
  }, [map, position, mapConfig]);

  if (loading) return <LoadingScreen message="Acquiring GPS signal..." />;
  if (error) return <LoadingScreen message={error} isError />;

  return (
    <div className="game-map-wrapper">
      <div ref={containerRef} className="game-map" />
      <button
        className="recenter-btn"
        onClick={handleRecenter}
        aria-label="Center on me"
      >
        <span>◎</span>
      </button>
    </div>
  );
}
