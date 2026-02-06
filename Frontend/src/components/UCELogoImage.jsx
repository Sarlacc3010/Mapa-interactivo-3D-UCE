import React from 'react';

export function UCELogoImage({ className }) {
  return (
    // Container to center and control size
    <div className={`flex items-center justify-center p-2 ${className}`}>
      <img
        src="/uce-logo.png" // Path to image in 'public' folder
        alt="Escudo Universidad Central del Ecuador"
        className="w-24 h-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
      />
    </div>
  );
}
