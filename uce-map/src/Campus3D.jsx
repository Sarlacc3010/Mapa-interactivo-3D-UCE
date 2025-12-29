import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function Campus3D({ onEdificioClick }) {
  // Carga el modelo desde la carpeta public
  const { scene } = useGLTF('/mapa_uce.glb'); 

  return (
    <primitive 
      object={scene} 
      scale={1}
      // Manejador de clics en los edificios
      onClick={(e) => {
        e.stopPropagation(); // Evita que el clic traspase al suelo
        // Si el objeto tiene nombre (definido en Blender), lo pasamos
        if (onEdificioClick) {
            console.log("Clic en objeto 3D:", e.object.name);
            onEdificioClick(e.object.name);
        }
      }}
    />
  );
}

// Precarga el modelo para que la web inicie rápido
useGLTF.preload('/mapa_uce.glb');