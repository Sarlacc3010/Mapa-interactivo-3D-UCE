import React from "react";
import { UCELogoImage } from "./UCELogoImage";
import { cn } from "./ui/shim";

export function Header({ className, children }) {
  return (
    <header className={cn("w-full p-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/20 z-50", className)}>

      {/* Lado Izquierdo: Siempre es el Logo y Título */}
      <div className="flex items-center gap-3 select-none">
        <UCELogoImage className="w-16 h-auto object-contain drop-shadow-md" />
        
        {/* Separador vertical: Gris oscuro en modo claro, Blanco translúcido en oscuro */}
        <div className="h-10 w-px bg-slate-800/20 dark:bg-white/20 hidden sm:block"></div>

        {/* Textos: Usamos Slate (Gris Neutro) */}
        <div className="flex flex-col justify-center text-slate-800 dark:text-white">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest leading-none text-shadow-sm">
            MAPA INTERACTIVO 3D
          </h2>
          {/* Subtítulo: Gris medio en claro, Gris claro en oscuro */}
          <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
            Universidad Central del Ecuador
          </span>
          {/* Lema: Azul oscuro en claro, Azul claro en oscuro */}
          <p className="hidden md:block text-[10px] italic font-serif mt-0.5 tracking-wider opacity-90 text-blue-800 dark:text-blue-200">
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