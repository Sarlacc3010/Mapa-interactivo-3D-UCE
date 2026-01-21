import React from 'react';
import { X, Calendar, Clock, MapPin, CalendarDays } from 'lucide-react';

// 🔥 CAMBIO 1: Aceptamos 'locationId' además del nombre
export function EventsPopup({ isOpen, onClose, locationName, locationId, events }) {
  if (!isOpen) return null;

  // 🔥 LÓGICA CORREGIDA: Usamos ID para filtrar (es más seguro que el nombre)
  const localEvents = events
    .filter(e => {
        // 1. Filtro por ID DE LUGAR (Crucial: Convertimos a String para evitar errores "5" vs 5)
        // Si el evento no tiene location_id, lo descartamos.
        if (!e.location_id || !locationId) return false;
        
        if (String(e.location_id) !== String(locationId)) return false;

        // 2. Filtro de Tiempo (Igual que antes, esto estaba bien)
        const now = new Date();
        const datePart = e.date.split('T')[0];
        const timePart = e.end_time || e.time || "23:59";
        const eventEnd = new Date(`${datePart}T${timePart}`);

        return eventEnd >= now;
    })
    .sort((a, b) => {
        // 3. Ordenar por fecha
        const dateA = new Date(`${a.date.split('T')[0]}T${a.time || "00:00"}`);
        const dateB = new Date(`${b.date.split('T')[0]}T${b.time || "00:00"}`);
        return dateA - dateB;
    });

  const getDateParts = (dateString) => {
    if (!dateString) return { month: '---', day: '--' };
    try {
      const parts = dateString.split('T')[0].split('-');
      // Nota: El mes en JS es 0-indexado, pero al hacer split de string ya viene correcto visualmente
      // Ajuste para zona horaria local segura:
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return {
        month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
        day: parts[2]
      };
    } catch (e) {
      return { month: 'ERR', day: '?' };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} 
      />

      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-lg bg-gray-50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh] border border-white/20"
      >
        
        {/* CABECERA */}
        <div className="relative p-6 shrink-0 bg-gradient-to-r from-[#1e3a8a] via-[#8b2555] to-[#D9232D] text-white overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>

           <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-white/90 font-semibold text-[10px] uppercase tracking-widest mb-2 border border-white/10 w-fit px-2 py-0.5 rounded-full bg-black/5 backdrop-blur-sm">
                    <CalendarDays size={12} /> Agenda Institucional
                </div>
                
                <h2 className="text-2xl font-bold leading-tight drop-shadow-sm pr-6 text-white tracking-tight">
                    {locationName}
                </h2>
                
                <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1.5 font-medium">
                    <MapPin size={12} /> Campus Universitario
                </div>
              </div>

              <button 
                onClick={onClose} 
                className="group p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 backdrop-blur-md border border-white/10 shadow-lg"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
           </div>
        </div>

        {/* CUERPO */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 relative">
            
            {localEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-70">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                        <Calendar size={28} className="text-gray-300" />
                    </div>
                    <h3 className="text-[#1e3a8a] font-bold text-base">Sin actividades próximas</h3>
                    <p className="text-gray-500 text-xs mt-1 max-w-[200px]">
                        No hay eventos programados para este lugar próximamente.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {localEvents.map((event, index) => {
                        const { month, day } = getDateParts(event.date);
                        return (
                            <div 
                                key={event.id || index} 
                                className="group relative flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                            >
                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#1e3a8a] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex flex-col items-center shrink-0">
                                    <div className="h-6 w-12 bg-[#D9232D] text-white text-[9px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg shadow-sm z-10">
                                        {month}
                                    </div>
                                    <div className="h-10 w-12 bg-white text-[#1e3a8a] text-lg font-bold flex items-center justify-center rounded-b-lg border-x border-b border-gray-100 shadow-sm group-hover:bg-blue-50/50 transition-colors">
                                        {day}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 py-0.5 pl-1">
                                    <h4 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-[#1e3a8a] transition-colors mb-1.5">
                                        {event.title}
                                    </h4>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100/50">
                                            <Clock size={10} strokeWidth={2.5} /> 
                                            {event.time || "Todo el día"}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="bg-white p-3 text-center border-t border-gray-100 relative z-10">
             <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                Universidad Central del Ecuador
             </p>
        </div>

      </div>
    </div>
  );
}