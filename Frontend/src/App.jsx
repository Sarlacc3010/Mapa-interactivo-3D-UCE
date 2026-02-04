import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom"; // 🔥 1. AGREGADO: useSearchParams

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

// COMPONENTES REFACTORIZADOS
import { Scene3D } from "./components/map/Scene3D";
import { MapOverlay } from "./components/map/MapOverlay";

// Lazy Loading
const LoginScreen = lazy(() =>
  import("./components/LoginScreen").then((m) => ({ default: m.LoginScreen })),
);
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const VerifyEmail = lazy(() =>
  import("./components/VerifyEmail").then((m) => ({ default: m.VerifyEmail })),
);

const queryClient = new QueryClient();

// Loader de Pantalla Completa
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

// ====================================================================
// COMPONENTE CONTENEDOR DE LÓGICA (AppContent)
// ====================================================================
function AppContent() {
  const { locations } = useLocations();
  const { events: dbEvents } = useEvents();

  // ZUSTAND: Obtenemos el usuario aquí
  const { user, login, logout, isLoading } = useAuthStore();

  // Estados UI
  const [viewMode, setViewMode] = useState("map");
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);

  // Estados de Modos
  const [isFpsMode, setIsFpsMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 🔥 2. HOOK NUEVO: Para manejar la URL limpiamente
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. VERIFICAR SESIÓN
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get("/profile");
        login(data.user);
        
        // 🔥 3. MEJORA: Limpiamos la URL usando el hook de React Router
        // Solo si NO es estudiante limpiamos directo. Si es estudiante, la animación puede depender de esto en el futuro.
        // Pero como tu lógica usa 'welcomeAnimationDone', podemos limpiar aquí sin problemas.
        if (searchParams.get("loginSuccess")) {
           setSearchParams({}); // Reemplaza a window.history.replaceState
        }
      } catch (error) {
        logout();
      }
    };
    checkSession();
  }, [login, logout, searchParams, setSearchParams]);

  // 2. ANIMACIÓN BIENVENIDA ESTUDIANTE (TU LÓGICA ORIGINAL)
  useEffect(() => {
    // Solo procedemos si tenemos todos los datos necesarios
    const isReady =
      user?.role === "student" &&
      user?.faculty_id &&
      locations.length > 0 &&
      !welcomeAnimationDone;

    if (isReady) {
      // Buscamos la facultad usando '==' para que no importe si es número o texto
      const myFaculty = locations.find((l) => l.id == user.faculty_id);

      if (myFaculty) {
        console.log(
          "📍 Facultad encontrada, iniciando viaje a:",
          myFaculty.name,
        );

        // 🔥 CLAVE: Esperamos 500ms para asegurar que el Mapa 3D esté listo antes de mover la cámara
        const timer = setTimeout(() => {
          setSelectedLoc(myFaculty);
          setWelcomeAnimationDone(true);
        }, 500);

        // Revisar si hay eventos en esa facultad
        const hasEvents = dbEvents.some((e) => e.location_id == myFaculty.id);
        if (hasEvents) {
          // Mostrar popup de eventos un poco después de llegar
          setTimeout(() => setShowEventsModal(true), 2500);
        }

        return () => clearTimeout(timer);
      } else {
        console.warn("⚠️ No se encontró la facultad con ID:", user.faculty_id);
      }
    }
  }, [user, locations, dbEvents, welcomeAnimationDone]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      await api.post("/logout");
      logout();
      setWelcomeAnimationDone(false);
      setSelectedLoc(null);
      setIsFpsMode(false);
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

  if (!user)
    return (
      <Suspense fallback={<ScreenLoader />}>
        <LoginScreen />
      </Suspense>
    );

  if (user.role === "admin" && viewMode === "admin")
    return (
      <Suspense fallback={<ScreenLoader />}>
        <AdminDashboard
          onLogout={handleLogout}
          onViewMap={() => setViewMode("map")}
          events={dbEvents}
        />
      </Suspense>
    );

  return (
    <div
      id="canvas-container"
      className="relative h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans flex flex-col transition-colors duration-500"
    >
      {/* CAPA 1: Escena 3D */}
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

      {/* CAPA 2: Interfaz de Usuario (Pasamos 'user' aquí) */}
      <MapOverlay
        user={user}
        locations={locations}
        events={dbEvents}
        selectedLoc={selectedLoc}
        showEventsModal={showEventsModal}
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
    </div>
  );
}

// ====================================================================
// WRAPPER PRINCIPAL
// ====================================================================
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          <Routes>
            <Route
              path="/verify-email"
              element={
                <Suspense fallback={<ScreenLoader />}>
                  <VerifyEmail />
                </Suspense>
              }
            />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}