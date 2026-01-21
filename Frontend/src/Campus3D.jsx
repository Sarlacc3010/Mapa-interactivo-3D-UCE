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
  const [pinPosition, setPinPosition] = useState(null);
  const [pinLabel, setPinLabel] = useState("");
  const [dynamicLabels, setDynamicLabels] = useState([]);

  // --- 🌙 LÓGICA DE AMBIENTE (DÍA/NOCHE) ---
  useEffect(() => {
    if (isDark) {
      // EFECTOS MODO OSCURO: Niebla y fondo nocturno
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
      // MODO CLARO ORIGINAL: Sin niebla y fondo claro
      globalScene.background = new THREE.Color("#f0f9ff");
      globalScene.fog = null; // 🔥 Eliminamos la niebla por completo
      
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMapIntensity = 1;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [isDark, globalScene, scene]);

  // --- 1. CONFIGURACIÓN VISUAL Y CÁLCULOS ORIGINALES ---
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
            const box = new THREE.Box3().setFromObject(obj3d);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            calculatedLabels.push({
                id: loc.id, name: loc.name, position: [center.x, box.max.y + 25, center.z], 
                realCenter: center, width: size.x, depth: size.z
            });
            processedObjects.add(loc.object3d_id);
        }
    });
    setDynamicLabels(calculatedLabels);
  }, [scene, locations, userFacultyId]);

  // 🔥 ANIMACIONES GSAP (Vuelo a edificio, aterrizaje FPS)
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
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      if (direction.y > -0.1) direction.y = -0.1;
      const t = (2 - camera.position.y) / direction.y;
      let targetX = camera.position.x + direction.x * t;
      let targetZ = camera.position.z + direction.z * t;
      gsap.to(camera.position, { x: targetX, y: 2, z: targetZ, duration: 3.0, ease: "power2.inOut" });
      if (controls) {
          gsap.to(controls.target, { x: targetX + direction.x, y: 2, z: targetZ + direction.z, duration: 3.0, ease: "power2.inOut" });
      }
    } else {
      gsap.to(camera.position, { y: 60, duration: 2.5, ease: "power2.inOut" });
    }
  }, [isFpsMode]);

  useFrame(() => {
    const userPos = camera.position;
    if (isFpsMode) {
        dynamicLabels.forEach((lbl) => {
            const dist = Math.sqrt(Math.pow(userPos.x - lbl.realCenter.x, 2) + Math.pow(userPos.z - lbl.realCenter.z, 2));
            const originalLoc = locations.find(l => l.id === lbl.id);
            if (!originalLoc) return;
            if (dist < 70) {
                const hasEvent = events.some(e => String(e.location_id) === String(originalLoc.id));
                if (hasEvent && !notifiedEventsSession.current.has(originalLoc.id)) {
                    if (onEventFound) onEventFound(originalLoc);
                    notifiedEventsSession.current.add(originalLoc.id);
                    setTimeout(() => notifiedEventsSession.current.delete(originalLoc.id), 60000); 
                }
            }
            if (dist < 30) {
                if (!visitedSession.current.has(originalLoc.id)) {
                    if (onVisitRegistered) onVisitRegistered(originalLoc);
                    visitedSession.current.add(originalLoc.id);
                    setTimeout(() => visitedSession.current.delete(originalLoc.id), 300000); 
                }
            }
        });
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
      {/* 💡 ILUMINACIÓN: Cambia estrictamente según el tema */}
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

      {/* ETIQUETAS: Se adaptan visualmente sin añadir elementos extra al modo claro */}
      {dynamicLabels.map((lbl) => (
        <React.Fragment key={lbl.id}>
            <Html position={lbl.position} center distanceFactor={100} style={{ pointerEvents: 'none' }}>
                <div className="flex flex-col items-center">
                    <div className={`backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl border-2 transform transition-all ${
                      isDark ? 'bg-slate-900/90 border-cyan-500 text-cyan-400' : 'bg-white/95 border-[#1e3a8a] text-[#1e3a8a]'
                    }`}>
                        <p className="text-xs font-extrabold leading-none uppercase tracking-wide">
                            {lbl.name}
                        </p>
                    </div>
                    <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-[1px] ${
                      isDark ? 'border-t-cyan-500' : 'border-t-[#1e3a8a]'
                    }`}></div>
                </div>
            </Html>
        </React.Fragment>
      ))}

      {/* PIN ROJO DE USUARIO */}
      {pinPosition && (
        <Html position={pinPosition} center distanceFactor={150}>
             <div className="flex flex-col items-center animate-bounce pointer-events-none">
                <div className={`backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl mb-2 border-2 ${
                  isDark ? 'bg-slate-900/90 border-pink-500 text-pink-400' : 'bg-white/95 border-[#D9232D] text-[#D9232D]'
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