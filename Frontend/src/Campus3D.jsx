import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei'; // <--- Importamos el cargador
import { locations } from './data/locations';

export default function Campus3D({ onEdificioClick }) {
  // 1. CARGAMOS EL MODELO GLB
  // Asegúrate de que el nombre coincida con el archivo en 'public'
  const { scene } = useGLTF('/mapa_uce.glb'); 

  return (
    <group dispose={null}>
      
      {/* --- A. TU MODELO 3D REAL --- */}
      {/* Lo renderizamos como un objeto primitivo */}
      <primitive 
        object={scene} 
        position={[0, 0, 0]} // Ajusta esto si tu modelo no está centrado
        scale={1}           // Ajusta el tamaño si se ve muy chico o grande
      />

      {/* --- B. ZONAS DE CLIC (HITBOXES) --- */}
      {/* Mantenemos los cubos en las mismas coordenadas que definiste en locations.js
          pero los hacemos INVISIBLES. Sirven solo para detectar el clic.
      */}
      {locations.map((loc, index) => {
        const position = loc.position || [0, 0, 0];
        const size = loc.size || [10, 10, 10];
        
        const [x, y, z] = position;
        const height = size[1];
        const fixedY = (height / 2); 

        return (
          <mesh
            key={index}
            position={[x, fixedY, z]} 
            onClick={(e) => {
              e.stopPropagation();
              onEdificioClick(loc.name || "Edificio");
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
            visible={false} // <--- ¡TRUCO! Están ahí, pero no se ven.
          >
            <boxGeometry args={size} />
            <meshBasicMaterial color="red" wireframe />
          </mesh>
        );
      })}

    </group>
  );
}

// Esto precarga el modelo para que no haya pausa al iniciar
useGLTF.preload('/mapa_uce.glb');