import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom"; // 🔥 1. useSearchParams

// LIBRERÍAS DE GESTIÓN DE ESTADO Y SOCKETS
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider } from "./context/SocketContext";
import api from "./api/client";
import { useAuthStore } from "./store/authStore";

// Contexto de Tema
import { ThemeProvider } from "./context/ThemeContext";

// HOOKS
import { useLocations } from "./hooks/useLocations";
import { useEvents } from "./hooks/useEvents";

// Lazy Loading - TODOS los componentes pesados
const Scene3D = lazy(() => import("./components/map/Scene3D").then((m) => ({ default: m.Scene3D })));
const MapOverlay = lazy(() => import("./components/map/MapOverlay").then((m) => ({ default: m.MapOverlay })));
const LoginScreen = lazy(() => import("./components/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const VerifyEmail = lazy(() => import("./components/VerifyEmail").then((m) => ({ default: m.VerifyEmail })));

const queryClient = new QueryClient();

// Loader de Pantalla Completa
function ScreenLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white gap-4 transition-colors duration-500">
      <div className="w-12 h-12 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
      <div className="animate-pulse font-bold tracking-widest text-sm">CARGANDO INTERFAZ...</div>
    </div>
  );
}

// ====================================================================
// COMPONENTE CONTENEDOR DE LÓGICA (AppContent)
// ====================================================================
function AppContent() {
  const { locations } = useLocations();

  // 🔥 2. OBTENEMOS 'setEvents' PARA ACTUALIZAR LA LISTA EN TIEMPO REAL
  const { events: dbEvents, setEvents } = useEvents();

  const { user, login, logout, isLoading } = useAuthStore();

  // Estados UI
  const [viewMode, setViewMode] = useState("map");
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);

  // Estados de Modos
  const [isFpsMode, setIsFpsMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 🔥 3. ESTADOS PARA GESTIÓN DE URL Y AGENDA AUTOMÁTICA
  const [searchParams, setSearchParams] = useSearchParams();
  const [autoOpenEvents, setAutoOpenEvents] = useState(false);

  // 1. VERIFICAR SESIÓN (solo una vez al montar)
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data } = await api.get("/profile");
        if (isMounted) {
          login(data.user);

          // Limpiamos URL solo si no es estudiante (si es estudiante, la animación lo usa)
          if (data.user.role !== 'student' && searchParams.get("loginSuccess")) {
            setSearchParams({});
          }
        }
      } catch (error) {
        // Silenciosamente manejar error 401 (usuario no autenticado)
        if (isMounted && error.response?.status !== 401) {
          console.error("Error verificando sesión:", error);
        }
        if (isMounted) {
          logout();
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []); // Solo ejecutar una vez al montar

  // 2. ANIMACIÓN BIENVENIDA ESTUDIANTE Y APERTURA DE AGENDA
  useEffect(() => {
    const isReady =
      user?.role === "student" &&
      user?.faculty_id &&
      locations.length > 0 &&
      !welcomeAnimationDone;

    if (isReady) {
      const myFaculty = locations.find((l) => l.id == user.faculty_id);

      if (myFaculty) {
        console.log("📍 Facultad encontrada, iniciando viaje a:", myFaculty.name);

        const timer = setTimeout(() => {
          setSelectedLoc(myFaculty);
          setWelcomeAnimationDone(true);
          setSearchParams({}); // Limpiamos URL después de la animación
        }, 500);

        // 🔥 4. DISPARO DE AGENDA AUTOMÁTICA (2.5s después)
        setTimeout(() => {
          console.log("📅 Disparando apertura automática de agenda...");
          setAutoOpenEvents(true);
        }, 2500);

        return () => clearTimeout(timer);
      } else {
        console.warn("⚠️ No se encontró la facultad con ID:", user.faculty_id);
      }
    }
  }, [user, locations, welcomeAnimationDone, searchParams, setSearchParams]);

  // 🔥 5. MANEJADORES PARA EL DASHBOARD DE ADMIN (CRUD LOCAL)
  const handleAddEvent = (newEvent) => {
    setEvents((prev) => [newEvent, ...prev]); // Agregamos al inicio
  };

  const handleUpdateEvent = (updatedEvent) => {
    setEvents((prev) =>
      prev.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt))
    );
  };

  const handleDeleteEvent = (id) => {
    setEvents((prev) => prev.filter((evt) => evt.id !== id));
  };

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      await api.post("/logout");
      logout();
      setWelcomeAnimationDone(false);
      setSelectedLoc(null);
      setIsFpsMode(false);
      setAutoOpenEvents(false);
    } catch (e) { console.error(e); }
  };

  const registerVisit = async (locationId) => {
    console.log('🏢 [APP] Registrando visita para location:', locationId);
    try {
      await api.post(`/locations/${locationId}/visit`);
      console.log('✅ [APP] Visita registrada exitosamente');
    }
    catch (e) {
      console.error('❌ [APP] Error registrando visita:', e);
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

      if (hasRelevantEvents) setTimeout(() => setShowEventsModal(true), 300);
      else setShowEventsModal(false);
    }
  };

  const toggleFpsMode = () => {
    if (isFpsMode) document.exitPointerLock();
    setIsTransitioning(true);
    setIsFpsMode(!isFpsMode);
    setSelectedLoc(null);
    setTimeout(() => setIsTransitioning(false), 3000);
  };

  // --- RENDERIZADO ---
  if (isLoading) return <ScreenLoader />;

  if (!user) return (<Suspense fallback={<ScreenLoader />}><LoginScreen /></Suspense>);

  if (user.role === "admin" && viewMode === "admin")
    return (
      <Suspense fallback={<ScreenLoader />}>
        <AdminDashboard
          onLogout={handleLogout}
          onViewMap={() => setViewMode("map")}
          events={dbEvents}
          // 🔥 6. PASAMOS LAS FUNCIONES AL DASHBOARD
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </Suspense>
    );

  return (
    <div id="canvas-container" className="relative h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans flex flex-col transition-colors duration-500">
      <Suspense fallback={<ScreenLoader />}>
        <Scene3D
          isFpsMode={isFpsMode}
          isTransitioning={isTransitioning}
          userFacultyId={user?.faculty_id}
          locations={locations}
          events={dbEvents}
          targetLocation={selectedLoc}
          onEdificioClick={(name) => {
            const loc = locations.find((l) => l.object3d_id === name);
            if (loc) handleLocationSelect(loc);
          }}
          onEventFound={(loc) => {
            setSelectedLoc(loc);
            setShowEventsModal(true);
          }}
          onVisitRegistered={(loc) => registerVisit(loc.id)}
        />

        <MapOverlay
          user={user}
          locations={locations}
          events={dbEvents}
          selectedLoc={selectedLoc}
          showEventsModal={showEventsModal}
          autoOpenEvents={autoOpenEvents}
          onAutoEventsOpened={() => setAutoOpenEvents(false)}
          isFpsMode={isFpsMode}
          isTransitioning={isTransitioning}
          onLogout={handleLogout}
          onViewModeChange={setViewMode}
          onLocationSelect={handleLocationSelect}
          onCloseInfoCard={() => setSelectedLoc(null)}
          onShowEvents={(loc) => {
            setSelectedLoc(loc);
            setShowEventsModal(true);
          }}
          onCloseEventsModal={() => setShowEventsModal(false)}
          onToggleFpsMode={toggleFpsMode}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          <Routes>
            <Route path="/verify-email" element={<Suspense fallback={<ScreenLoader />}><VerifyEmail /></Suspense>} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}