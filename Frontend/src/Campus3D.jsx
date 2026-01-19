import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';

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
  const { camera, controls } = useThree(); 

  const visitedSession = useRef(new Set());
  const notifiedEventsSession = useRef(new Set());

  const [pinPosition, setPinPosition] = useState(null);
  const [pinLabel, setPinLabel] = useState("");
  const [dynamicLabels, setDynamicLabels] = useState([]);

  // --- 1. CONFIGURACIÓN VISUAL Y CÁLCULOS ---
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1; 
          child.material.needsUpdate = true;
        }
      }
    });

    // Pin Rojo
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

    // Calcular Etiquetas, Posiciones y TAMAÑOS
    const calculatedLabels = [];
    const processedObjects = new Set();

    locations.forEach((loc) => {
        if (!loc.object3d_id) return;
        if (loc.object3d_id === userObject3DId) return; // Si tiene pin rojo, no ponemos etiqueta azul
        if (processedObjects.has(loc.object3d_id)) return;

        const obj3d = scene.getObjectByName(loc.object3d_id);
        if (obj3d) {
            const box = new THREE.Box3().setFromObject(obj3d);
            
            // Calculamos Centro
            const center = new THREE.Vector3();
            box.getCenter(center);

            // 🔥 NUEVO: Calculamos el TAMAÑO (Ancho y Profundidad) del edificio
            const size = new THREE.Vector3();
            box.getSize(size);
            
            calculatedLabels.push({
                id: loc.id, 
                name: loc.name,
                // Posición visual de la etiqueta
                position: [center.x, box.max.y + 25, center.z], 
                // Datos para lógica y dibujo
                realCenter: center,
                width: size.x, // Guardamos el ancho
                depth: size.z  // Guardamos el largo (profundidad)
            });
            processedObjects.add(loc.object3d_id);
        }
    });
    setDynamicLabels(calculatedLabels);

  }, [scene, locations, userFacultyId]);


  // --- 2. LÓGICA FRAME A FRAME ---
  useFrame((state) => {
    const userPos = camera.position;

    // A. MOVIMIENTO AUTOMÁTICO (SOLO EN MODO SATÉLITE)
    if (!isFpsMode && targetLocation && targetLocation.object3d_id) {
        const targetObj = scene.getObjectByName(targetLocation.object3d_id);
        if (targetObj) {
            const box = new THREE.Box3().setFromObject(targetObj);
            const center = new THREE.Vector3();
            box.getCenter(center);

            const desiredPos = new THREE.Vector3(center.x + 80, center.y + 80, center.z + 80);
            
            // Solo interpolamos si NO estamos en FPS
            state.camera.position.lerp(desiredPos, 0.05);
            
            if (controls) {
                controls.target.lerp(center, 0.05);
                controls.update();
            }
        }
    }

    // B. PROXIMIDAD (SOLO EN MODO FPS)
    if (isFpsMode) {
        dynamicLabels.forEach((lbl) => {
            // Usamos el centro real del objeto 3D
            const targetX = lbl.realCenter.x;
            const targetZ = lbl.realCenter.z;
            
            // Distancia 2D
            const dist = Math.sqrt(Math.pow(userPos.x - targetX, 2) + Math.pow(userPos.z - targetZ, 2));
            
            const originalLoc = locations.find(l => l.id === lbl.id);
            if (!originalLoc) return;

            // RANGO 1: EVENTOS (70 metros)
            if (dist < 70) {
                const hasEvent = events.some(e => String(e.location_id) === String(originalLoc.id));
                
                if (hasEvent && !notifiedEventsSession.current.has(originalLoc.id)) {
                    console.log(`🔔 ¡Evento cerca en ${lbl.name}!`);
                    if (onEventFound) onEventFound(originalLoc);
                    notifiedEventsSession.current.add(originalLoc.id);
                    setTimeout(() => notifiedEventsSession.current.delete(originalLoc.id), 60000); 
                }
            }

            // RANGO 2: VISITAS (30 metros)
            if (dist < 30) {
                if (!visitedSession.current.has(originalLoc.id)) {
                    console.log(`✅ Visita registrada en ${lbl.name}`);
                    if (onVisitRegistered) onVisitRegistered(originalLoc);
                    visitedSession.current.add(originalLoc.id);
                    setTimeout(() => visitedSession.current.delete(originalLoc.id), 300000); 
                }
            }
        });
    }
  });

  // --- 3. CLICKS ---
  const handleModelClick = (e) => {
    e.stopPropagation(); 
    
    // Si estamos caminando, el click NO debe teletransportar ni seleccionar
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
    const finalName = foundName || e.object.name;
    if (['Suelo', 'Plane', 'Road', 'Carretera', 'Grass'].some(n => finalName.includes(n))) return; 
    
    onEdificioClick(finalName);
  };

  return (
    <group dispose={null}>
      <primitive 
        object={scene} 
        scale={1} 
        onClick={handleModelClick}
        onPointerOver={() => { if (!isFpsMode) document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      />

      {/* ETIQUETAS DINÁMICAS + RECTÁNGULOS DE RANGO */}
      {dynamicLabels.map((lbl) => (
        <React.Fragment key={lbl.id}>
            
            {/* ETIQUETA AZUL (Tu diseño original) */}
            <Html 
                position={lbl.position} 
                center 
                distanceFactor={100} 
                zIndexRange={[50, 0]} 
                style={{ pointerEvents: 'none' }}
            >
                <div className="flex flex-col items-center pointer-events-none select-none opacity-90 hover:opacity-100 transition-opacity">
                    <div className="bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl border-2 border-[#1e3a8a] transform transition-transform">
                        <p className="text-xs font-extrabold text-[#1e3a8a] whitespace-nowrap leading-none uppercase tracking-wide">
                            {lbl.name}
                        </p>
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1e3a8a] -mt-[1px]"></div>
                </div>
            </Html>

            {/* 🔥 RECTÁNGULOS DE RANGO (Solo en FPS) */}
            {isFpsMode && (
                <group position={[lbl.realCenter.x, 0.5, lbl.realCenter.z]}>
                    
                    {/* 1. Borde "Wireframe" del edificio (Blanco sutil) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                        <planeGeometry args={[lbl.width + 2, lbl.depth + 2]} />
                        <meshBasicMaterial color="white" wireframe opacity={0.3} transparent />
                    </mesh>

                    {/* 2. Zona de Visita (Verde - Rectangular) 
                           Tamaño: Edificio + 25m de margen aprox */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[lbl.width + 25, lbl.depth + 25]} />
                        <meshBasicMaterial color="#10b981" transparent opacity={0.25} depthWrite={false} />
                    </mesh>
                    
                    {/* 3. Zona de Eventos (Amarillo - Rectangular) 
                           Tamaño: Edificio + 60m de margen aprox */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                        <planeGeometry args={[lbl.width + 60, lbl.depth + 60]} />
                        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} depthWrite={false} />
                    </mesh>

                </group>
            )}

        </React.Fragment>
      ))}

      {/* PIN ROJO (Tu Facultad - Tu diseño original) */}
      {pinPosition && (
        <Html position={pinPosition} center distanceFactor={150} zIndexRange={[100, 0]}>
             <div className="flex flex-col items-center animate-bounce select-none pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl mb-2 border-2 border-[#D9232D] transform transition-transform hover:scale-110">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-none mb-0.5">Tu Facultad</p>
                    <p className="text-sm font-extrabold text-[#D9232D] whitespace-nowrap leading-none">{pinLabel}</p>
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#D9232D] -mt-2 mb-1"></div>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#D9232D" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg filter" style={{ filter: "drop-shadow(0px 5px 3px rgba(0,0,0,0.3))" }}>
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