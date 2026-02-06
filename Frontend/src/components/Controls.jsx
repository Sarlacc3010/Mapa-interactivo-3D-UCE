import React from 'react';
import { Plus, Minus, Compass, MousePointer2, Move, ZoomIn } from "lucide-react";

export function ZoomControls() {
  return (
    <div className="absolute bottom-24 right-6 z-10 flex flex-col bg-black/40 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden shadow-xl">
      <button
        className="p-3 text-white/90 hover:bg-white/20 hover:text-white transition-colors border-b border-white/10"
        title="Acercar"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button
        className="p-3 text-white/90 hover:bg-white/20 hover:text-white transition-colors border-b border-white/10"
        title="Alejar"
      >
        <Minus className="w-5 h-5" />
      </button>
      <button
        className="p-3 text-white/90 hover:bg-white/20 hover:text-white transition-colors"
        title="Resetear Orientación"
      >
        <Compass className="w-5 h-5" />
      </button>
    </div>
  );
}

export function Instructions() {
  return (
    <div className="absolute bottom-8 left-8 z-10 hidden md:flex animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
      <div className="flex items-center gap-6 px-5 py-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl text-xs font-medium text-white/80">

        {/* Rotate */}
        <div className="flex items-center gap-2">
          <MousePointer2 className="w-3.5 h-3.5 text-[#D9232D]" />
          <span><b className="text-white">Left Click</b> Rotate</span>
        </div>

        <div className="w-px h-3 bg-white/20"></div>

        {/* Pan */}
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-blue-400" />
          <span><b className="text-white">Right Click</b> Pan</span>
        </div>

        <div className="w-px h-3 bg-white/20"></div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3.5 h-3.5 text-yellow-400" />
          <span><b className="text-white">Wheel</b> Zoom</span>
        </div>

      </div>
    </div>
  );
}