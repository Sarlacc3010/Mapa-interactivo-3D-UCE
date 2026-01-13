import React from "react";
import { UCELogoImage } from "./UCELogoImage";
import { cn } from "./ui/shim";

export function Header({ className, children }) {
  return (
    <header className={cn("w-full p-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/20 z-50", className)}>

      {/* Lado Izquierdo: Siempre es el Logo y Título */}
      <div className="flex items-center gap-3 select-none">
        <UCELogoImage className="w-16 h-auto object-contain drop-shadow-md" />
        {/* Separador vertical sutil */}
        <div className="h-10 w-px bg-white/20 hidden sm:block"></div>

        {/* Textos */}
        <div className="text-white flex flex-col justify-center">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest leading-none text-shadow-sm">
            Universidad Central
          </h2>
          <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">
            del Ecuador
          </span>
          {/* Lema en latín - visible solo en pantallas medianas hacia arriba */}
          <p className="hidden md:block text-[10px] text-blue-200 italic font-serif mt-0.5 tracking-wider opacity-80">
            "Omnium Potentior Est Sapientia"
          </p>
        </div>
      </div>

      {/* Lado Derecho: Aquí ponemos lo que cambie (Botones, Buscador, etc.) */}
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}