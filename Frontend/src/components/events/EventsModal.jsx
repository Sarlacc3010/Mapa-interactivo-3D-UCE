import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CalendarDays,
  Zap,
  AlertCircle,
  CalendarPlus,
  Check, // NEW ICON FOR "SAVED"
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuthStore } from "../../store/authStore"; // IMPORT TO VERIFY USER

export function EventsModal({ isOpen, onClose, location }) {
  const { theme } = useTheme();
  const { user } = useAuthStore(); // GET USER
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // NEW STATE TO SAVE SUBSCRIBED EVENT IDs
  const [savedEventIds, setSavedEventIds] = useState([]);

  // ===========================================================================
  // 1. DATA LOGIC (EVENTS + SUBSCRIPTIONS)
  // ===========================================================================
  useEffect(() => {
    if (isOpen && location) {
      setLoading(true);

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_BASE = isLocal ? 'http://localhost:5000' : '';

      // 1. Load Location Events
      const fetchEvents = fetch(`${API_BASE}/api/events/location/${location.id}`)
        .then(res => res.json())
        .catch(() => []);

      // 2. Load My Subscriptions ONLY if user is authenticated student
      const fetchSubs = (user?.role === 'student')
        ? fetch(`${API_BASE}/api/calendar/my-subscriptions`, { credentials: 'include' })
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
        : Promise.resolve([]); // If not student, return empty array

      Promise.all([fetchEvents, fetchSubs])
        .then(([eventsData, subsData]) => {
          setEvents(eventsData);
          setSavedEventIds(subsData); // Save list of subscribed IDs [1, 5, 20]
          setLoading(false);
        });
    }
  }, [isOpen, location, user]);

  // SAVE/DELETE FUNCTION
  const handleToggleEvent = async (eventId) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? 'http://localhost:5000' : '';

    // Optimistic UI: Change state visually before server responds
    const isAlreadySaved = savedEventIds.includes(eventId);
    if (isAlreadySaved) {
      setSavedEventIds(prev => prev.filter(id => id !== eventId));
    } else {
      setSavedEventIds(prev => [...prev, eventId]);
    }

    try {
      await fetch(`${API_BASE}/api/calendar/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
        credentials: 'include'
      });
      // If fails, we could revert state here, but kept simple for now.
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  if (!isOpen) return null;

  // ===========================================================================
  // 2. DATE LOGIC
  // ===========================================================================
  const normalizeDate = (dateInput) => {
    if (!dateInput) return "";
    if (dateInput instanceof Date) {
      const offset = dateInput.getTimezoneOffset() * 60000;
      const localDate = new Date(dateInput.getTime() - offset);
      return localDate.toISOString().split("T")[0];
    }
    return String(dateInput).substring(0, 10);
  };

  const todayString = normalizeDate(new Date());

  const getDateParts = (dateString) => {
    if (!dateString) return { month: "---", day: "--" };
    try {
      const cleanDate = normalizeDate(dateString);
      const parts = cleanDate.split("-");
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

      return {
        month: dateObj.toLocaleString("es-ES", { month: "short" }).toUpperCase().replace(".", ""),
        day: parts[2],
      };
    } catch (e) {
      return { month: "ERR", day: "?" };
    }
  };

  // ===========================================================================
  // 3. RENDER (DARK MODE - NEON)
  // ===========================================================================
  if (theme === "dark") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onClose}
        />
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[40vh] border border-white/10 ring-1 ring-cyan-500/20"
        >
          {/* Neon Header */}
          <div className="relative p-6 shrink-0 border-b border-white/10 overflow-hidden bg-slate-950">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <CalendarDays className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    Eventos en {location?.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Próximas Actividades
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all duration-300 bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event List with Scroll */}
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/50 relative">
            {loading ? (
              <div className="text-center py-10 text-cyan-500 animate-pulse">Cargando agenda...</div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-60">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <Calendar size={28} className="text-slate-500" />
                </div>
                <h3 className="text-slate-300 font-bold text-base">Sin Actividades Próximas</h3>
                <p className="text-xs text-slate-500 mt-2">No hay eventos programados en este momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => {
                  const { month, day } = getDateParts(event.date);
                  const isToday = normalizeDate(event.date) === todayString;
                  const isSaved = savedEventIds.includes(event.id);

                  return (
                    <div
                      key={event.id || index}
                      className={`group relative flex gap-4 p-4 rounded-2xl transition-all duration-300 cursor-default border 
                                   ${isToday
                          ? "bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                        }`}
                    >
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-opacity shadow-[0_0_10px_#06b6d4]
                                     ${isToday ? "bg-cyan-400 opacity-100" : "bg-cyan-600 opacity-0 group-hover:opacity-100"}`}></div>

                      <div className="flex flex-col items-center shrink-0">
                        <div className={`h-6 w-12 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg border-t border-x border-white/5 transition-colors
                                       ${isToday ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 group-hover:bg-cyan-900/50 group-hover:text-cyan-300"}`}>
                          {month}
                        </div>
                        <div className={`h-10 w-12 text-lg font-bold flex items-center justify-center rounded-b-lg border border-white/5 transition-colors shadow-inner
                                       ${isToday ? "bg-cyan-900/80 text-cyan-200 border-cyan-500/50" : "bg-slate-800 text-white group-hover:border-cyan-500/30"}`}>
                          {day}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 py-0.5 pl-2 flex flex-col h-full">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className={`font-bold text-sm leading-snug transition-colors mb-2 ${isToday ? "text-cyan-300" : "text-slate-200 group-hover:text-cyan-400"}`}>
                            {event.title}
                          </h4>
                          {isToday && (
                            <span className="shrink-0 animate-pulse px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                              HOY
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border 
                                          ${isToday ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/30" : "bg-purple-500/10 text-purple-300 border-purple-500/30"}`}>
                            <Clock size={10} /> {event.time ? event.time.slice(0, 5) : "Todo el día"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-light mb-3">
                          {event.description}
                        </p>

                        {/* AGENDA BUTTON (DARK) - Only for authenticated students */}
                        {user?.role === 'student' && (
                          <div className="mt-auto flex justify-end">
                            <button
                              onClick={() => handleToggleEvent(event.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                                     ${isSaved
                                  ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                  : "bg-cyan-950 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900 hover:text-white hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                }`}
                            >
                              {isSaved ? <Check size={12} /> : <CalendarPlus size={12} />}
                              {isSaved ? "Agendado" : "Guardar"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-black/20 p-3 text-center border-t border-white/5 relative z-10 backdrop-blur-md">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Zap size={10} className="text-yellow-500" /> Sistema UCE v2.0
            </p>
          </div>
        </div >
      </div >
    );
  }

  // ===========================================================================
  // 4. RENDER (LIGHT MODE - INSTITUTIONAL)
  // ===========================================================================
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gray-50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[40vh] border border-white/20"
      >
        {/* Institutional Header */}
        <div className="relative p-6 shrink-0 bg-gradient-to-r from-[#1e3a8a] via-[#8b2555] to-[#D9232D] text-white overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-white/90 font-semibold text-[10px] uppercase tracking-widest mb-2 border border-white/10 w-fit px-2 py-0.5 rounded-full bg-black/5 backdrop-blur-sm">
                <CalendarDays size={12} /> Agenda Institucional
              </div>
              <h2 className="text-2xl font-bold leading-tight drop-shadow-sm pr-6 text-white tracking-tight">
                {location?.name || "Cargando..."}
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

        {/* Event List */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 relative">
          {loading ? (
            <div className="text-center py-10 text-[#1e3a8a] animate-pulse font-medium">Consultando agenda...</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-70">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <Calendar size={28} className="text-gray-300" />
              </div>
              <h3 className="text-[#1e3a8a] font-bold text-base">Sin actividades próximas</h3>
              <p className="text-xs text-gray-500 mt-2">No hay eventos programados en este momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => {
                const { month, day } = getDateParts(event.date);
                const isToday = normalizeDate(event.date) === todayString;
                const isSaved = savedEventIds.includes(event.id); // CHECK IF SAVED

                return (
                  <div
                    key={event.id || index}
                    className={`group relative flex gap-4 p-4 rounded-2xl transition-all duration-300 cursor-default border
                                 ${isToday
                        ? "bg-blue-50/80 border-blue-200 shadow-md ring-1 ring-blue-100"
                        : "bg-white border-gray-200/60 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-0.5"
                      }`}
                  >
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-opacity
                                   ${isToday ? "bg-[#D9232D] opacity-100" : "bg-[#1e3a8a] opacity-0 group-hover:opacity-100"}`}></div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className={`h-6 w-12 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg shadow-sm z-10 transition-colors
                                     ${isToday ? "bg-[#D9232D] text-white" : "bg-gray-200 text-gray-600 group-hover:bg-[#D9232D] group-hover:text-white"}`}>
                        {month}
                      </div>
                      <div className={`h-10 w-12 text-lg font-bold flex items-center justify-center rounded-b-lg border-x border-b border-gray-100 shadow-sm transition-colors
                                     ${isToday ? "bg-white text-[#D9232D] border-red-100" : "bg-white text-[#1e3a8a] group-hover:bg-blue-50/50"}`}>
                        {day}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 py-0.5 pl-1 flex flex-col h-full">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-bold text-sm leading-snug transition-colors mb-1.5 ${isToday ? "text-[#D9232D]" : "text-gray-900 group-hover:text-[#1e3a8a]"}`}>
                          {event.title}
                        </h4>
                        {isToday && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <AlertCircle size={8} /> HOY
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border 
                                        ${isToday ? "bg-white text-red-600 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100/50"}`}>
                          <Clock size={10} strokeWidth={2.5} /> {event.time ? event.time.slice(0, 5) : "Todo el día"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                        {event.description}
                      </p>

                      {/* AGENDA BUTTON (LIGHT) - WITH ACTIVE LOGIC */}
                      <div className="mt-auto flex justify-end">
                        <button
                          onClick={() => handleToggleEvent(event.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                                   ${isSaved
                              ? "bg-green-600 text-white border-green-600 shadow-md hover:bg-green-700" // Saved Style
                              : "bg-white text-[#1e3a8a] border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800" // Normal Style
                            }`}
                        >
                          {isSaved ? <Check size={12} /> : <CalendarPlus size={12} />}
                          {isSaved ? "Agendado" : "Agendar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white p-3 text-center border-t border-gray-100 relative z-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            Universidad Central del Ecuador
          </p>
        </div>
      </div>
    </div>
  );
}