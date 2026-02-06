import React from "react";
import { UCELogoImage } from "./UCELogoImage";
import { cn } from "./ui/shim";

export function Header({ className, children }) {
  return (
    <header className={cn("w-full p-4 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/20 z-50", className)}>

      {/* Left Side: Always Logo and Title */}
      <div className="flex items-center gap-3 select-none">
        <UCELogoImage className="w-16 h-auto object-contain drop-shadow-md" />

        {/* Vertical separator: Dark gray in light mode, Translucent white in dark mode */}
        <div className="h-10 w-px bg-slate-800/20 dark:bg-white/20 hidden sm:block"></div>

        {/* Texts: Using Slate (Neutral Gray) */}
        <div className="flex flex-col justify-center text-slate-800 dark:text-white">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest leading-none text-shadow-sm">
            MAPA INTERACTIVO 3D
          </h2>
          {/* Subtitle: Medium gray in light, Light gray in dark */}
          <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
            Universidad Central del Ecuador
          </span>
          {/* Motto: Dark blue in light, Light blue in dark */}
          <p className="hidden md:block text-[10px] italic font-serif mt-0.5 tracking-wider opacity-90 text-blue-800 dark:text-blue-200">
            "Omnium Potentior Est Sapientia"
          </p>
        </div>
      </div>

      {/* Right Side: Here we put what changes (Buttons, Search, etc.) */}
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}