import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useTheme } from "./context/ThemeContext";

export default function Campus3D({
  onEdificioClick,
  targetLocation,
  locations = [],
  events = [],
  userFacultyId,
  onEventFound,
  onVisitRegistered,
  isFpsMode = false
}) {
  const { scene } = useGLTF('/mapa_uce.glb');
  const { camera, controls, scene: globalScene } = useThree();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const visitedSession = useRef(new Set());
  const notifiedEventsSession = useRef(new Set());
  const nearestBuilding = useRef(null); // Track currently nearest building
  const lastSelectedBuilding = useRef(null); // Prevent re-triggering same building
  const [pinPosition, setPinPosition] = useState(null);
  const [pinLabel, setPinLabel] = useState("");
  const [dynamicLabels, setDynamicLabels] = useState([]);

  // --- ENVIRONMENT LOGIC (DAY/NIGHT) ---
  useEffect(() => {
    if (isDark) {
      // DARK MODE EFFECTS: Fog and night background
      const darkBg = "#020617";
      globalScene.background = new THREE.Color(darkBg);
      globalScene.fog = new THREE.Fog(darkBg, 30, 160);

      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 0.2;
          child.material.needsUpdate = true;
        }
      });
    } else {
      // ORIGINAL LIGHT MODE: No fog and light background
      globalScene.background = new THREE.Color("#f0f9ff");
      globalScene.fog = null; // Eliminate fog completely

      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [isDark, globalScene, scene]);

  // --- 1. VISUAL CONFIGURATION AND ORIGINAL CALCULATIONS ---
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    setPinPosition(null);
    setPinLabel("");
    let userObject3DId = null;

    if (userFacultyId && locations.length > 0) {
      const fac = locations.find(l => String(l.id) === String(userFacultyId));
      if (fac && fac.object3d_id) {
        userObject3DId = fac.object3d_id;
        const obj = scene.getObjectByName(fac.object3d_id);
        if (obj) {
          const box = new THREE.Box3().setFromObject(obj.geometry ? obj : obj.children[0] || obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          setPinPosition([center.x, box.max.y + 15, center.z]);
          setPinLabel(fac.name);
        }
      }
    }

    const calculatedLabels = [];
    const processedObjects = new Set();
    locations.forEach((loc) => {
      if (!loc.object3d_id || loc.object3d_id === userObject3DId || processedObjects.has(loc.object3d_id)) return;
      const obj3d = scene.getObjectByName(loc.object3d_id);
      if (obj3d) {
        // Calculate bounding box for ENTIRE group (including all children)
        const box = new THREE.Box3();

        // Traverse entire group hierarchy to ensure we capture all meshes
        obj3d.traverse((child) => {
          if (child.isMesh && child.geometry) {
            const childBox = new THREE.Box3().setFromObject(child);
            box.union(childBox);
          }
        });

        // Fallback if no meshes found
        if (box.isEmpty()) {
          box.setFromObject(obj3d);
        }

        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        calculatedLabels.push({
          id: loc.id,
          name: loc.name,
          position: [center.x, box.max.y + 25, center.z],
          realCenter: center,
          width: size.x,
          depth: size.z,
          boundingBox: box // Store full bounding box for better proximity detection
        });
        processedObjects.add(loc.object3d_id);
      }
    });
    setDynamicLabels(calculatedLabels);
  }, [scene, locations, userFacultyId]);

  // GSAP ANIMATIONS (Fly to building, FPS landing)
  useGSAP(() => {
    if (!isFpsMode && targetLocation && targetLocation.object3d_id) {
      const targetObj = scene.getObjectByName(targetLocation.object3d_id);
      if (targetObj) {
        const box = new THREE.Box3().setFromObject(targetObj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const endPos = new THREE.Vector3(center.x + 60, center.y + 60, center.z + 60);
        gsap.to(camera.position, { x: endPos.x, y: endPos.y, z: endPos.z, duration: 1.5, ease: "power3.inOut" });
        if (controls) {
          gsap.to(controls.target, { x: center.x, y: center.y, z: center.z, duration: 1.5, ease: "power3.inOut", onUpdate: () => controls.update() });
        }
      }
    }
  }, [targetLocation, isFpsMode]);

  useGSAP(() => {
    if (isFpsMode) {
      // Always land at the CENTER of the map (0, 0)
      const mapCenterX = 0;
      const mapCenterZ = 0;
      const landingHeight = 2; // Player height

      // Animate camera to map center
      gsap.to(camera.position, {
        x: mapCenterX,
        y: landingHeight,
        z: mapCenterZ,
        duration: 3.0,
        ease: "power2.inOut"
      });

      // Point camera forward (looking towards positive Z)
      if (controls) {
        gsap.to(controls.target, {
          x: mapCenterX,
          y: landingHeight,
          z: mapCenterZ + 10, // Look forward
          duration: 3.0,
          ease: "power2.inOut"
        });
      }
    } else {
      gsap.to(camera.position, { y: 60, duration: 2.5, ease: "power2.inOut" });
    }
  }, [isFpsMode]);

  useFrame(() => {
    const userPos = camera.position;
    if (isFpsMode) {
      // Find nearest building
      let nearest = null;
      let minDist = Infinity;

      dynamicLabels.forEach((lbl) => {
        // Calculate distance to building center
        const distToCenter = Math.sqrt(
          Math.pow(userPos.x - lbl.realCenter.x, 2) +
          Math.pow(userPos.z - lbl.realCenter.z, 2)
        );

        // Adjust distance based on building size (larger buildings = easier to approach)
        // Subtract half the building's diagonal to get distance to edge
        const buildingRadius = Math.sqrt(
          Math.pow(lbl.width / 2, 2) +
          Math.pow(lbl.depth / 2, 2)
        );

        // Distance to building edge (not center)
        const distToEdge = Math.max(0, distToCenter - buildingRadius);

        if (distToEdge < minDist) {
          minDist = distToEdge;
          nearest = { ...lbl, distance: distToEdge, distToCenter: distToCenter };
        }
      });

      // Update nearest building reference
      nearestBuilding.current = nearest;

      // TIGHTER THRESHOLDS for better responsiveness
      const CARD_DISTANCE = 25;    // Distance to building edge
      const EVENTS_DISTANCE = 18;
      const VISIT_DISTANCE = 12;

      if (nearest && nearest.distance < CARD_DISTANCE) {
        // THRESHOLD 1: < 25m - Show BuildingInfoCard
        const originalLoc = locations.find(l => l.id === nearest.id);
        if (!originalLoc) return;

        // Always update to nearest building (improved switching)
        if (lastSelectedBuilding.current !== nearest.id) {
          if (onEdificioClick) {
            onEdificioClick(originalLoc.object3d_id);
          }
          lastSelectedBuilding.current = nearest.id;
        }

        // THRESHOLD 2: < 18m - Auto-open Events Modal (ONLY if events are happening NOW)
        if (nearest.distance < EVENTS_DISTANCE) {
          // Check if there are events happening RIGHT NOW
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          console.log('[EVENTS] Checking for active events at location:', originalLoc.name);
          console.log('[EVENTS] Current time (minutes):', currentTime, `(${now.getHours()}:${now.getMinutes()})`);
          console.log('📅 [EVENTS] Today:', today.toISOString());
          console.log('[EVENTS] Total events in system:', events.length);

          const hasActiveEvent = events.some(e => {
            if (String(e.location_id) !== String(originalLoc.id)) return false;

            console.log('[EVENTS] Checking event:', e.title, 'at location_id:', e.location_id);

            // Check if event is today
            const eventDate = new Date(e.date);
            eventDate.setHours(0, 0, 0, 0);
            console.log('📅 [EVENTS] Event date:', eventDate.toISOString(), 'vs Today:', today.toISOString());
            if (eventDate.getTime() !== today.getTime()) {
              console.log('[EVENTS] Event is not today');
              return false;
            }

            // Check if event is happening NOW
            if (e.time && e.end_time) {
              const [startH, startM] = e.time.split(':').map(Number);
              const [endH, endM] = e.end_time.split(':').map(Number);
              const startMinutes = startH * 60 + startM;
              const endMinutes = endH * 60 + endM;

              console.log('[EVENTS] Event time range:', `${e.time} - ${e.end_time}`, `(${startMinutes} - ${endMinutes} minutes)`);
              console.log('[EVENTS] Current time:', currentTime, 'minutes');

              // Event is active if current time is between start and end
              const isActive = currentTime >= startMinutes && currentTime <= endMinutes;
              console.log(isActive ? '[EVENTS] Event IS ACTIVE!' : '[EVENTS] Event is not active now');
              return isActive;
            }

            console.log('[EVENTS] Event missing time or end_time');
            return false;
          });

          console.log(hasActiveEvent ? '[EVENTS] Found active event! Opening modal...' : '[EVENTS] No active events found');

          if (hasActiveEvent && !notifiedEventsSession.current.has(originalLoc.id)) {
            console.log('[EVENTS] Triggering onEventFound for:', originalLoc.name);
            if (onEventFound) onEventFound(originalLoc);
            notifiedEventsSession.current.add(originalLoc.id);
            // Clear after 60 seconds to allow re-notification
            setTimeout(() => notifiedEventsSession.current.delete(originalLoc.id), 60000);
          } else if (hasActiveEvent) {
            console.log('[EVENTS] Event already notified in this session');
          }
        }

        // THRESHOLD 3: < 12m - Register Visit
        if (nearest.distance < VISIT_DISTANCE) {
          if (!visitedSession.current.has(originalLoc.id)) {
            if (onVisitRegistered) onVisitRegistered(originalLoc);
            visitedSession.current.add(originalLoc.id);
            // Clear after 5 minutes to allow re-visit
            setTimeout(() => visitedSession.current.delete(originalLoc.id), 300000);
          }
        }
      } else {
        // User moved away from all buildings (> 25m)
        if (lastSelectedBuilding.current !== null) {
          // Close BuildingInfoCard by triggering with null
          if (onEdificioClick) onEdificioClick(null);
          lastSelectedBuilding.current = null;
        }
      }
    } else {
      // Reset when not in FPS mode
      nearestBuilding.current = null;
      lastSelectedBuilding.current = null;
    }
  });

  const handleModelClick = (e) => {
    e.stopPropagation();
    if (isFpsMode) return;
    let currentObj = e.object;
    let foundName = null;
    let levels = 0;
    while (currentObj && levels < 5) {
      const match = locations.find(l => l.object3d_id === currentObj.name);
      if (match) { foundName = currentObj.name; break; }
      currentObj = currentObj.parent;
      if (currentObj && currentObj.type === 'Scene') break;
      levels++;
    }
    onEdificioClick(foundName || e.object.name);
  };

  return (
    <group dispose={null}>
      {/* LIGHTING: Strictly changes according to theme */}
      <ambientLight intensity={isDark ? 0.1 : 0.6} />
      <directionalLight
        position={[20, 50, 20]}
        intensity={isDark ? 0.4 : 1.2}
        color={isDark ? "#3b82f6" : "#ffffff"}
        castShadow
      />
      {isDark && <pointLight position={[0, 30, 0]} intensity={0.5} color="#06b6d4" />}

      <primitive
        object={scene}
        scale={1}
        onClick={handleModelClick}
        onPointerOver={() => { if (!isFpsMode) document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      />

      {/* LABELS: Visually adapt without adding extra elements to light mode */}
      {dynamicLabels.map((lbl) => (
        <React.Fragment key={lbl.id}>
          <Html position={lbl.position} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center">
              <div className={`backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl border-2 transform transition-all ${isDark ? 'bg-slate-900/90 border-cyan-500 text-cyan-400' : 'bg-white/95 border-[#1e3a8a] text-[#1e3a8a]'
                }`}>
                <p className="text-xs font-extrabold leading-none uppercase tracking-wide">
                  {lbl.name}
                </p>
              </div>
              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-[1px] ${isDark ? 'border-t-cyan-500' : 'border-t-[#1e3a8a]'
                }`}></div>
            </div>
          </Html>
        </React.Fragment>
      ))}

      {/* USER RED PIN */}
      {pinPosition && (
        <Html position={pinPosition} center distanceFactor={150}>
          <div className="flex flex-col items-center animate-bounce pointer-events-none">
            <div className={`backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl mb-2 border-2 ${isDark ? 'bg-slate-900/90 border-pink-500 text-pink-400' : 'bg-white/95 border-[#D9232D] text-[#D9232D]'
              }`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider text-center leading-none mb-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tu Facultad</p>
              <p className="text-sm font-extrabold whitespace-nowrap leading-none">{pinLabel}</p>
            </div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill={isDark ? "#ec4899" : "#D9232D"} stroke="white" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="white"></circle>
            </svg>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload('/mapa_uce.glb');