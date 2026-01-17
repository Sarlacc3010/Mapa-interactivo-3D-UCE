import React, { useState, useEffect, Suspense, lazy } from 'react';

// 1. IMPORTAMOS LIBRERÍAS DE TIEMPO REAL
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

// Librerías Gráficas
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// Iconos
import { LogOut, Settings, HelpCircle, Map, Clock, Calendar, Search, MapPin } from "lucide-react";

// Componentes
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { EventsPopup } from './components/EventsPopup';
import { ZoomControls, Instructions } from './components/Controls';

// Lazy Loading
const LoginScreen = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Campus3D = lazy(() => import('./Campus3D'));

// --- CONFIGURACIÓN CLIENTE DE DATOS ---
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
// COMPONENTE PRINCIPAL (LÓGICA INTERNA)
// ====================================================================
function AppContent() {
  const queryClient = useQueryClient(); // Para controlar la caché manualmente

  // --- 1. CONEXIÓN WEBSOCKET (LA MAGIA) ---
  useEffect(() => {
    // Conectamos al servidor de Sockets
    const socket = io('http://localhost:5000', {
      withCredentials: true, // Importante para CORS
    });

    socket.on('connect', () => {
      console.log("🟢 [SOCKET] Conectado al Campus en Tiempo Real");
    });

    // ESCUCHAMOS EL GRITO DEL SERVIDOR
    socket.on('server:data_updated', (payload) => {
      console.log("🔥 [SOCKET] Cambio detectado:", payload);
      
      // ORDENAMOS ACTUALIZACIÓN INMEDIATA
      queryClient.invalidateQueries(['locations']); 
      queryClient.invalidateQueries(['events']);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);


  // --- 2. OBTENCIÓN DE DATOS (REEMPLAZA A useLocations) ---
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => fetch('http://localhost:5000/api/locations').then(res => res.json()),
    staleTime: Infinity, // Confiamos en el Socket, no caduca solo
  });

  const { data: dbEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('http://localhost:5000/api/events').then(res => res.json()),
    staleTime: Infinity,
  });

  // Estados de Usuario
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [viewMode, setViewMode] = useState('map');

  // Estados de Interfaz
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  
  // Flag para animación de bienvenida
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);

  // --- 3. SESIÓN ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user.role);
          setUserProfile(data.user);

          const params = new URLSearchParams(window.location.search);
          if (params.get('loginSuccess')) {
            window.history.replaceState({}, document.title, "/");
          }
        }
      } catch (error) { console.log("No hay sesión activa"); }
    };
    checkSession();
  }, []);

  // --- 4. LÓGICA "BIENVENIDA AL ESTUDIANTE" ---
  useEffect(() => {
    if (
        userRole === 'student' && 
        userProfile?.faculty_id && 
        locations.length > 0 && 
        !welcomeAnimationDone
    ) {
        const myFaculty = locations.find(l => String(l.id) === String(userProfile.faculty_id));

        if (myFaculty) {
            console.log(`🎓 Estudiante detectado de: ${myFaculty.name}`);
            setSelectedLoc(myFaculty);
            setWelcomeAnimationDone(true); 

            const hasEvents = dbEvents.some(e => 
                String(e.location_id) === String(myFaculty.id) || 
                e.location_name === myFaculty.name
            );

            if (hasEvents) {
                setTimeout(() => setShowEventsModal(true), 1500);
            }
        }
    }
  }, [userRole, userProfile, locations, dbEvents, welcomeAnimationDone]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', { method: 'POST', credentials: 'include' });
      setUserRole(null);
      setUserProfile(null);
      setWelcomeAnimationDone(false);
      setSelectedLoc(null);
    } catch (e) { console.error(e); }
  };

  const handleShowEvents = (location) => {
    setSelectedLoc(location);
    setShowEventsModal(true);
  };

  // ✅ NUEVA FUNCIÓN: REGISTRAR VISITA (SILENCIOSA)
  const registerVisit = async (locationId) => {
    try {
      // Enviamos el POST sin esperar respuesta (Fire & Forget)
      await fetch(`http://localhost:5000/api/locations/${locationId}/visit`, { method: 'POST' });
      console.log(`👁️ Visita registrada al ID: ${locationId}`);
    } catch (e) {
      console.error("Error contando visita", e);
    }
  };

  // ✅ HANDLER MODIFICADO: Seleccionar + Contar Visita
  const handleLocationSelect = (loc) => {
    setSelectedLoc(loc);
    
    // Si hay un lugar válido, le decimos al backend que lo visitaron
    if (loc && (loc.id || loc._id)) {
        registerVisit(loc.id || loc._id);
    }
  };

  // --- RENDERIZADO ---

  if (!userRole) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <LoginScreen onLogin={() => { 
            fetch('http://localhost:5000/api/profile', { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    setUserProfile(data.user);
                    setUserRole(data.user.role);
                    setViewMode('map');
                })
                .catch(err => console.error("Error post-login:", err));
        }} />
      </Suspense>
    );
  }

  if (userRole === 'admin' && viewMode === 'admin') {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <AdminDashboard
          onLogout={handleLogout}
          onViewMap={() => setViewMode('map')}
          events={dbEvents}
          // El dashboard actualizará vía Socket
          onAddEvent={() => {}} 
          onDeleteEvent={() => {}}
          onUpdateEvent={() => {}}
        />
      </Suspense>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-gray-900 overflow-hidden font-sans flex flex-col">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [60, 60, 60], fov: 45 }} shadows dpr={[1, 1.5]}>
          <Suspense fallback={<Loader3D />}>
            <Campus3D
              userFacultyId={userProfile?.faculty_id} 
              onEdificioClick={(blenderObjectName) => {
                const loc = locations.find(l => l.object3d_id === blenderObjectName);
                if (loc) {
                  // ✅ Usamos el handler centralizado que también cuenta la visita
                  handleLocationSelect(loc);
                }
              }}
              targetLocation={selectedLoc}
              locations={locations}
              events={dbEvents}
            />
            <Environment preset="city" />
            <ambientLight intensity={0.7} />
            <directionalLight position={[50, 80, 30]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          </Suspense>
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} minDistance={20} maxDistance={150} enableDamping={true} dampingFactor={0.05} />
        </Canvas>
      </div>

      <Header className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent border-none text-white z-50">
        <div className="flex items-center gap-3">
          {/* MENÚ DE AYUDA */}
          {userRole !== 'admin' && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-white/80 text-xs font-medium cursor-help hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 border border-white/10">
                <HelpCircle size={14} />
                <span className="hidden sm:inline">Guía</span>
              </button>
              {/* Contenido Popup Ayuda... */}
              <div className="absolute right-0 top-full mt-3 w-72 bg-black/90 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-2xl text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-50">
                <h4 className="text-xs font-bold text-[#D9232D] uppercase mb-4 tracking-wider border-b border-white/10 pb-2">¿Qué puedes hacer?</h4>
                <ul className="space-y-4 text-xs">
                  <li className="flex items-start gap-3"><div className="p-1.5 bg-blue-500/20 rounded-md shrink-0 text-blue-400"><Map size={16} /></div><div><p className="font-bold text-white/90">Explora el Campus</p><p className="text-white/60 leading-snug">Navega libremente por el modelo 3D.</p></div></li>
                  <li className="flex items-start gap-3"><div className="p-1.5 bg-green-500/20 rounded-md shrink-0 text-green-400"><Search size={16} /></div><div><p className="font-bold text-white/90">Encuentra Facultades</p><p className="text-white/60 leading-snug">Usa la lupa para buscar edificios.</p></div></li>
                  <li className="flex items-start gap-3"><div className="p-1.5 bg-yellow-500/20 rounded-md shrink-0 text-yellow-400"><Clock size={16} /></div><div><p className="font-bold text-white/90">Verifica Horarios</p><p className="text-white/60 leading-snug">Mira en tiempo real si está abierto.</p></div></li>
                  <li className="flex items-start gap-3"><div className="p-1.5 bg-purple-500/20 rounded-md shrink-0 text-purple-400"><Calendar size={16} /></div><div><p className="font-bold text-white/90">Agenda de Eventos</p><p className="text-white/60 leading-snug">Entérate de las actividades.</p></div></li>
                  {userRole === 'student' && (<li className="flex items-start gap-3 bg-white/5 p-2 rounded border border-white/10"><div className="p-1.5 bg-red-500/20 rounded-md shrink-0 text-red-400"><MapPin size={16} /></div><div><p className="font-bold text-white/90">Tu Facultad</p><p className="text-white/60 leading-snug">Tu edificio está señalado con un pin.</p></div></li>)}
                </ul>
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-black/90 border-t border-l border-white/10 transform rotate-45"></div>
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <button onClick={() => setViewMode('admin')} className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors" title="Panel Administrativo">
              <Settings className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
              {userProfile?.name && (
                  <span className="hidden md:block text-xs font-medium text-white/80 bg-black/30 px-3 py-1.5 rounded-full border border-white/5 animate-in fade-in">
                      Hola, {userProfile.name.split(' ')[0]}
                  </span>
              )}
              <button onClick={handleLogout} className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors border border-white/5" title="Cerrar Sesión">
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </div>
      </Header>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <SearchPanel
            locations={locations}
            onLocationSelect={handleLocationSelect}
          />

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
            events={dbEvents}
          />
        </div>

        <div className="pointer-events-auto">
          <Instructions />
          <ZoomControls />
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// EXPORTACIÓN PRINCIPAL
// ====================================================================
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}