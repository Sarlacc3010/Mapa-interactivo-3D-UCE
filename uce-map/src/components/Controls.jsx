import React from 'react';
import { Plus, Minus, Compass, MousePointer2 } from "lucide-react";

export function ZoomControls() {
  return (
    <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-3">
      {[Plus, Minus, Compass].map((Icon, i) => (
        <button key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-all active:scale-90 border border-gray-100">
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}

export function Instructions() {
  return (
    <div className="absolute bottom-8 left-8 z-10 hidden md:block">
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-4 text-xs text-gray-600">
         <div className="flex items-center gap-2">
            <span className="bg-gray-100 border border-gray-200 px-1.5 py-1 rounded font-mono font-bold text-gray-800">WASD</span>
            <span>Moverse</span>
         </div>
         <div className="w-px h-4 bg-gray-300"></div>
         <div className="flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" />
            <span>Rotar y Zoom</span>
         </div>
      </div>
    </div>
  );
}