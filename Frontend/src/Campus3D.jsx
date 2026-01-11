import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { locations } from './data/locations'; // Asegúrate de que este archivo exista

export default function Campus3D({ onEdificioClick, events = [], onEventFound }) {
  const { scene } = useGLTF('/mapa_uce.glb');
  const { camera } = useThree(); 

  const visited = useRef(new Set());
  const notified = useRef(new Set());

  useFrame(() => {
    const userPos = camera.position;

    locations.forEach((loc) => {
      // Validación de seguridad por si loc.position no existe
      if (!loc.position) return;

      const buildingPos = new THREE.Vector3(loc.position[0], loc.position[1], loc.position[2]);
      const distance = userPos.distanceTo(buildingPos);

      // --- 1. ALERTA DE EVENTO (15m) ---
      if (distance < 15) {
        if (!notified.current.has(loc.id)) {
          // Buscamos si hay un evento en esta ubicación
          const eventHere = events.find(e => 
            (e.location_name && e.location_name === loc.name) || 
            (e.location_id && String(e.location_id) === String(loc.id))
          );

          if (eventHere && onEventFound) {
            onEventFound(eventHere);
            notified.current.add(loc.id);
            // No volver a notificar por 1 minuto
            setTimeout(() => notified.current.delete(loc.id), 60000);
          }
        }
      }

      // --- 2. REGISTRO DE VISITA (8m) ---
      if (distance < 8) {
        if (!visited.current.has(loc.id)) {
          console.log(`📍 Visitando: ${loc.name}`);
          
          const token = localStorage.getItem('token');
          
          // Solo intentamos registrar si hay token (usuario logueado)
          if (token) {
            fetch('http://localhost:5000/visits', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                location_id: loc.id // Usamos el ID, no el nombre
              })
            }).catch(err => console.error("Error registrando visita:", err));
          }

          visited.current.add(loc.id); 
          // No volver a registrar visita por 2 minutos
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

// Pre-carga del modelo para mejorar el rendimiento
useGLTF.preload('/mapa_uce.glb');