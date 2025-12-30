import React from 'react';

export function UCELogoImage({ className }) {
  return (
    // Contenedor para centrar y controlar el tamaño
    <div className={`flex items-center justify-center p-2 ${className}`}>
      <img
        src="/uce-logo.png" // Ruta a la imagen en la carpeta 'public'
        alt="Escudo Universidad Central del Ecuador"
        className="w-24 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
      />
    </div>
  );
}
