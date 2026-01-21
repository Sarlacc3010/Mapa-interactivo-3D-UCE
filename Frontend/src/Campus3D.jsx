import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';

// 🔥 IMPORTAMOS GSAP
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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

    // Calcular Etiquetas
    const calculatedLabels = [];
    const processedObjects = new Set();

    locations.forEach((loc) => {
        if (!loc.object3d_id) return;
        if (loc.object3d_id === userObject3DId) return; 
        if (processedObjects.has(loc.object3d_id)) return;

        const obj3d = scene.getObjectByName(loc.object3d_id);
        if (obj3d) {
            const box = new THREE.Box3().setFromObject(obj3d);
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
                depth: size.z
            });
            processedObjects.add(loc.object3d_id);
        }
    });
    setDynamicLabels(calculatedLabels);

  }, [scene, locations, userFacultyId]);

  // 🔥 ANIMACIÓN 1: VUELO A EDIFICIO (Click en Mapa)
  useGSAP(() => {
    if (!isFpsMode && targetLocation && targetLocation.object3d_id) {
      const targetObj = scene.getObjectByName(targetLocation.object3d_id);
      
      if (targetObj) {
        const box = new THREE.Box3().setFromObject(targetObj);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const endPos = new THREE.Vector3(center.x + 60, center.y + 60, center.z + 60);

        gsap.to(camera.position, {
          x: endPos.x,
          y: endPos.y,
          z: endPos.z,
          duration: 1.5,
          ease: "power3.inOut"
        });

        if (controls) {
          gsap.to(controls.target, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 1.5,
            ease: "power3.inOut",
            onUpdate: () => controls.update()
          });
        }
      }
    }
  }, [targetLocation, isFpsMode]);

  // 🔥 ANIMACIÓN 2: ATERRIZAJE Y DESPEGUE (Cambio de Modo)
  useGSAP(() => {
    if (isFpsMode) {
      // 🛬 ATERRIZAJE: De Satélite a Primera Persona
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      if (direction.y > -0.1) direction.y = -0.1;

      // Calculamos dónde aterrizar (intersección con Y=2)
      const t = (2 - camera.position.y) / direction.y;
      
      let targetX = camera.position.x + direction.x * t;
      let targetZ = camera.position.z + direction.z * t;

      // Seguridad: Si el punto está lejísimos, aterrizamos a 30m adelante
      const dist = Math.sqrt(Math.pow(targetX - camera.position.x, 2) + Math.pow(targetZ - camera.position.z, 2));
      if (dist > 100 || dist < 0) {
          targetX = camera.position.x + direction.x * 30;
          targetZ = camera.position.z + direction.z * 30;
      }

      // 1. Mover el cuerpo (Cámara)
      gsap.to(camera.position, {
        x: targetX,
        y: 2, 
        z: targetZ,
        duration: 3.0,          // <--- 3 SEGUNDOS (Lento y suave)
        ease: "power2.inOut"
      });

      // 2. Mover la mirada (Enderezar al frente)
      if (controls) {
          gsap.to(controls.target, {
              x: targetX + direction.x, // Mirar 1 metro adelante
              y: 2,                     // Mirar a la altura de los ojos (horizonte)
              z: targetZ + direction.z,
              duration: 3.0,            // Sincronizado
              ease: "power2.inOut"
          });
      }

    } else {
      // 🛫 DESPEGUE: De Primera Persona a Satélite
      gsap.to(camera.position, {
        y: 60, 
        duration: 2.5,          // Subida un poco más dinámica
        ease: "power2.inOut"
      });
    }
  }, [isFpsMode]);

  // --- 2. LÓGICA FRAME A FRAME ---
  useFrame((state) => {
    const userPos = camera.position;

    // B. PROXIMIDAD (SOLO EN MODO FPS)
    if (isFpsMode) {
        dynamicLabels.forEach((lbl) => {
            const targetX = lbl.realCenter.x;
            const targetZ = lbl.realCenter.z;
            const dist = Math.sqrt(Math.pow(userPos.x - targetX, 2) + Math.pow(userPos.z - targetZ, 2));
            
            const originalLoc = locations.find(l => l.id === lbl.id);
            if (!originalLoc) return;

            // RANGO 1: EVENTOS (70m)
            if (dist < 70) {
                const hasEvent = events.some(e => String(e.location_id) === String(originalLoc.id));
                if (hasEvent && !notifiedEventsSession.current.has(originalLoc.id)) {
                    console.log(`🔔 ¡Evento cerca en ${lbl.name}!`);
                    if (onEventFound) onEventFound(originalLoc);
                    notifiedEventsSession.current.add(originalLoc.id);
                    setTimeout(() => notifiedEventsSession.current.delete(originalLoc.id), 60000); 
                }
            }

            // RANGO 2: VISITAS (30m)
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

      {/* ETIQUETAS DINÁMICAS */}
      {dynamicLabels.map((lbl) => (
        <React.Fragment key={lbl.id}>
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

            {isFpsMode && (
                <group position={[lbl.realCenter.x, 0.5, lbl.realCenter.z]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                        <planeGeometry args={[lbl.width + 2, lbl.depth + 2]} />
                        <meshBasicMaterial color="white" wireframe opacity={0.3} transparent />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[lbl.width + 25, lbl.depth + 25]} />
                        <meshBasicMaterial color="#10b981" transparent opacity={0.25} depthWrite={false} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                        <planeGeometry args={[lbl.width + 60, lbl.depth + 60]} />
                        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} depthWrite={false} />
                    </mesh>
                </group>
            )}
        </React.Fragment>
      ))}

      {/* PIN ROJO */}
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