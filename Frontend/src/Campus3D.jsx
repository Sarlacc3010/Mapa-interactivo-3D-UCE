import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, Html } from '@react-three/drei';

export default function Campus3D({ 
  onEdificioClick, 
  targetLocation, 
  locations = [], 
  events = [], 
  userFacultyId, // ID de la facultad del usuario
  onEventFound 
}) {
  const { scene } = useGLTF('/mapa_uce.glb'); 
  const { camera, controls } = useThree(); 

  const visited = useRef(new Set());
  const notified = useRef(new Set());

  // Estado para el Pin Flotante
  const [pinPosition, setPinPosition] = useState(null);
  const [pinLabel, setPinLabel] = useState("");

  // --- 1. CONFIGURACIÓN VISUAL Y PIN FLOTANTE ---
  useEffect(() => {
    // A. Configuración básica de escena (Sombras y Luces)
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

    // B. Lógica del Pin Flotante (Anti-Crash)
    setPinPosition(null); 
    setPinLabel("");

    if (userFacultyId && locations.length > 0) {
        const fac = locations.find(l => String(l.id) === String(userFacultyId));
        
        if (fac && fac.object3d_id) {
            const obj = scene.getObjectByName(fac.object3d_id);
            
            if (obj) {
                // Buscamos geometría válida (Drill Down)
                let meshTarget = obj;

                if (!obj.geometry) {
                    const childMesh = obj.children.find(c => c.isMesh && c.geometry);
                    if (childMesh) {
                        meshTarget = childMesh;
                    } else {
                        console.warn(`⚠️ El objeto '${fac.object3d_id}' no tiene geometría válida para el Pin.`);
                        return; 
                    }
                }

                const center = new THREE.Vector3();
                if (meshTarget.geometry) {
                    meshTarget.geometry.computeBoundingBox();
                    if (meshTarget.geometry.boundingBox) {
                        meshTarget.geometry.boundingBox.getCenter(center);
                        meshTarget.localToWorld(center);
                        
                        setPinPosition([center.x, center.y + 25, center.z]);
                        setPinLabel(fac.name);
                    }
                }
            }
        }
    }
  }, [scene, userFacultyId, locations]);

  // --- 2. LOGICA POR FRAME ---
  useFrame((state) => {
    const userPos = camera.position;

    // A. MOVIMIENTO DE CÁMARA
    if (targetLocation && targetLocation.object3d_id) {
        const targetObj = scene.getObjectByName(targetLocation.object3d_id);
        
        if (targetObj) {
            let targetMesh = targetObj;
            if (!targetMesh.geometry && targetMesh.children.length > 0) {
                const child = targetMesh.children.find(c => c.isMesh && c.geometry);
                if (child) targetMesh = child;
            }

            if (targetMesh.geometry) {
                const center = new THREE.Vector3();
                targetMesh.geometry.computeBoundingBox();
                if (targetMesh.geometry.boundingBox) {
                    targetMesh.geometry.boundingBox.getCenter(center);
                    targetMesh.localToWorld(center);

                    const offset = 80; 
                    const desiredPos = new THREE.Vector3(
                        center.x + offset, 
                        center.y + offset, 
                        center.z + offset
                    );
                    state.camera.position.lerp(desiredPos, 0.05);
                    if (controls) {
                        controls.target.lerp(center, 0.05);
                        controls.update();
                    }
                }
            }
        }
    }

    // B. VISITAS Y EVENTOS
    locations.forEach((loc) => {
      if (!loc.position || loc.position.length !== 3) return;

      const buildingPos = new THREE.Vector3(loc.position[0], loc.position[1], loc.position[2]);
      const distance = userPos.distanceTo(buildingPos);

      // Alerta Evento (15m)
      if (distance < 15) {
        if (!notified.current.has(loc.id)) {
          const eventHere = events.find(e => 
            (e.location_name === loc.name) || (String(e.location_id) === String(loc.id))
          );
          if (eventHere && onEventFound) {
            onEventFound(eventHere);
            notified.current.add(loc.id);
            setTimeout(() => notified.current.delete(loc.id), 60000);
          }
        }
      }

      // Registro Visita (8m)
      if (distance < 8) {
        if (!visited.current.has(loc.id)) {
          fetch('http://localhost:5000/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ location_id: loc.id })
          }).catch(err => console.error(err));

          visited.current.add(loc.id); 
          setTimeout(() => visited.current.delete(loc.id), 120000);
        }
      }
    });
  });

  // --- 3. MANEJO DE CLICKS INTELIGENTE (Bubble Up) ---
  const handleModelClick = (e) => {
    e.stopPropagation(); 
    
    // 1. Objeto original clickeado (puede ser una ventana, puerta, o parte pequeña)
    let currentObj = e.object;
    let foundName = null;

    // 2. Subimos por la jerarquía hasta encontrar un nombre que esté en la BD
    // (Máximo subimos 5 niveles para evitar bucles infinitos, aunque en Three.js no suele pasar)
    let levels = 0;
    while (currentObj && levels < 5) {
        // ¿El nombre de este objeto existe en nuestra lista de locations?
        const match = locations.find(l => l.object3d_id === currentObj.name);
        
        if (match) {
            foundName = currentObj.name; // ¡Encontrado! Es el padre/grupo reconocido
            break;
        }

        // Si no, subimos al padre
        currentObj = currentObj.parent;
        // Si llegamos a la Escena raíz, paramos
        if (currentObj && currentObj.type === 'Scene') break;
        levels++;
    }

    // 3. Si no encontramos coincidencia en la jerarquía, usamos el nombre original
    // (Por si acaso es un objeto decorativo o el suelo)
    const finalName = foundName || e.object.name;

    // Filtro de objetos ignorados
    if (finalName === 'Suelo' || finalName === 'Plane' || finalName.includes('Road') || finalName.includes('Carretera')) {
        return; 
    }
    
    console.log(`🖱️ Click: Parte='${e.object.name}' -> Identificado='${finalName}'`); 
    
    // Enviamos el nombre "Padre" que sí existe en la BD
    onEdificioClick(finalName);
  };

  return (
    <group dispose={null}>
      <primitive 
        object={scene} 
        scale={1} 
        onClick={handleModelClick}
        onPointerOver={(e) => {
           // Usamos la misma lógica para el cursor
           let obj = e.object;
           let isInteractive = false;
           let i = 0;
           while(obj && i < 5) {
               if(locations.some(l => l.object3d_id === obj.name)) {
                   isInteractive = true;
                   break;
               }
               obj = obj.parent;
               i++;
           }
           
           if (isInteractive) {
               document.body.style.cursor = 'pointer';
           }
        }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      />

      {/* PIN FLOTANTE */}
      {pinPosition && (
        <Html position={pinPosition} center distanceFactor={150} zIndexRange={[100, 0]}>
            <div className="flex flex-col items-center pointer-events-none animate-bounce select-none">
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