import React, { useState, useEffect, Suspense, lazy } from "react";

// 1. IMPORTAMOS LIBRERÍAS DE GESTIÓN DE ESTADO Y SOCKETS
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "./context/SocketContext";
import api from "./api/client";

// 🔥 NUEVO: Contexto de Tema y Botón Switch
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";

// 2. IMPORTAMOS LOS NUEVOS HOOKS INTELIGENTES
import { useLocations } from "./hooks/useLocations";
import { useEvents } from "./hooks/useEvents";

// Librerías Gráficas
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Html,
  KeyboardControls,
} from "@react-three/drei";

// Iconos
import {
  LogOut,
  Settings,
  HelpCircle,
  Map,
  Clock,
  Calendar,
  Search,
  MapPin,
  Footprints,
  Plane,
} from "lucide-react";

// Componentes
import { Header } from "./components/Header";
import { SearchPanel } from "./components/SearchPanel";
import { BuildingInfoCard } from "./components/BuildingInfoCard";
import { EventsPopup } from "./components/EventsPopup";
import { Instructions } from "./components/Controls";
import { FirstPersonController } from "./components/fps/FirstPersonController";

// Lazy Loading
const LoginScreen = lazy(() =>
  import("./components/LoginScreen").then((m) => ({ default: m.LoginScreen })),
);
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const Campus3D = lazy(() => import("./Campus3D"));

// Configuración Cliente
const queryClient = new QueryClient();

// Loaders
function ScreenLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white gap-4 transition-colors duration-500">
      <div className="w-12 h-12 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
      <div className="animate-pulse font-bold tracking-widest text-sm">
        CARGANDO INTERFAZ...
      </div>
    </div>
  );
}

function Loader3D() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
        <div className="w-10 h-10 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-bold text-xs tracking-widest bg-black/50 px-2 py-1 rounded">
          CARGANDO 3D...
        </div>
      </div>
    </Html>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL (LÓGICA + UI)
