import React from 'react';
import { X, Calendar, Clock, MapPin, CalendarDays, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function EventsPopup({ isOpen, onClose, locationName, locationId, events }) {
  if (!isOpen) return null;
  const { theme } = useTheme();

  const localEvents = events
    .filter(e => e.location_id && locationId && String(e.location_id) === String(locationId))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const getDateParts = (dateString) => {
    if (!dateString) return { month: '---', day: '--' };
    try {
      const d = new Date(dateString.split('T')[0]);
      return { month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''), day: dateString.split('T')[0].split('-')[2] };
    } catch (e) { return { month: 'ERR', day: '?' }; }
  };

  // ===========================================================================
  // MODO OSCURO: TU DISEÑO NEÓN INTACTO
  // ===========================================================================
  if (theme === 'dark') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh] border border-white/10 ring-1 ring-cyan-500/20">
          <div className="relative p-6 shrink-0 border-b border-white/10 overflow-hidden bg-slate-950">
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
             <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3 border border-cyan-500/20 w-fit px-3 py-1 rounded-full bg-cyan-950/30 backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      <CalendarDays size={12} /> Agenda Digital
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{locationName}</h2>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2 font-mono"><MapPin size={12} className="text-pink-500" /> Campus Universitario</div>
                </div>
                <button onClick={onClose} className="group p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all duration-300 border border-white/5 hover:border-white/20">
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
             </div>
          </div>
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/50 relative">
              {localEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-60">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5"><Calendar size={28} className="text-slate-500" /></div>
                      <h3 className="text-slate-300 font-bold text-base">Sin Señal de Actividad</h3>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {localEvents.map((event, index) => {
                          const { month, day } = getDateParts(event.date);
                          return (
                              <div key={event.id || index} className="group relative flex gap-4 p-4 rounded-2xl transition-all duration-300 cursor-default bg-slate-800/50 border border-white/5 hover:bg-slate-800 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-cyan-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#06b6d4]"></div>
                                  <div className="flex flex-col items-center shrink-0">
                                      <div className="h-6 w-12 bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg border-t border-x border-white/5 group-hover:bg-cyan-900/50 group-hover:text-cyan-300 transition-colors">{month}</div>
                                      <div className="h-10 w-12 bg-slate-800 text-white text-lg font-bold flex items-center justify-center rounded-b-lg border border-white/5 group-hover:border-cyan-500/30 transition-colors shadow-inner">{day}</div>
                                  </div>
                                  <div className="flex-1 min-w-0 py-0.5 pl-2">
                                      <h4 className="text-slate-200 font-bold text-sm leading-snug group-hover:text-cyan-400 transition-colors mb-2">{event.title}</h4>
                                      <div className="flex flex-wrap items-center gap-2 mb-2"><span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-purple-500/10 text-purple-300 border-purple-500/30"><Clock size={10} /> {event.time || "Todo el día"}</span></div>
                                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-light">{event.description}</p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
          <div className="bg-black/20 p-3 text-center border-t border-white/5 relative z-10 backdrop-blur-md">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2"><Zap size={10} className="text-yellow-500" /> Sistema UCE v2.0</p>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MODO CLARO: TU DISEÑO ORIGINAL INTACTO
  // ===========================================================================
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg bg-gray-50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh] border border-white/20">
        <div className="relative p-6 shrink-0 bg-gradient-to-r from-[#1e3a8a] via-[#8b2555] to-[#D9232D] text-white overflow-hidden">
           <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-white/90 font-semibold text-[10px] uppercase tracking-widest mb-2 border border-white/10 w-fit px-2 py-0.5 rounded-full bg-black/5 backdrop-blur-sm"><CalendarDays size={12} /> Agenda Institucional</div>
                <h2 className="text-2xl font-bold leading-tight drop-shadow-sm pr-6 text-white tracking-tight">{locationName}</h2>
                <div className="flex items-center gap-1.5 text-white/80 text-xs mt-1.5 font-medium"><MapPin size={12} /> Campus Universitario</div>
              </div>
              <button onClick={onClose} className="group p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 backdrop-blur-md border border-white/10 shadow-lg">
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
           </div>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 relative">
            {localEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-70">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100"><Calendar size={28} className="text-gray-300" /></div>
                    <h3 className="text-[#1e3a8a] font-bold text-base">Sin actividades próximas</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {localEvents.map((event, index) => {
                        const { month, day } = getDateParts(event.date);
                        return (
                            <div key={event.id || index} className="group relative flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#1e3a8a] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="h-6 w-12 bg-[#D9232D] text-white text-[9px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg shadow-sm z-10">{month}</div>
                                    <div className="h-10 w-12 bg-white text-[#1e3a8a] text-lg font-bold flex items-center justify-center rounded-b-lg border-x border-b border-gray-100 shadow-sm group-hover:bg-blue-50/50 transition-colors">{day}</div>
                                </div>
                                <div className="flex-1 min-w-0 py-0.5 pl-1">
                                    <h4 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-[#1e3a8a] transition-colors mb-1.5">{event.title}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mb-2"><span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-100/50"><Clock size={10} strokeWidth={2.5} /> {event.time || "Todo el día"}</span></div>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{event.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        <div className="bg-white p-3 text-center border-t border-gray-100 relative z-10"><p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Universidad Central del Ecuador</p></div>
      </div>
    </div>
  );
}