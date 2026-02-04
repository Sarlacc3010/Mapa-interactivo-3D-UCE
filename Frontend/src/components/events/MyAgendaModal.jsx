import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, CalendarDays, Trash2, CalendarCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function MyAgendaModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // CARGAR MIS EVENTOS
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      fetch(`${API_BASE}/api/calendar/my-events`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            setEvents(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
    }
  }, [isOpen]);

  // ELIMINAR EVENTO
  const handleRemove = async (eventId) => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
    try {
        // Usamos el mismo endpoint 'toggle' que ya sirve para quitar si existe
        const res = await fetch(`${API_BASE}/api/calendar/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId }),
            credentials: 'include'
        });
        if (res.ok) {
            // Lo quitamos de la lista visualmente
            setEvents(prev => prev.filter(e => e.id !== eventId));
        }
    } catch (error) {
        console.error("Error al eliminar", error);
    }
  };

  if (!isOpen) return null;

  // Lógica de fechas (reutilizada)
  const normalizeDate = (d) => d ? (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0] : "";
  const getDateParts = (dateString) => {
    try {
        const d = new Date(dateString);
        // Ajuste zona horaria simple
        const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000); 
        return {
            month: localDate.toLocaleString("es-ES", { month: "short" }).toUpperCase().replace(".", ""),
            day: localDate.getDate()
        };
    } catch (e) { return { month: "---", day: "--" }; }
  };

  // ESTILOS COMUNES (CONTENEDOR)
  const overlayClass = "fixed inset-0 z-[70] flex items-center justify-center px-4";
  const bgOverlayClass = "absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300";
  
  // ESTILO DARK VS LIGHT
  const isDark = theme === 'dark';
  const containerClass = isDark
    ? "relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10 ring-1 ring-purple-500/20"
    : "relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200";

  const headerClass = isDark 
    ? "relative p-6 shrink-0 border-b border-white/10 overflow-hidden bg-slate-950"
    : "relative p-6 shrink-0 bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900 text-white overflow-hidden";

  return (
    <div className={overlayClass}>
      <div className={bgOverlayClass} onClick={onClose} />
      <div className={containerClass} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={headerClass}>
           {/* Decoración Fondo */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10 flex justify-between items-start">
             <div>
               <div className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 border w-fit px-3 py-1 rounded-full backdrop-blur-sm ${isDark ? "text-purple-400 border-purple-500/20 bg-purple-950/30" : "text-white/90 border-white/10 bg-black/10"}`}>
                 <CalendarCheck size={12} /> Mi Espacio
               </div>
               <h2 className="text-2xl font-bold leading-tight text-white tracking-tight">
                 Mi Agenda Personal
               </h2>
               <p className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-white/80"}`}>
                 Tus eventos guardados y recordatorios.
               </p>
             </div>
             <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
               <X size={20} />
             </button>
           </div>
        </div>

        {/* LISTA */}
        <div className={`p-5 overflow-y-auto custom-scrollbar flex-1 ${isDark ? "bg-slate-900/50" : "bg-gray-50"}`}>
            {loading ? (
                <div className="text-center py-10 opacity-50 animate-pulse">Cargando tu agenda...</div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-60">
                    <div className="w-16 h-16 bg-gray-500/10 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays size={28} className={isDark ? "text-slate-500" : "text-gray-400"} />
                    </div>
                    <h3 className={isDark ? "text-slate-300 font-bold" : "text-gray-600 font-bold"}>Tu agenda está vacía</h3>
                    <p className="text-xs text-gray-500 mt-2">Guarda eventos desde el mapa para verlos aquí.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((e, i) => {
                        const { month, day } = getDateParts(e.date);
                        return (
                            <div key={e.id} className={`flex gap-4 p-3 rounded-xl border transition-all ${isDark ? "bg-slate-800/50 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}>
                                {/* Fecha */}
                                <div className="flex flex-col items-center justify-center w-12 shrink-0">
                                    <span className={`text-[10px] font-bold uppercase ${isDark ? "text-purple-400" : "text-indigo-600"}`}>{month}</span>
                                    <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{day}</span>
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-sm truncate ${isDark ? "text-slate-200" : "text-gray-900"}`}>{e.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] mt-1 opacity-70">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {e.time ? e.time.slice(0,5) : "Todo el día"}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {e.location_name}</span>
                                    </div>
                                </div>
                                {/* Botón Borrar */}
                                <button 
                                    onClick={() => handleRemove(e.id)}
                                    className="self-center p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Quitar de mi agenda"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}