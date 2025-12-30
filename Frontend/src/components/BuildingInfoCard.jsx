import React from 'react';
import { Calendar, Clock, Users, X, MapPin } from "lucide-react";
import { Button } from "./ui/shim";

export function BuildingInfoCard({ location, onClose }) {
  if (!location) return null;

  return (
    <div className="absolute top-24 left-6 z-10 w-80 animate-in slide-in-from-left-10 duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
        
        {/* Cabecera con Gradiente UCE */}
        <div className="h-28 bg-gradient-to-br from-[#1e3a8a] to-[#D9232D] relative p-4 flex flex-col justify-end">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/20 rounded-full text-white hover:bg-black/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-white/80 uppercase tracking-wider font-bold mb-1 bg-black/20 w-fit px-2 py-0.5 rounded">
            {location.category}
          </span>
          <h2 className="text-xl font-bold text-white leading-tight shadow-sm">{location.name}</h2>
        </div>

        {/* Contenido */}
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed border-l-2 border-red-500 pl-3">
            {location.description}
          </p>

          <div className="space-y-4 mb-6 bg-gray-50 p-3 rounded-xl">
            <InfoRow icon={Clock} label="Horario" value={location.schedule} />
            <InfoRow icon={Users} label="Aforo" value="Disponible" color="text-green-600" />
            <InfoRow icon={MapPin} label="Ubicación" value="Campus Central" />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button className="w-full bg-[#D9232D] shadow-red-200">Ver Interiores</Button>
             <Button variant="outline" className="w-full">Eventos</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color = "text-gray-900" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}