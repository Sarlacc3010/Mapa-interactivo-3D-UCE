import React from "react";
import { UCELogoImage } from "./UCELogoImage";
import { cn } from "./ui/shim";

export function Header({ className, children }) {
  return (
    <header className={cn("w-full p-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/20 z-50", className)}>
      
      {/* Lado Izquierdo: Siempre es el Logo y Título */}
      <div className="flex items-center gap-3 select-none">
        <UCELogoImage className="w-10 h-10 p-0" /> 
        <div className="text-white">
          <h2 className="text-sm font-bold uppercase tracking-wider leading-tight text-shadow-sm">
            Universidad Central del Ecuador
          </h2>
          <p className="text-[10px] text-white/80 font-light">Omnium Potentior est Sapientia</p>
        </div>
      </div>

      {/* Lado Derecho: Aquí ponemos lo que cambie (Botones, Buscador, etc.) */}
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}