// ====================================================================
function AppContent() {
  const { locations } = useLocations();
  const { events: dbEvents } = useEvents();

  // Estados UI
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);

  // Estados de Modos
  const [isFpsMode, setIsFpsMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Mapeo de Teclas
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "w", "W"] },
    { name: "backward", keys: ["ArrowDown", "s", "S"] },
    { name: "left", keys: ["ArrowLeft", "a", "A"] },
    { name: "right", keys: ["ArrowRight", "d", "D"] },
  ];

  // --- SESIÓN ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get("/profile");
        setUserRole(data.user.role);
        setUserProfile(data.user);

        const params = new URLSearchParams(window.location.search);
        if (params.get("loginSuccess")) {
          window.history.replaceState({}, document.title, "/");
        }
      } catch (error) {
        console.log("No hay sesión activa");
      }
    };
    checkSession();
  }, []);

  // --- BIENVENIDA ESTUDIANTE ---
  useEffect(() => {
    if (
      userRole === "student" &&
      userProfile?.faculty_id &&
      locations.length > 0 &&
      !welcomeAnimationDone
    ) {
      const myFaculty = locations.find(
        (l) => String(l.id) === String(userProfile.faculty_id),
      );
      if (myFaculty) {
        setSelectedLoc(myFaculty);
        setWelcomeAnimationDone(true);
        const hasEvents = dbEvents.some(
          (e) => String(e.location_id) === String(myFaculty.id),
        );
        if (hasEvents) setTimeout(() => setShowEventsModal(true), 1500);
      }
    }
  }, [userRole, userProfile, locations, dbEvents, welcomeAnimationDone]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      await api.post("/logout");
      setUserRole(null);
      setUserProfile(null);
      setWelcomeAnimationDone(false);
      setSelectedLoc(null);
      setIsFpsMode(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const registerVisit = async (locationId) => {
    try {
      await api.post(`/locations/${locationId}/visit`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocationSelect = (loc) => {
    setSelectedLoc(loc);
    if (loc?.id) {
      registerVisit(loc.id);
      const hasRelevantEvents = dbEvents.some((event) => {
        const isSameLocation = String(event.location_id) === String(loc.id);
        const eventDate = new Date(event.date.split("T")[0] + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return isSameLocation && eventDate >= today;
      });

      if (hasRelevantEvents) {
        setTimeout(() => setShowEventsModal(true), 300);
      } else {
        setShowEventsModal(false);
      }
    }
  };

  const handleShowEvents = (location) => {
    setSelectedLoc(location);
    setShowEventsModal(true);
  };

  // --- RENDERIZADO ---
  if (!userRole)
    return (
      <Suspense fallback={<ScreenLoader />}>
        <LoginScreen onLogin={() => window.location.reload()} />
      </Suspense>
    );

  if (userRole === "admin" && viewMode === "admin")
    return (
      <Suspense fallback={<ScreenLoader />}>
        <AdminDashboard
          onLogout={handleLogout}
          onViewMap={() => setViewMode("map")}
          events={dbEvents}
          onAddEvent={() => {}}
          onUpdateEvent={() => {}}
          onDeleteEvent={() => {}}
        />
      </Suspense>
    );

  return (
    <div
      id="canvas-container"
      // CAMBIO: Fondo gris claro en modo Light, Negro en modo Dark
      className="relative h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans flex flex-col transition-colors duration-500"
    >
      {/* 1. ELEMENTOS UI PARA MODO CAMINAR */}
      {isFpsMode && !isTransitioning && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)]"></div>
          </div>
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold pointer-events-none animate-pulse">
            Clic en pantalla para controlar
          </div>
        </>
      )}

      {/* 🔥 BOTÓN DARK MODE */}
      <div className="absolute bottom-28 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-700">
        <ThemeToggle />
      </div>

      {/* 2. BOTÓN CAMBIO VISTA (Adaptado Claro/Oscuro) */}
      <div className="absolute bottom-8 right-8 z-50">
        <button
          onClick={() => {
            if (isFpsMode) document.exitPointerLock();
            setIsTransitioning(true);
            const nextMode = !isFpsMode;
            setIsFpsMode(nextMode);
            setSelectedLoc(null);
            setTimeout(() => setIsTransitioning(false), 3000);
          }}
          disabled={isTransitioning}
          className={`
            relative group flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 active:scale-95 border
            
            /* ESTILOS MODO CLARO (Limpios) */
            bg-white text-gray-700 border-gray-200 shadow-xl hover:bg-gray-50
            
            /* ESTILOS MODO OSCURO (Neón) */
            dark:bg-slate-900/80 
            ${
              isFpsMode
                ? "dark:border-red-500/50 dark:text-red-400 dark:shadow-[0_0_20px_rgba(220,38,38,0.4)] dark:hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                : "dark:border-cyan-500/50 dark:text-cyan-400 dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
            }
            ${isTransitioning ? "opacity-50 cursor-wait grayscale" : ""}
          `}
        >
          {/* Brillo interno solo en Dark Mode */}
          <div
            className={`hidden dark:block absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${isFpsMode ? "bg-red-500" : "bg-cyan-500"}`}
          ></div>

          {isFpsMode ? <Footprints size={24} /> : <Plane size={24} />}
          <span className="tracking-wider uppercase text-xs">
            {isFpsMode ? "Modo Caminar" : "Vista Aérea"}
          </span>
        </button>
      </div>

      {/* 3. INSTRUCCIONES WASD */}
      {isFpsMode && !isTransitioning && (
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 px-6 py-2 rounded-full backdrop-blur-md pointer-events-none flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 border
                        bg-white/80 text-gray-800 border-gray-200
                        dark:text-white dark:bg-black/60 dark:border-white/10"
        >
          <span className="flex items-center gap-2 text-xs font-mono">
            <span className="text-orange-500 dark:text-yellow-400">WASD</span>{" "}
            Moverse
          </span>
          <span className="w-px h-3 bg-gray-300 dark:bg-white/20"></span>
          <span className="flex items-center gap-2 text-xs font-mono">
            <span className="text-orange-500 dark:text-yellow-400">ESC</span>{" "}
            Cursor
          </span>
        </div>
      )}

      {/* 4. ESCENA 3D */}
      <div className="absolute inset-0 z-0">
        <KeyboardControls map={keyboardMap}>
          <Canvas
            camera={{ position: [60, 60, 60], fov: 45 }}
            shadows
            dpr={[1, 1.5]}
          >
            <Suspense fallback={<Loader3D />}>
              <Campus3D
                userFacultyId={userProfile?.faculty_id}
                isFpsMode={isFpsMode}
                onEdificioClick={(name) => {
                  const loc = locations.find((l) => l.object3d_id === name);
                  if (loc) handleLocationSelect(loc);
                }}
                targetLocation={selectedLoc}
                locations={locations}
                events={dbEvents}
                onEventFound={(loc) => {
                  setSelectedLoc(loc);
                  setShowEventsModal(true);
                }}
                onVisitRegistered={(loc) => {
                  registerVisit(loc.id);
                }}
              />
              <Environment preset="city" />
              <ambientLight intensity={0.7} />
              <directionalLight
                position={[50, 80, 30]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
            </Suspense>
            {!isTransitioning && (
              <>
                {isFpsMode ? (
                  <FirstPersonController active={isFpsMode} speed={40} />
                ) : (
                  <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={50}
                    maxDistance={150}
                    enableDamping={true}
                    dampingFactor={0.05}
                  />
                )}
              </>
            )}
          </Canvas>
        </KeyboardControls>
      </div>

      {/* 5. HEADER COMPLETO */}
      <Header
        className="absolute top-0 left-0 w-full border-b transition-colors duration-500 z-50
                          bg-gradient-to-b from-white/90 to-transparent border-white/20
                          dark:from-black/80 dark:border-none"
      >
        <div className="flex items-center gap-3">
          {/* TOOLKIT (GUÍA) */}
          {userRole !== "admin" && (
            <div className="relative group">
              <button
                className="flex items-center gap-2 text-xs font-medium cursor-help transition-colors px-3 py-1.5 rounded-full border
                                 text-gray-700 bg-white/50 border-gray-200 hover:bg-white hover:text-blue-700
                                 dark:text-white/80 dark:bg-white/10 dark:border-white/10 dark:hover:text-white dark:hover:bg-white/20"
              >
                <HelpCircle size={14} />
                <span className="hidden sm:inline">Guía</span>
              </button>

              <div className="absolute right-0 top-full pt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 z-50">
                <div
                  className="p-5 rounded-xl shadow-2xl backdrop-blur-md border
                                bg-white/95 text-gray-800 border-gray-100
                                dark:bg-black/90 dark:text-white dark:border-white/10"
                >
                  <h4 className="text-xs font-bold uppercase mb-4 tracking-wider border-b pb-2 text-[#D9232D] border-gray-200 dark:border-white/10">
                    ¿Qué puedes hacer?
                  </h4>
                  <ul className="space-y-4 text-xs">
                    <li className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-500/10 rounded-md shrink-0 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        <Map size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90">Explora el Campus</p>
                        <p className="opacity-60 leading-snug">
                          Navega libremente por el modelo 3D.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1.5 bg-green-500/10 rounded-md shrink-0 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                        <Search size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90">
                          Encuentra Facultades
                        </p>
                        <p className="opacity-60 leading-snug">
                          Usa la lupa para buscar edificios.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1.5 bg-yellow-500/10 rounded-md shrink-0 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90">
                          Verifica Horarios
                        </p>
                        <p className="opacity-60 leading-snug">
                          Mira en tiempo real si está abierto.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1.5 bg-purple-500/10 rounded-md shrink-0 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="font-bold opacity-90">
                          Agenda de Eventos
                        </p>
                        <p className="opacity-60 leading-snug">
                          Entérate de las actividades.
                        </p>
                      </div>
                    </li>
                    {userRole === "student" && (
                      <li className="flex items-start gap-3 p-2 rounded border bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/10">
                        <div className="p-1.5 bg-red-500/10 rounded-md shrink-0 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="font-bold opacity-90">Tu Facultad</p>
                          <p className="opacity-60 leading-snug">
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

          {userRole === "admin" && (
            <button
              onClick={() => setViewMode("admin")}
              className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            {userProfile?.name && (
              <span
                className="hidden md:block text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                                 text-gray-700 bg-white/60 border-gray-200
                                 dark:text-white/80 dark:bg-black/30 dark:border-white/5"
              >
                Hola, {userProfile.name.split(" ")[0]}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors border
                               bg-white/50 text-red-500 border-gray-200 hover:bg-red-50
                               dark:bg-white/10 dark:text-red-400 dark:border-white/5 dark:hover:bg-red-900/50 dark:hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Header>

      {/* 6. PANELES FLOTANTES */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <div
            className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${!isFpsMode && !selectedLoc ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}
          >
            <div className="mt-4 ml-4 w-96 max-w-[80vw]">
              <SearchPanel
                locations={locations}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>

          {selectedLoc && (
            <BuildingInfoCard
              location={selectedLoc}
              onClose={() => setSelectedLoc(null)}
              onShowEvents={handleShowEvents}
            />
          )}

          <EventsPopup
            isOpen={showEventsModal}
            onClose={() => setShowEventsModal(false)}
            locationName={selectedLoc?.name}
            locationId={selectedLoc?.id}
            events={dbEvents}
          />
        </div>
        {!isFpsMode && !selectedLoc && (
          <div className="pointer-events-auto">
            <Instructions />
          </div>
        )}
      </div>
    </div>
  );
}

// 🔥 ENVOLTURA FINAL CON THEME PROVIDER
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}