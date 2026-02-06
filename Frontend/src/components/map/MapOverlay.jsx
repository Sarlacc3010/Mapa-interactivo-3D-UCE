import React, { useState, useEffect } from "react";
// UI Components
import { Header } from "../Header";
import { SearchPanel } from "../SearchPanel";
import { BuildingInfoCard } from "../BuildingInfoCard";
import { EventsModal } from "../events/EventsModal";
import { Instructions } from "../Controls";
import { ThemeToggle } from "../ThemeToggle";

// Calendar Modal
import { MyAgendaModal } from "../events/MyAgendaModal";
import { CalendarCheck } from "lucide-react";

// New Reusable UI Components
import { ViewModeButton, WasdControlsHint, Crosshair } from "../ui/MapControls";

// Icons
import {
  HelpCircle,
  Map as MapIcon,
  Clock,
  Calendar,
  Search,
  MapPin,
  Settings,
  LogOut,
} from "lucide-react";

export function MapOverlay({
  user,
  locations,
  selectedLoc,
  isFpsMode,
  isTransitioning,
  // Handlers
  onLogout,
  onViewModeChange,
  onLocationSelect,
  onCloseInfoCard,
  onToggleFpsMode,

  // NEW PROPS FOR AUTO OPENING
  autoOpenEvents,
  onAutoEventsOpened,
}) {
  // 1. LOCAL STATE TO CONTROL FACULTY EVENTS MODAL
  const [showEvents, setShowEvents] = useState(false);

  // 2. LOCAL STATE TO CONTROL MY AGENDA MODAL (PERSONAL)
  const [showMyAgenda, setShowMyAgenda] = useState(false);

  // 3. EFFECT: AUTO OPENING
  useEffect(() => {
    if (autoOpenEvents && selectedLoc) {
      setShowEvents(true);
      if (onAutoEventsOpened) onAutoEventsOpened();
    }
  }, [autoOpenEvents, selectedLoc, onAutoEventsOpened]);

  return (
    <>
      {/* 1. WALK MODE ELEMENTS (Crosshair and Hint) */}
      {isFpsMode && !isTransitioning && (
        <>
          <Crosshair />
          <WasdControlsHint />
        </>
      )}

      {/* 2. FLOATING CONTROLS (Theme and View Mode) */}
      <div className="absolute bottom-28 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-700">
        <ThemeToggle />
      </div>

      <div className="absolute bottom-8 right-8 z-50">
        <ViewModeButton
          isFpsMode={isFpsMode}
          isTransitioning={isTransitioning}
          onClick={onToggleFpsMode}
        />
      </div>

      {/* 3. HEADER (With Greeting and Toolkit) */}
      <Header className="absolute top-0 left-0 w-full border-b transition-colors duration-500 z-50 bg-gradient-to-b from-white/90 to-transparent border-white/20 dark:from-black/80 dark:border-none">
        <div className="flex items-center gap-3">
          {/* TOOLKIT (GUIDE) - Only if not admin */}
          {user?.role !== "admin" && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-medium cursor-help transition-all duration-300 px-3 py-1.5 rounded-full border text-gray-700 bg-white/50 border-gray-200 hover:bg-white hover:text-blue-700 dark:bg-slate-900 dark:text-cyan-400 dark:border-cyan-500/50 dark:hover:text-cyan-300 dark:hover:border-cyan-400 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                <HelpCircle
                  size={14}
                  className="dark:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
                />
                <span className="hidden sm:inline">Guía</span>
              </button>

              {/* Tooltip Content */}
              <div className="absolute right-0 top-full pt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-5 rounded-xl backdrop-blur-md border bg-white/95 text-gray-800 border-gray-100 shadow-2xl dark:bg-slate-900/95 dark:text-slate-200 dark:border-cyan-500/30 dark:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                  <h4 className="text-xs font-bold uppercase mb-4 tracking-wider border-b pb-2 text-[#D9232D] border-gray-200 dark:text-cyan-400 dark:border-cyan-500/30 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                    ¿Qué puedes hacer?
                  </h4>
                  <ul className="space-y-4 text-xs">
                    <li className="flex items-start gap-3 group/item">
                      <div className="p-1.5 rounded-md shrink-0 bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/30">
                        <MapIcon size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90 dark:text-blue-200">
                          Explora el Campus
                        </p>
                        <p className="opacity-60 leading-snug dark:text-slate-400">
                          Navega libremente por el modelo 3D.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="p-1.5 rounded-md shrink-0 bg-green-500/10 text-green-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
                        <Search size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90 dark:text-emerald-200">
                          Encuentra Facultades
                        </p>
                        <p className="opacity-60 leading-snug dark:text-slate-400">
                          Usa la lupa para buscar edificios.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="p-1.5 rounded-md shrink-0 bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border dark:border-yellow-500/30">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90 dark:text-yellow-200">
                          Verifica Horarios
                        </p>
                        <p className="opacity-60 leading-snug dark:text-slate-400">
                          Mira en tiempo real si está abierto.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="p-1.5 rounded-md shrink-0 bg-purple-500/10 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 dark:border dark:border-purple-500/30">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90 dark:text-purple-200">
                          Agenda de Eventos
                        </p>
                        <p className="opacity-60 leading-snug dark:text-slate-400">
                          Entérate de las actividades.
                        </p>
                      </div>
                    </li>
                    {user?.role === "student" && (
                      <li className="flex items-start gap-3 p-2 rounded border transition-all duration-300 bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-pink-500/30 dark:hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                        <div className="p-1.5 rounded-md shrink-0 bg-red-500/10 text-red-600 dark:bg-pink-500/10 dark:text-pink-400 dark:shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="font-bold opacity-90 dark:text-pink-200">
                            Tu Facultad
                          </p>
                          <p className="opacity-60 leading-snug dark:text-slate-400">
                            Tu edificio está señalado con un pin.
                          </p>
                        </div>
                      </li>
                    )}
                  </ul>
                  <div className="absolute top-[6px] right-6 w-3 h-3 border-t border-l transform rotate-45 bg-white border-gray-100 dark:bg-black/90 dark:border-white/10"></div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN DASHBOARD BUTTON */}
          {user?.role === "admin" && (
            <button
              onClick={() => onViewModeChange("admin")}
              className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* GREETING AND LOGOUT */}
          <div className="flex items-center gap-2">
            {user?.name && (
              <span className="hidden md:block text-xs font-medium px-3 py-1.5 rounded-full border transition-colors text-gray-700 bg-white/60 border-gray-200 dark:text-white/80 dark:bg-black/30 dark:border-white/5">
                Hola, {user.name.split(" ")[0]}
              </span>
            )}

            {/* MY AGENDA BUTTON (Only for authenticated students) */}
            {user?.role === "student" && (
              <button
                onClick={() => setShowMyAgenda(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold
                           bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:shadow-sm
                           dark:bg-slate-900 dark:text-purple-400 dark:border-purple-500/30 dark:hover:border-purple-400 dark:hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                <CalendarCheck size={14} />
                <span>Mi Agenda</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-2 rounded-lg transition-all duration-300 border shadow-sm group
                         /* Light Mode: Solid UCE Red */
                         bg-white text-[#D9232D] border-red-100 hover:bg-red-50 
                         /* Dark Mode: Bright Neon Red */
                         dark:bg-slate-900/80 dark:text-red-400 dark:border-red-500/50  
                         dark:hover:text-red-300 dark:hover:border-red-400 
                         dark:hover:shadow-[0_0_15px_rgba(248,113,113,0.5)]"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 stroke-[2.5px] dark:drop-shadow-[0_0_5px_rgba(248,113,113,0.8)] transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </Header>

      {/* 4. INTERACTIVE PANELS (Search and Modals) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Search Panel */}
          <div
            className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${!isFpsMode && !selectedLoc ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}
          >
            <div className="mt-4 ml-4 w-96 max-w-[80vw]">
              <SearchPanel
                locations={locations}
                onLocationSelect={onLocationSelect}
              />
            </div>
          </div>

          {/* Information Card */}
          {selectedLoc && (
            <BuildingInfoCard
              location={selectedLoc}
              onClose={onCloseInfoCard}
              onShowEvents={() => setShowEvents(true)}
            />
          )}

          {/* FACULTY EVENTS MODAL */}
          <EventsModal
            isOpen={showEvents}
            onClose={() => setShowEvents(false)}
            location={selectedLoc}
          />

          {/* NEW PERSONAL AGENDA MODAL */}
          <MyAgendaModal
            isOpen={showMyAgenda}
            onClose={() => setShowMyAgenda(false)}
          />

        </div>

        {/* Floating Instructions */}
        {!isFpsMode && !selectedLoc && (
          <div className="pointer-events-auto">
            <Instructions />
          </div>
        )}
      </div>
    </>
  );
}