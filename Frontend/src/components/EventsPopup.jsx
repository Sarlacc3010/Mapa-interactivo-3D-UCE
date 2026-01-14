import React from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';

export function EventsPopup({ isOpen, onClose, locationName, events }) {
  if (!isOpen) return null;

  const localEvents = events.filter(e => e.location_name === locationName);

  const getDateParts = (dateString) => {
    if (!dateString) return { month: '---', day: '--' };
    const parts = dateString.split('T')[0].split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return {
        month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
        day: parts[2]
    };
  };

  return (
    <div 
        className="fixed inset-0 z-[60] flex items-center justify-center px-4"
        // 1. AQUÍ: Al hacer click en el contenedor general (fondo), intentamos cerrar
        onClick={onClose}
    >
      {/* Fondo oscuro con Blur (Decorativo, los clicks pasan a través de él hacia el padre) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-none" />

      {/* 2. LA TARJETA DEL MODAL */}
      <div 
        // Importante: Detenemos la propagación del click.
        // Si clickeas DENTRO de la tarjeta, el evento NO sube al padre, así que no se cierra.
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]"
      >
        
        {/* Cabecera con Degradado */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] p-6 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10 pr-8">
                <h2 className="text-2xl font-bold leading-tight">{locationName}</h2>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-1 opacity-90">
                    <MapPin size={14} /> Agenda de Actividades
                </p>
            </div>

            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white backdrop-blur-md"
            >
                <X size={20} />
            </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 custom-scrollbar">
            {localEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-70">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-gray-600 font-semibold text-lg">Sin eventos programados</h3>
                    <p className="text-gray-400 text-sm max-w-[200px]">
                        No hay actividades registradas por el momento.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {localEvents.map((event, index) => {
                        const { month, day } = getDateParts(event.date);
                        return (
                            <div 
                                key={event.id || index} 
                                className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all flex gap-4 items-start"
                            >
                                <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-xl border border-blue-100 shrink-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wide">{month}</span>
                                    <span className="text-xl font-bold leading-none">{day}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-gray-800 font-bold text-base leading-tight mb-1 group-hover:text-[#1e3a8a] transition-colors">
                                        {event.title}
                                    </h4>
                                    
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                            <Clock size={12} /> {event.time || "Todo el día"}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        <div className="bg-white p-4 border-t border-gray-100 text-center text-xs text-gray-400 shrink-0">
            Universidad Central del Ecuador
        </div>
      </div>
    </div>
  );
}