import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';

export function EventsPopup({ isOpen, onClose, locationName, events = [] }) {
  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  // Filtramos los eventos para mostrar solo los de esta ubicación
  const locationEvents = events.filter(e => 
     (e.location_name && e.location_name === locationName) || 
     (e.location && e.location === locationName)
  );

  return (
    // 1. EL FONDO OSCURO (OVERLAY)
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* 2. LA CAJA DEL POPUP */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 relative">
        
        {/* Cabecera */}
        <div className="bg-[#1e3a8a] p-4 flex justify-between items-center text-white shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
             <Calendar className="w-5 h-5 text-[#D9232D] shrink-0" />
             <h3 className="font-bold truncate text-sm sm:text-base pr-2">
                Eventos: {locationName}
             </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Eventos (Scrollable) */}
        <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50">
          {locationEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                 <Calendar className="w-8 h-8 opacity-20" />
               </div>
               <p className="font-medium text-gray-500">No hay eventos programados.</p>
               <p className="text-xs">Consulta de nuevo más tarde.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locationEvents.map((ev, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#D9232D]/40 hover:shadow-md transition-all group">
                   <h4 className="font-bold text-[#1e3a8a] mb-1 group-hover:text-[#D9232D] transition-colors">
                      {ev.title}
                   </h4>
                   <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {ev.description}
                   </p>
                   
                   <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium pt-2 border-t border-gray-50">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-gray-700">
                        <Calendar size={12} className="text-[#D9232D]"/> {ev.date}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-gray-700">
                        <Clock size={12} className="text-[#D9232D]"/> {ev.time || "Por definir"}
                      </span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-white text-center">
            <button 
                onClick={onClose} 
                className="text-xs font-bold text-gray-400 hover:text-[#1e3a8a] uppercase tracking-wide transition-colors"
            >
                Cerrar Ventana
            </button>
        </div>

      </div>
    </div>
  );
}