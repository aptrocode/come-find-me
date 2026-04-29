import { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGeolocation } from "../../../hooks/useGeolocation";
import { useMapbox } from "../../../hooks/useMapbox";
import { useSpawnManager } from "../../../hooks/useSpawnManager";
import { useGameStore } from "../../../store/useGameStore";
import { isWithinRange, calculateBearing, haversineDistance } from "../../../utils/geo";
import { ENCOUNTER_RANGE, MAP_UPDATE_THROTTLE } from "../../../config/constants";
import type { SpawnPoint, Position } from "../../../types";
import { useAdminStore } from "../../../store/useAdminStore";
import LoadingScreen from "../../molecules/UI/LoadingScreen";
import Player3DMarker from "../../atoms/Player3DMarker";

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const creatureMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const lastUpdateRef = useRef<number>(0);
  const previousPosRef = useRef<Position | null>(null);
  
  const [playerMarkerEl, setPlayerMarkerEl] = useState<HTMLDivElement | null>(null);
  const [playerHeading, setPlayerHeading] = useState(0);

  const { position, error, loading } = useGeolocation();
  const { map, mapReady } = useMapbox({ containerRef, position });
  const { spawns } = useSpawnManager(position);
  const { startEncounter, activeEncounter, encounterPhase, setEncounterPhase } = useGameStore();
  const { eventArea, mapConfig, playerConfig } = useAdminStore();

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
        bearing: mapConfig.defaultBearing ?? 0,
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

    // Calculate heading based on movement direction
    if (previousPosRef.current) {
      const dist = haversineDistance(previousPosRef.current, position);
      if (dist > 0.5) { // Only update heading if moved more than 0.5 meters to avoid jitter
        const newHeading = calculateBearing(previousPosRef.current, position);
        setPlayerHeading(newHeading);
        previousPosRef.current = position;
      }
    } else {
      previousPosRef.current = position;
    }

    if (!playerMarkerRef.current) {
      // Create player marker container for the 3D model portal
      const el = document.createElement("div");
      el.className = "player-marker-3d-container";
      el.style.width = "0px";
      el.style.height = "0px";
      
      playerMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([position.lng, position.lat])
        .addTo(map);

      setPlayerMarkerEl(el);

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
  }, [map, mapReady, position, encounterPhase, mapConfig.defaultZoom]);

  // Setup Event Area Source and Layers
  useEffect(() => {
    if (!map || !mapReady) return;

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
  }, [map, mapReady, eventArea.color, eventArea.opacity]);

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

  // Update creature DOM markers
  useEffect(() => {
    if (!map || !mapReady) return;

    const currentMarkerIds = new Set<string>();

    spawns.forEach((spawn) => {
      currentMarkerIds.add(spawn.id);
      
      let marker = creatureMarkersRef.current.get(spawn.id);
      
      if (!marker) {
        // Create new marker
        const el = document.createElement("div");
        el.className = "creature-marker";
        // Create an inner wrapper for CSS transitions to avoid Mapbox positioning conflicts
        el.innerHTML = `
          <div class="creature-marker-inner" style="color: ${spawn.creature.color}">
            <div class="creature-glow" style="background: ${spawn.creature.color}"></div>
            <div class="creature-emoji">${spawn.creature.emoji}</div>
          </div>
        `;
        
        // Add pointer style for clickability
        el.style.cursor = "pointer";
        el.addEventListener("click", () => handleCreatureTap(spawn));
        
        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([spawn.position.lng, spawn.position.lat])
          .addTo(map);
          
        creatureMarkersRef.current.set(spawn.id, marker);
      }

      // Handle CSS despawn animation
      const el = marker.getElement();
      if (spawn.isDespawning) {
        el.classList.add("despawning");
      } else {
        el.classList.remove("despawning");
      }

      // Hide during encounter
      el.style.display = encounterPhase ? "none" : "block";
    });

    // Remove markers that are no longer in the spawns list
    creatureMarkersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        creatureMarkersRef.current.delete(id);
      }
    });

  }, [map, mapReady, spawns, encounterPhase, handleCreatureTap]);

  // Recenter button
  const handleRecenter = useCallback(() => {
    if (!map || !position) return;
    const savedZoom = localStorage.getItem('fsm_last_zoom');
    const targetZoom = savedZoom ? parseFloat(savedZoom) : mapConfig.defaultZoom;

    map.flyTo({
      center: [position.lng, position.lat],
      zoom: targetZoom,
      pitch: mapConfig.defaultPitch,
      bearing: mapConfig.defaultBearing ?? 0,
      duration: 800,
    });
  }, [map, position, mapConfig]);

  if (loading) return <LoadingScreen message="Acquiring GPS signal..." />;
  if (error) return <LoadingScreen message={error} isError />;

  return (
    <div className="game-map-wrapper">
      <div ref={containerRef} className="game-map" />
      {playerMarkerEl && createPortal(
        <Player3DMarker 
          url="/models/maskot-Mi-Sedap-fast-normal.glb" 
          heading={playerHeading} 
          scale={playerConfig.scale}
          positionX={playerConfig.positionX}
          positionY={playerConfig.positionY}
          positionZ={playerConfig.positionZ}
        />, 
        playerMarkerEl
      )}
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
