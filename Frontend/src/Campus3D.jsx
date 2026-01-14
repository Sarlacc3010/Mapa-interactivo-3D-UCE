import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// Recibimos 'locations' como prop (desde la BD en App.jsx) en lugar de importarlo localmente
export default function Campus3D({ onEdificioClick, targetLocation, locations = [], events = [], onEventFound }) {
  // Asegúrate de que el nombre del archivo coincida con el que tienes en public/
  const { scene } = useGLTF('/mapa_uce.glb'); 
  const { camera, controls } = useThree(); 

  const visited = useRef(new Set());
  const notified = useRef(new Set());

  // --- 1. CONFIGURACIÓN VISUAL (Luces y Sombras) ---
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Esto ayuda si las texturas se ven muy oscuras o planas
        if (child.material) {
          child.material.envMapIntensity = 1; 
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  // --- 2. LOGICA POR FRAME (Animaciones y Distancia) ---
  useFrame((state) => {
    const userPos = camera.position;

    // A. MOVIMIENTO DE CÁMARA (Viaje suave al objetivo)
    if (targetLocation && targetLocation.object3d_id) {
        const targetObj = scene.getObjectByName(targetLocation.object3d_id);
        
        if (targetObj) {
            // Calculamos el centro del objeto 3D
            const center = new THREE.Vector3();
            targetObj.geometry.computeBoundingBox();
            targetObj.geometry.boundingBox.getCenter(center);
            targetObj.localToWorld(center);

            // Movemos la cámara cerca del objeto (ajusta el +20/+20/+20 según el tamaño de tu mapa)
            const desiredPos = new THREE.Vector3(center.x + 30, center.y + 30, center.z + 30);
            
            // Interpolación (Lerp) para movimiento suave
            state.camera.position.lerp(desiredPos, 0.05);
            if (controls) {
                controls.target.lerp(center, 0.05);
                controls.update();
            }
        }
    }

    // B. LOGICA DE VISITAS Y EVENTOS (Solo si las locations tienen coordenadas)
    locations.forEach((loc) => {
      // Si la BD no tiene coordenadas guardadas, saltamos esta parte
      if (!loc.position || loc.position.length !== 3) return;

      const buildingPos = new THREE.Vector3(loc.position[0], loc.position[1], loc.position[2]);
      const distance = userPos.distanceTo(buildingPos);

      // Alerta de Evento (15m)
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

      // Registro de Visita (8m)
      if (distance < 8) {
        if (!visited.current.has(loc.id)) {
          console.log(`📍 Visitando: ${loc.name}`);
          const token = localStorage.getItem('token'); // O leer cookie si prefieres
          if (token) {
            fetch('http://localhost:5000/visits', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ location_id: loc.id })
            }).catch(err => console.error("Error visita:", err));
          }
          visited.current.add(loc.id); 
          setTimeout(() => visited.current.delete(loc.id), 120000);
        }
      }
    });
  });

  // --- 3. MANEJO DE CLICKS ---
  const handleModelClick = (e) => {
    e.stopPropagation(); // Evita clics dobles

    const objectName = e.object.name;

    // A. IGNORAR SUELO (Lista negra de nombres)
    // Asegúrate de que tu plano en Blender se llame "Suelo", "Plane", o contenga "Road"
    if (objectName === 'Suelo' || objectName === 'Plane' || objectName.includes('Road') || objectName.includes('Carretera')) {
        return; 
    }

    // B. ENVIAR ID AL PADRE
    // Enviamos el nombre tal cual sale de Blender (ej: "fac_ingenieria")
    // App.jsx lo buscará en la base de datos por 'object3d_id'
    console.log("Objeto 3D clickeado:", objectName);
    onEdificioClick(objectName);
  };

  return (
    <group dispose={null}>
      <primitive 
        object={scene} 
        position={[0, 0, 0]} 
        scale={1} 
        onClick={handleModelClick}
        // Cambio de cursor inteligente
        onPointerOver={(e) => {
           const name = e.object.name;
           const isIgnored = name === 'Suelo' || name === 'Plane' || name.includes('Road');
           if (!isIgnored) {
               document.body.style.cursor = 'pointer';
           }
        }}
        onPointerOut={() => {
            document.body.style.cursor = 'default';
        }}
      />
    </group>
  );
}

useGLTF.preload('/mapa_uce.glb');