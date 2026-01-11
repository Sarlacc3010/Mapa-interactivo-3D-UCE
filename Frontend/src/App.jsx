import React, { useState, useEffect, Suspense, lazy } from 'react';

// Librerías Gráficas
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// Iconos y Componentes Ligeros
import { Search, LogOut, Settings } from "lucide-react";
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { EventsPopup } from './components/EventsPopup';
import { ZoomControls, Instructions } from './components/Controls';
import { useLocations } from './hooks/useLocations';

// Componentes Pesados (Lazy Loading corregido)
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
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [dbEvents, setDbEvents] = useState([]);

  // --- 1. PERSISTENCIA DE SESIÓN ---
  // Al recargar, preguntamos al backend si la cookie es válida
  useEffect(() => {
    const checkSession = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/profile', {
                credentials: 'include' // Envía la cookie automáticamente
            });
            if (res.ok) {
                const data = await res.json();
                setUserRole(data.user.role);
            }
        } catch (error) {
            // No hay sesión, nos quedamos en null (Login)
            console.log("No hay sesión activa");
        }
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

  // Logout seguro
  const handleLogout = async () => {
    try {
        await fetch('http://localhost:5000/api/logout', { 
            method: 'POST', 
            credentials: 'include' 
        });
        setUserRole(null);
    } catch(e) {
        console.error(e);
    }
  };

  const handleShowEvents = (location) => {
    setSelectedLoc(location);
    setShowEventsModal(true);
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
              onEdificioClick={(name) => {
                const loc = locations.find(l => l.name === name);
                if (loc) setSelectedLoc(loc);
              }}
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
          {!showSearch && (
            <button onClick={() => setShowSearch(true)} className="hidden sm:flex bg-white/10 backdrop-blur hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm items-center gap-2 transition-all border border-white/10">
              <Search className="w-4 h-4" /> <span>Buscar Facultad</span>
            </button>
          )}
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
          {showSearch && <SearchPanel locations={locations} onLocationSelect={(loc) => { setSelectedLoc(loc); setShowSearch(false); }} onClose={() => setShowSearch(false)} />}
          {selectedLoc && <BuildingInfoCard location={selectedLoc} onClose={() => setSelectedLoc(null)} onShowEvents={handleShowEvents} />}
          <EventsPopup isOpen={showEventsModal} onClose={() => setShowEventsModal(false)} locationName={selectedLoc?.name} events={dbEvents} />
        </div>
        <div className="pointer-events-auto">
          <Instructions />
          <ZoomControls />
        </div>
      </div>
    </div>
  );
}