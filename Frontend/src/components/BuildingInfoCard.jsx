import React, { useState, useEffect } from 'react';
import { X, Clock, Info, MapPin, Calendar } from 'lucide-react';

export function BuildingInfoCard({ location, onClose, onShowEvents }) {
  if (!location) return null;

  const [status, setStatus] = useState({ text: "", color: "", isOpen: false });

  useEffect(() => {
    const checkStatus = () => {
      // Si no hay horario definido en la BD, mostramos cerrado o un estado neutro
      if (!location.schedule) {
          setStatus({ text: "HORARIO NO DISPONIBLE", color: "bg-gray-100 text-gray-500 border-gray-200", isOpen: false });
          return;
      }

      const now = new Date();
      const day = now.getDay(); // 0 = Domingo, 6 = Sábado
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Asumimos que los horarios de la UCE son de Lunes a Viernes (1-5)
      const isWeekDay = day >= 1 && day <= 5;

      let isOpen = false;

      // LÓGICA DE PARSEO DINÁMICO
      // Buscamos patrones de hora tipo "07:00", "7:00", "14:30" dentro del texto 'schedule'
      // Ejemplo de schedule en BD: "07:00 - 13:00" o "Lun-Vie 08:00 a 16:00"
      const timePattern = /(\d{1,2}):(\d{2})/g;
      const times = location.schedule.match(timePattern);

      if (isWeekDay && times && times.length >= 2) {
          // Tomamos la primera hora encontrada como inicio y la segunda como fin
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
            color: "bg-green-100 text-green-700 border-green-200",
            isOpen: true 
        });
      } else {
        setStatus({ 
            text: "CERRADO", 
            color: "bg-red-100 text-red-700 border-red-200",
            isOpen: false 
        });
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [location]); // Se ejecuta cada vez que cambia la ubicación seleccionada

  return (
    <div className="absolute bottom-4 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in border border-gray-200">

      {/* SECCIÓN DE IMAGEN */}
      {location.image_url ? (
        <div className="h-40 w-full overflow-hidden relative bg-gray-100">
          <img
            src={location.image_url}
            alt={location.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "/images/placeholder.jpg"; 
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
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-[#1e3a8a]">{location.name}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
      )}

      {/* CONTENIDO */}
      <div className="p-4 space-y-3">
        {location.image_url && <h2 className="font-bold text-lg text-[#1e3a8a] leading-tight">{location.name}</h2>}

        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
            {location.category}
          </span>

          {/* INDICADOR DE ESTADO DINÁMICO */}
          {location.schedule && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></span>
               {status.text}
            </span>
          )}

          {location.schedule && (
            <span className="flex items-center gap-1 text-xs ml-auto whitespace-nowrap">
              <Clock className="w-3 h-3" /> {location.schedule}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {location.description}
        </p>
      </div>

      {/* FOOTER ACCIONES */}
      <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
        <button 
            onClick={() => onShowEvents(location)}
            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1.5 transition-colors hover:text-blue-800"
        >
            <Calendar className="w-3.5 h-3.5" /> 
            Ver Eventos aquí
        </button>
      </div>
    </div>
  );
}