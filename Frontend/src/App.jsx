import React, { useState, useEffect, Suspense, lazy } from 'react';

// 1. IMPORTAMOS LIBRERÍAS DE GESTIÓN DE ESTADO Y SOCKETS
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './context/SocketContext'; // 🔥 Contexto Nuevo
import api from './api/client'; // 🔥 API Centralizada

// 2. IMPORTAMOS LOS NUEVOS HOOKS INTELIGENTES
import { useLocations } from './hooks/useLocations';
import { useEvents } from './hooks/useEvents';

// Librerías Gráficas
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, KeyboardControls } from '@react-three/drei';

// Iconos
import { LogOut, Settings, HelpCircle, Map, Clock, Calendar, Search, MapPin, Footprints, Plane } from "lucide-react";

// Componentes
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { EventsPopup } from './components/EventsPopup';
import { Instructions } from './components/Controls';
import { FirstPersonController } from './components/fps/FirstPersonController';

// Lazy Loading
const LoginScreen = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Campus3D = lazy(() => import('./Campus3D'));

// Configuración Cliente
const queryClient = new QueryClient();

// Loaders
function ScreenLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white gap-4">
      <div className="w-12 h-12 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
      <div className="animate-pulse font-bold tracking-widest text-sm">CARGANDO INTERFAZ...</div>
    </div>
  );
}

function Loader3D() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
        <div className="w-10 h-10 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-bold text-xs tracking-widest bg-black/50 px-2 py-1 rounded">CARGANDO 3D...</div>
      </div>
    </Html>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL (LÓGICA + UI)
