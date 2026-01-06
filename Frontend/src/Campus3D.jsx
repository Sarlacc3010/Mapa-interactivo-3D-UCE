import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { locations } from './data/locations';

export default function Campus3D({ onEdificioClick, events, onEventFound }) {
  const { scene } = useGLTF('/mapa_uce.glb');
  const { camera } = useThree(); 

  const visited = useRef(new Set());
  const notified = useRef(new Set());

  useFrame(() => {
    const userPos = camera.position;

    locations.forEach((loc) => {
      const position = loc.position || [0, 0, 0];
      const buildingPos = new THREE.Vector3(position[0], position[1], position[2]);
      const distance = userPos.distanceTo(buildingPos);

      // --- 1. ALERTA DE EVENTO (15m) ---
      if (distance < 15) {
        if (!notified.current.has(loc.id)) {
          const eventHere = events && events.find(e => 
            (e.location && loc.name && e.location.toLowerCase().includes(loc.name.toLowerCase())) || 
            e.location === loc.id
          );

          if (eventHere) {
            onEventFound(eventHere);
            notified.current.add(loc.id);
            setTimeout(() => notified.current.delete(loc.id), 60000);
          }
        }
      }

      // --- 2. REGISTRO DE VISITA (8m) ---
      if (distance < 8) {
        if (!visited.current.has(loc.id)) {
          console.log(`📍 Visitando: ${loc.name}`);
          
          // === RECUPERAR EL TOKEN DEL NAVEGADOR ===
          const token = localStorage.getItem('token');
          
          fetch('http://localhost:5000/visits', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              // === ENVIAR TOKEN AL BACKEND ===
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              location_id: loc.name
              // Ya no enviamos user_email aquí, el backend lo saca del token
            })
          }).catch(err => console.error("Error API:", err));

          visited.current.add(loc.id); 
          setTimeout(() => visited.current.delete(loc.id), 120000);
        }
      }
    });
  });

  const handleModelClick = (e) => {
    e.stopPropagation();
    const clickedMeshName = e.object.name; 
    const locationFound = locations.find(loc => loc.id === clickedMeshName);
    if (locationFound) onEdificioClick(locationFound.name);
  };

  return (
    <group dispose={null}>
      <primitive 
        object={scene} 
        position={[0, 0, 0]} 
        scale={1} 
        onClick={handleModelClick}
        onPointerOver={(e) => {
           const isInteractive = locations.some(l => l.id === e.object.name);
           if (isInteractive) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      />
    </group>
  );
}

useGLTF.preload('/mapa_uce.glb');