import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function BuildingInfoCard({ location, onClose, onShowEvents }) {
  if (!location) return null;
  const { theme } = useTheme();

  const [status, setStatus] = useState({ text: "", color: "", isOpen: false });

  useEffect(() => {
    const checkStatus = () => {
      if (!location.schedule) {
          setStatus({ 
            text: "HORARIO NO DISPONIBLE", 
            color: theme === 'dark' 
              ? "text-slate-500 border-slate-500/20 bg-slate-500/5" 
              : "text-gray-400 border-gray-200 bg-gray-50", 
            isOpen: false 
          });
          return;
      }

      const now = new Date();
      const day = now.getDay(); 
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const isWeekDay = day >= 1 && day <= 5;
      let isOpen = false;

      const timePattern = /(\d{1,2}):(\d{2})/g;
      const times = location.schedule.match(timePattern);

      if (isWeekDay && times && times.length >= 2) {
          const [startStr, endStr] = times;
          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);
          const startTotalMinutes = startH * 60 + startM;
          const endTotalMinutes = endH * 60 + endM;

          if (currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes) {
              isOpen = true;
          }
      }

      if (isOpen) {
        setStatus({ 
            text: "ABIERTO", 
            color: theme === 'dark' 
              ? "text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              : "text-emerald-700 border-emerald-200 bg-emerald-50",
            isOpen: true 
        });
      } else {
        setStatus({ 
            text: "CERRADO", 
            color: theme === 'dark'
              ? "text-red-400 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              : "text-red-700 border-red-200 bg-red-50",
            isOpen: false 
        });
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 60000); 
    return () => clearInterval(interval);
  }, [location, theme]); 

  return (
    // CONTENEDOR PRINCIPAL: Misma distribución neón, colores dinámicos
    <div className={`absolute bottom-4 left-4 z-50 w-80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in border transition-all duration-500
      ${theme === 'dark' 
        ? "bg-slate-900/90 border-white/10 ring-1 ring-black/50" 
        : "bg-white/95 border-gray-200 ring-1 ring-black/5"
      }`}>

      {/* SECCIÓN DE IMAGEN (Estructura modo neón) */}
      {location.image_url ? (
        <div className="h-40 w-full overflow-hidden relative group">
          <div className={`absolute inset-0 z-10 bg-gradient-to-t ${theme === 'dark' ? "from-slate-900" : "from-white/80"} to-transparent`}></div>
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.onerror = null; e.target.src = "/images/placeholder.jpg"; }}
          />
          <button
            onClick={onClose}
            className={`absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all border shadow-sm ${theme === 'dark' ? "bg-black/60 text-white/80 hover:text-white border-white/10" : "bg-white/80 text-gray-500 hover:text-red-600 border-gray-200"}`}
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Categoría Flotante */}
          <span className={`absolute bottom-2 left-4 z-20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border backdrop-blur-md
            ${theme === 'dark' 
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
              : "bg-blue-600/10 text-blue-700 border-blue-200"
            }`}>
            {location.category}
          </span>
        </div>
      ) : (
        <div className={`flex justify-between items-center p-4 border-b ${theme === 'dark' ? "bg-gradient-to-r from-slate-800/50 border-white/5" : "bg-gray-50 border-gray-100"}`}>
          <h2 className={`font-bold transition-colors ${theme === 'dark' ? "text-white" : "text-[#1e3a8a]"}`}>{location.name}</h2>
          <button onClick={onClose} className="hover:text-red-500 transition-colors text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* CONTENIDO (Estructura modo neón) */}
      <div className="p-5 space-y-4">
        {location.image_url && <h2 className={`font-bold text-xl leading-tight transition-colors ${theme === 'dark' ? "text-white drop-shadow-md" : "text-[#1e3a8a]"}`}>{location.name}</h2>}

        <div className="flex items-center flex-wrap gap-3">
          {/* Estado Neón / Claro */}
          {location.schedule && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border flex items-center gap-2 transition-all ${status.color}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? (theme === 'dark' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600') : 'bg-red-500'}`}></span>
               {status.text}
            </span>
          )}

          {location.schedule && (
            <span className={`flex items-center gap-1.5 text-xs ml-auto font-mono ${theme === 'dark' ? "text-slate-400" : "text-gray-500"}`}>
              <Clock className={`w-3.5 h-3.5 ${theme === 'dark' ? "text-cyan-500" : "text-blue-600"}`} /> {location.schedule}
            </span>
          )}
        </div>

        <p className={`text-sm leading-relaxed line-clamp-3 font-light transition-colors ${theme === 'dark' ? "text-slate-300" : "text-gray-600"}`}>
          {location.description || "Información no disponible para esta ubicación."}
        </p>
      </div>

      {/* FOOTER ACCIONES */}
      <div className={`p-4 border-t transition-colors ${theme === 'dark' ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100"}`}>
        <button 
            onClick={() => onShowEvents(location)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 border
              ${theme === 'dark' 
                ? "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                : "bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
        >
            <Calendar className="w-4 h-4" /> 
            Ver Agenda de Eventos
        </button>
      </div>
    </div>
  );
}