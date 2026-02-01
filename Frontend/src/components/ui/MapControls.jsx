import React from "react";
import { Footprints, Plane } from "lucide-react";

/**
 * Floating button to toggle between FPS (Walk) and Orbit (Aerial) modes.
 */
export function ViewModeButton({ isFpsMode, isTransitioning, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isTransitioning}
      className={`
        relative group flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 active:scale-95 border
        bg-white text-gray-700 border-gray-200 shadow-xl hover:bg-gray-50
        dark:bg-slate-900/80 
        ${
          isFpsMode
            ? "dark:border-red-500/50 dark:text-red-400 dark:shadow-[0_0_20px_rgba(220,38,38,0.4)] dark:hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
            : "dark:border-cyan-500/50 dark:text-cyan-400 dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
        }
        ${isTransitioning ? "opacity-50 cursor-wait grayscale" : ""}
      `}
    >
      {/* Background Glow Effect */}
      <div
        className={`hidden dark:block absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
          isFpsMode ? "bg-red-500" : "bg-cyan-500"
        }`}
      ></div>

      {/* Icon Switch */}
      {isFpsMode ? <Footprints size={24} /> : <Plane size={24} />}
      
      <span className="tracking-wider uppercase text-xs">
        {isFpsMode ? "Modo Caminar" : "Vista Aérea"}
      </span>
    </button>
  );
}

/**
 * Visual hint overlay for WASD controls
 */
export function WasdControlsHint() {
  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 px-6 py-2 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 border
                    bg-white/80 text-gray-800 border-gray-200
                    dark:text-white dark:bg-black/60 dark:border-white/10"
    >
      <span className="flex items-center gap-2 text-xs font-mono">
        <span className="text-orange-500 dark:text-yellow-400">WASD</span>{" "}
        Moverse
      </span>
      <span className="w-px h-3 bg-gray-300 dark:bg-white/20"></span>
      <span className="flex items-center gap-2 text-xs font-mono">
        <span className="text-orange-500 dark:text-yellow-400">ESC</span>{" "}
        Cursor
      </span>
    </div>
  );
}

/**
 * Center screen crosshair for FPS mode
 */
export function Crosshair() {
  return (
    <>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)]"></div>
      </div>
      <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold pointer-events-none animate-pulse">
        Clic para controlar
      </div>
    </>
  );
}