import React, { useState, useEffect, Suspense, lazy } from 'react';

// Librerías Gráficas
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// Iconos
import { LogOut, Settings, HelpCircle, Map, Clock, Calendar, Search } from "lucide-react";
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { EventsPopup } from './components/EventsPopup';
import { ZoomControls, Instructions } from './components/Controls';
import { useLocations } from './hooks/useLocations';

// Lazy Loading
const LoginScreen = lazy(() => import('./components/LoginScreen').then(m => ({ default: m.LoginScreen })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Campus3D = lazy(() => import('./Campus3D'));

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

export default function App() {
  const { locations } = useLocations();
  const [userRole, setUserRole] = useState(null);
  const [viewMode, setViewMode] = useState('map');

  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [dbEvents, setDbEvents] = useState([]);

  // --- 1. SESIÓN ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user.role);
          const params = new URLSearchParams(window.location.search);
          if (params.get('loginSuccess')) {
            window.history.replaceState({}, document.title, "/");
          }
        }
      } catch (error) { console.log("No hay sesión activa"); }
    };
    checkSession();
  }, []);

  // --- 2. CARGAR EVENTOS ---
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => setDbEvents(data))
      .catch(err => console.error("Error cargando eventos:", err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', { method: 'POST', credentials: 'include' });
      setUserRole(null);
    } catch (e) { console.error(e); }
  };

  const handleShowEvents = (location) => {
    setSelectedLoc(location);
    setShowEventsModal(true);
  };

  const handleLocationSelect = (loc) => {
    setSelectedLoc(loc);
  };

  // --- RENDERIZADO ---

  if (!userRole) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <LoginScreen onLogin={(role) => { setUserRole(role); setViewMode('map'); }} />
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
          onAddEvent={(evt) => setDbEvents([...dbEvents, evt])}
          onDeleteEvent={(id) => setDbEvents(dbEvents.filter(e => e.id !== id))}
          onUpdateEvent={(updatedEvt) => {
            setDbEvents(dbEvents.map(e => e.id === updatedEvt.id ? updatedEvt : e));
          }}
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
              onEdificioClick={(blenderObjectName) => {
                // Buscamos coincidencia entre el nombre del objeto en Blender y el object3d_id de la BD
                const loc = locations.find(l => l.object3d_id === blenderObjectName);

                if (loc) {
                  setSelectedLoc(loc);
                } else {
                  console.log(`Objeto clickeado: "${blenderObjectName}", pero no existe en la BD.`);
                }
              }}
              targetLocation={selectedLoc}
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

          {/* --- TOOLTIP DE GUÍA (Solo visible si NO eres admin) --- */}
          {userRole !== 'admin' && (
            <div className="relative group">
              <button className="flex items-center gap-2 text-white/80 text-xs font-medium cursor-help hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 border border-white/10">
                <HelpCircle size={14} />
                <span className="hidden sm:inline">Guía</span>
              </button>

              {/* Menú Optimizado (Más rápido y ligero) */}
              <div className="absolute right-0 top-full mt-3 w-72 bg-black/90 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-2xl text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-50">
                <h4 className="text-xs font-bold text-[#D9232D] uppercase mb-4 tracking-wider border-b border-white/10 pb-2">
                  ¿Qué puedes hacer?
                </h4>
                <ul className="space-y-4 text-xs">
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-md shrink-0 text-blue-400">
                      <Map size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white/90">Explora el Campus</p>
                      <p className="text-white/60 leading-snug">Navega libremente por el modelo 3D de la universidad.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-green-500/20 rounded-md shrink-0 text-green-400">
                      <Search size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white/90">Encuentra Facultades</p>
                      <p className="text-white/60 leading-snug">Usa la lupa para buscar edificios y servicios específicos.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-yellow-500/20 rounded-md shrink-0 text-yellow-400">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white/90">Verifica Horarios</p>
                      <p className="text-white/60 leading-snug">Mira en tiempo real si una instalación está abierta o cerrada.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500/20 rounded-md shrink-0 text-purple-400">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white/90">Agenda de Eventos</p>
                      <p className="text-white/60 leading-snug">Entérate de las actividades programadas en cada facultad.</p>
                    </div>
                  </li>
                </ul>
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-black/90 border-t border-l border-white/10 transform rotate-45"></div>
              </div>
            </div>
          )}
          {/* -------------------------------------------------------- */}

          {userRole === 'admin' && (
            <button onClick={() => setViewMode('admin')} className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors" title="Panel Administrativo">
              <Settings className="w-5 h-5" />
            </button>
          )}

          <button onClick={handleLogout} className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors border border-white/5" title="Cerrar Sesión">
            <LogOut className="w-5 h-5" />
          </button>
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