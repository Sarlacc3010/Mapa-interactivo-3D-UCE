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

    // B. Lógica del Pin Flotante
    setPinPosition(null); // Reseteamos primero
    setPinLabel("");

    if (userFacultyId && locations.length > 0) {
        // Buscamos la facultad del usuario en la lista
        const fac = locations.find(l => String(l.id) === String(userFacultyId));
        
        if (fac && fac.object3d_id) {
            // Buscamos el objeto 3D real en la escena
            const obj = scene.getObjectByName(fac.object3d_id);
            
            if (obj) {
                // Calculamos el centro exacto del edificio
                const center = new THREE.Vector3();
                obj.geometry.computeBoundingBox();
                obj.geometry.boundingBox.getCenter(center);
                obj.localToWorld(center);
                
                // Guardamos la posición, sumando altura (Y + 25) para que flote encima
                setPinPosition([center.x, center.y + 25, center.z]);
                setPinLabel(fac.name);
            } else {
                console.warn(`⚠️ No se encontró el objeto 3D: ${fac.object3d_id}`);
            }
        }
    }
  }, [scene, userFacultyId, locations]);

  // --- 2. LOGICA POR FRAME (Cámara, Visitas, Eventos) ---
  useFrame((state) => {
    const userPos = camera.position;

    // A. MOVIMIENTO DE CÁMARA
    if (targetLocation && targetLocation.object3d_id) {
        const targetObj = scene.getObjectByName(targetLocation.object3d_id);
        if (targetObj) {
            const center = new THREE.Vector3();
            targetObj.geometry.computeBoundingBox();
            targetObj.geometry.boundingBox.getCenter(center);
            targetObj.localToWorld(center);

            const desiredPos = new THREE.Vector3(center.x + 30, center.y + 30, center.z + 30);
            state.camera.position.lerp(desiredPos, 0.05);
            if (controls) {
                controls.target.lerp(center, 0.05);
                controls.update();
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
          // console.log(`📍 Visitando: ${loc.name}`);
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

  // --- 3. MANEJO DE CLICKS ---
  const handleModelClick = (e) => {
    e.stopPropagation(); 
    const objectName = e.object.name;

    // Ignorar objetos irrelevantes
    if (objectName === 'Suelo' || objectName === 'Plane' || objectName.includes('Road') || objectName.includes('Carretera')) {
        return; 
    }
    
    // --- LOG RESTAURADO ---
    console.log("🖱️ Objeto clickeado en Blender:", objectName); 
    
    onEdificioClick(objectName);
  };

  return (
    <group dispose={null}>
      <primitive 
        object={scene} 
        scale={1} 
        onClick={handleModelClick}
        onPointerOver={(e) => {
           const name = e.object.name;
           const isIgnored = name === 'Suelo' || name === 'Plane' || name.includes('Road');
           if (!isIgnored) {
               document.body.style.cursor = 'pointer';
           }
        }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      />

      {/* --- PIN FLOTANTE (HTML dentro del Canvas) --- */}
      {pinPosition && (
        <Html position={pinPosition} center distanceFactor={150} zIndexRange={[100, 0]}>
            <div className="flex flex-col items-center pointer-events-none animate-bounce select-none">
                
                {/* Etiqueta con el nombre */}
                <div className="bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-xl mb-2 border-2 border-[#D9232D] transform transition-transform hover:scale-110">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center leading-none mb-0.5">Tu Facultad</p>
                    <p className="text-sm font-extrabold text-[#D9232D] whitespace-nowrap leading-none">{pinLabel}</p>
                </div>

                {/* Triangulito (Flecha abajo) */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#D9232D] -mt-2 mb-1"></div>

                {/* Icono de Pin (SVG Vectorial) */}
                <svg 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="#D9232D" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="drop-shadow-lg filter"
                  style={{ filter: "drop-shadow(0px 5px 3px rgba(0,0,0,0.3))" }}
                >
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