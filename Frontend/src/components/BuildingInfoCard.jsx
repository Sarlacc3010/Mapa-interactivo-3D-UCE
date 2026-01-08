import React from 'react';
// 1. Agregamos 'Calendar' a los iconos
import { X, Clock, Info, MapPin, Calendar } from 'lucide-react';

// 2. Recibimos la nueva prop 'onShowEvents'
export function BuildingInfoCard({ location, onClose, onShowEvents }) {
  if (!location) return null;

  return (
    <div className="absolute bottom-4 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in border border-gray-200">

      {/* 1. SECCIÓN DE IMAGEN */}
      {location.image_url ? (
        <div className="h-40 w-full overflow-hidden relative bg-gray-100">
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "/images/placeholder.jpg"; // Asegúrate que esta ruta exista o usa una URL externa
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Cabecera simple si no hay imagen
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-[#1e3a8a]">{location.name}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
      )}

      {/* 2. CONTENIDO */}
      <div className="p-4 space-y-3">
        {location.image_url && <h2 className="font-bold text-lg text-[#1e3a8a] leading-tight">{location.name}</h2>}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
            {location.category}
          </span>
          {location.schedule && (
            <span className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" /> {location.schedule}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {location.description}
        </p>
      </div>

      {/* Footer de Acciones - AQUÍ ESTÁ EL CAMBIO IMPORTANTE */}
      <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
        <button 
            // 3. Al hacer click, ejecutamos la función que abre el popup
            onClick={() => onShowEvents(location)}
            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1.5 transition-colors hover:text-blue-800"
        >
            <Calendar className="w-3.5 h-3.5" /> {/* Icono añadido */}
            Ver Eventos aquí
        </button>
      </div>
    </div>
  );
}