// ====================================================================
function AppContent() {
  // 🔥 1. USAMOS LOS HOOKS (Sustituyen a los useQuery manuales)
  const { locations } = useLocations();
  const { events: dbEvents } = useEvents();

  // Estados UI
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);
  const [isFpsMode, setIsFpsMode] = useState(false);

  // Mapeo de Teclas
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
  ];

  // --- SESIÓN ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Usamos la instancia de API centralizada
        const { data } = await api.get('/profile');
        setUserRole(data.user.role);
        setUserProfile(data.user);

        const params = new URLSearchParams(window.location.search);
        if (params.get('loginSuccess')) {
          window.history.replaceState({}, document.title, "/");
        }
      } catch (error) { console.log("No hay sesión activa"); }
    };
    checkSession();
  }, []);

  // --- BIENVENIDA ESTUDIANTE ---
  useEffect(() => {
    if (userRole === 'student' && userProfile?.faculty_id && locations.length > 0 && !welcomeAnimationDone) {
        const myFaculty = locations.find(l => String(l.id) === String(userProfile.faculty_id));
        if (myFaculty) {
            setSelectedLoc(myFaculty);
            setWelcomeAnimationDone(true); 
            const hasEvents = dbEvents.some(e => String(e.location_id) === String(myFaculty.id));
            if (hasEvents) setTimeout(() => setShowEventsModal(true), 1500);
        }
    }
  }, [userRole, userProfile, locations, dbEvents, welcomeAnimationDone]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      await api.post('/logout'); // Usando API
      setUserRole(null);
      setUserProfile(null);
      setWelcomeAnimationDone(false);
      setSelectedLoc(null);
      setIsFpsMode(false);
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  const registerVisit = async (locationId) => {
    try { 
        // Usando API centralizada (esto activará el socket en el backend)
        await api.post(`/locations/${locationId}/visit`); 
    } catch (e) { console.error(e); }
  };

  const handleLocationSelect = (loc) => {
    // 1. Establecer la ubicación seleccionada (Muestra la tarjeta de info)
    setSelectedLoc(loc);

    if (loc?.id) {
        // 2. Registrar la visita en la BD
        registerVisit(loc.id);

        // 3. 🔥 LÓGICA DE AUTO-APERTURA DE EVENTOS
        // Verificamos si existen eventos FUTUROS o DE HOY en este lugar
        const hasRelevantEvents = dbEvents.some(event => {
            // A. Coincide el ID del lugar
            const isSameLocation = String(event.location_id) === String(loc.id);
            
            // B. Es una fecha válida (Hoy o Futuro)
            // Esto evita que salten popups por eventos del año pasado
            const eventDate = new Date(event.date.split('T')[0] + 'T00:00:00'); // Asegurar formato ISO
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Resetear hora a las 00:00 para comparar solo fecha

            return isSameLocation && eventDate >= today;
        });

        console.log(`📍 Lugar: ${loc.name}, ¿Eventos?: ${hasRelevantEvents}`);

        // Si hay eventos, abrimos el popup automáticamente
        if (hasRelevantEvents) {
            // Pequeño retraso (300ms) para que la animación sea suave:
            // Primero aparece la info del edificio, luego ¡Pum! salta el evento.
            setTimeout(() => setShowEventsModal(true), 300);
        } else {
            // Si no hay eventos, nos aseguramos de que el modal esté cerrado
            setShowEventsModal(false);
        }
    }
  };

  const handleShowEvents = (location) => {
    setSelectedLoc(location);
    setShowEventsModal(true);
  };

  // --- RENDERIZADO ---
  if (!userRole) return <Suspense fallback={<ScreenLoader />}><LoginScreen onLogin={() => window.location.reload()} /></Suspense>;
  
  if (userRole === 'admin' && viewMode === 'admin') return (
    <Suspense fallback={<ScreenLoader />}>
        <AdminDashboard 
            onLogout={handleLogout} 
            onViewMap={() => setViewMode('map')} 
            events={dbEvents}
            // Ya no necesitamos refresh manual, el SocketContext se encarga
            onAddEvent={() => {}} 
            onUpdateEvent={() => {}} 
            onDeleteEvent={() => {}} 
        />
    </Suspense>
  );

  return (
    <div id="canvas-container" className="relative h-screen w-screen bg-gray-900 overflow-hidden font-sans flex flex-col">
      
      {/* 1. MIRA (CROSSHAIR) - Restaurado */}
      {isFpsMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
           <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)]"></div>
        </div>
      )}

      {/* 2. BOTÓN CAMBIO VISTA - Restaurado */}
      <div className="absolute bottom-6 right-6 z-50">
        <button 
          onClick={() => {
            setIsFpsMode(!isFpsMode);
            setSelectedLoc(null);
          }}
          className={`flex items-center gap-3 px-5 py-3 rounded-full font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 ${
            isFpsMode 
              ? "bg-white text-gray-800 border-gray-200 hover:bg-gray-50" 
              : "bg-[#1e3a8a] text-white border-blue-700 hover:bg-blue-900"
          }`}
        >
          {isFpsMode ? <Plane size={20} className="text-[#D9232D]" /> : <Footprints size={20} />}
          <span>{isFpsMode ? "Vista Satélite" : "Caminar"}</span>
        </button>
      </div>

      {/* 3. INSTRUCCIONES WASD - Restaurado */}
      {isFpsMode && (
         <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 text-white bg-black/60 px-6 py-2 rounded-full backdrop-blur-md pointer-events-none border border-white/10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <span className="flex items-center gap-2 text-xs font-mono"><span className="text-yellow-400">WASD</span> Moverse</span>
            <span className="w-px h-3 bg-white/20"></span>
            <span className="flex items-center gap-2 text-xs font-mono"><span className="text-yellow-400">ESC</span> Cursor</span>
         </div>
      )}

      {/* 4. ESCENA 3D */}
      <div className="absolute inset-0 z-0">
        <KeyboardControls map={keyboardMap}>
          <Canvas camera={{ position: [60, 60, 60], fov: 45 }} shadows dpr={[1, 1.5]}>
            <Suspense fallback={<Loader3D />}>
              <Campus3D
                userFacultyId={userProfile?.faculty_id} 
                isFpsMode={isFpsMode}
                onEdificioClick={(name) => {
                  const loc = locations.find(l => l.object3d_id === name);
                  if (loc) handleLocationSelect(loc);
                }}
                targetLocation={selectedLoc}
                locations={locations}
                events={dbEvents}
                onEventFound={(loc) => {
                    console.log("Evento cerca:", loc.name);
                    setSelectedLoc(loc);
                    setShowEventsModal(true); 
                }}
                onVisitRegistered={(loc) => {
                    console.log("Visita registrada por cercanía:", loc.name);
                    registerVisit(loc.id); 
                }}
              />
              <Environment preset="city" />
              <ambientLight intensity={0.7} />
              <directionalLight position={[50, 80, 30]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
            </Suspense>
            
            {isFpsMode ? (
               <FirstPersonController active={isFpsMode} speed={40} />
            ) : (
               <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} minDistance={50} maxDistance={150} enableDamping={true} dampingFactor={0.05} />
            )}
          </Canvas>
        </KeyboardControls>
      </div>

      {/* 5. HEADER COMPLETO - Restaurado con Guía y Saludo */}
      <Header className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent border-none text-white z-50">
        <div className="flex items-center gap-3">
          
          {/* ✅ TOOLKIT (GUÍA) - El bloque que faltaba */}
          {userRole !== 'admin' && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-white/80 text-xs font-medium cursor-help hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 border border-white/10">
                <HelpCircle size={14} />
                <span className="hidden sm:inline">Guía</span>
              </button>
              
              <div className="absolute right-0 top-full pt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="bg-black/90 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-2xl text-white">
                    <h4 className="text-xs font-bold text-[#D9232D] uppercase mb-4 tracking-wider border-b border-white/10 pb-2">¿Qué puedes hacer?</h4>
                    <ul className="space-y-4 text-xs">
                      <li className="flex items-start gap-3"><div className="p-1.5 bg-blue-500/20 rounded-md shrink-0 text-blue-400"><Map size={16} /></div><div><p className="font-bold text-white/90">Explora el Campus</p><p className="text-white/60 leading-snug">Navega libremente por el modelo 3D.</p></div></li>
                      <li className="flex items-start gap-3"><div className="p-1.5 bg-green-500/20 rounded-md shrink-0 text-green-400"><Search size={16} /></div><div><p className="font-bold text-white/90">Encuentra Facultades</p><p className="text-white/60 leading-snug">Usa la lupa para buscar edificios.</p></div></li>
                      <li className="flex items-start gap-3"><div className="p-1.5 bg-yellow-500/20 rounded-md shrink-0 text-yellow-400"><Clock size={16} /></div><div><p className="font-bold text-white/90">Verifica Horarios</p><p className="text-white/60 leading-snug">Mira en tiempo real si está abierto.</p></div></li>
                      <li className="flex items-start gap-3"><div className="p-1.5 bg-purple-500/20 rounded-md shrink-0 text-purple-400"><Calendar size={16} /></div><div><p className="font-bold text-white/90">Agenda de Eventos</p><p className="text-white/60 leading-snug">Entérate de las actividades.</p></div></li>
                      {userRole === 'student' && (<li className="flex items-start gap-3 bg-white/5 p-2 rounded border border-white/10"><div className="p-1.5 bg-red-500/20 rounded-md shrink-0 text-red-400"><MapPin size={16} /></div><div><p className="font-bold text-white/90">Tu Facultad</p><p className="text-white/60 leading-snug">Tu edificio está señalado con un pin.</p></div></li>)}
                    </ul>
                    <div className="absolute top-[6px] right-6 w-3 h-3 bg-black/90 border-t border-l border-white/10 transform rotate-45"></div>
                  </div>
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <button onClick={() => setViewMode('admin')} className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors"><Settings className="w-5 h-5" /></button>
          )}

          <div className="flex items-center gap-2">
              {/* ✅ SALUDO AL USUARIO - Restaurado */}
              {userProfile?.name && <span className="hidden md:block text-xs font-medium text-white/80 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">Hola, {userProfile.name.split(' ')[0]}</span>}
              <button onClick={handleLogout} className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors border border-white/5"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </Header>

      {/* 6. PANELES FLOTANTES Y POPUPS - Restaurada la lógica de visualización */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Panel de Búsqueda (Se oculta en modo FPS o cuando hay selección) */}
          <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${(!isFpsMode && !selectedLoc) ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}`}>
             <div className="mt-4 ml-4 w-96 max-w-[80vw]"><SearchPanel locations={locations} onLocationSelect={handleLocationSelect} /></div>
          </div>
          
          {/* Tarjeta de Información */}
          {selectedLoc && <BuildingInfoCard location={selectedLoc} onClose={() => setSelectedLoc(null)} onShowEvents={handleShowEvents} />}
          
          {/* ✅ POPUP DE EVENTOS - Restaurado con la corrección de ID */}
          <EventsPopup 
              isOpen={showEventsModal} 
              onClose={() => setShowEventsModal(false)} 
              locationName={selectedLoc?.name}
              locationId={selectedLoc?.id}  // 🔥 ESTA ES LA CLAVE PARA QUE FUNCIONE EL FILTRO
              events={dbEvents} 
          />
        </div>
        
        {/* Instrucciones de Navegación (Solo si no estás en modo FPS y sin selección) */}
        {!isFpsMode && !selectedLoc && <div className="pointer-events-auto"><Instructions /></div>}
      </div>
    </div>
  );
}

// 🔥 ENVOLTURA FINAL (Providers)
export default function App() { 
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </QueryClientProvider>
  ); 
}