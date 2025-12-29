import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Search, LogOut, Settings } from "lucide-react";

// --- IMPORTACIÓN DE COMPONENTES ---
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { ZoomControls, Instructions } from './components/Controls';
import { UniversityLogo } from './components/UniversityLogo'; // Ya no dará error
import Campus3D from './Campus3D';
import { locations } from './data/locations';

// Loader visual
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-bold text-xs tracking-widest animate-pulse">CARGANDO...</p>
      </div>
    </Html>
  );
}

export default function App() {
  // ESTADOS PRINCIPALES
  const [userRole, setUserRole] = useState(null); // null = No logueado
  const [viewMode, setViewMode] = useState('map'); // 'map' o 'admin'
  
  // ESTADOS DEL MAPA
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  
  // ESTADOS DE DATOS (Eventos)
  const [events, setEvents] = useState([
    { id: 1, title: "Feria de Ciencias", location: "Facultad de Ingeniería", date: "2025-01-20", time: "10:00" }
  ]);

  // --- LÓGICA 1: SI NO HAY USUARIO, MOSTRAR LOGIN ---
  if (!userRole) {
    return (
      <LoginScreen 
        onLogin={(role) => {
          setUserRole(role);
          setViewMode('map'); // Al entrar, vamos al mapa primero
        }} 
      />
    );
  }

  // --- LÓGICA 2: SI ES ADMIN Y QUIERE VER EL PANEL ---
  if (userRole === 'admin' && viewMode === 'admin') {
    return (
      <AdminDashboard 
        onLogout={() => setUserRole(null)} 
        onViewMap={() => setViewMode('map')}
        events={events}
        onAddEvent={(evt) => setEvents([...events, evt])}
        onDeleteEvent={(id) => setEvents(events.filter(e => e.id !== id))}
      />
    );
  }

  // --- LÓGICA 3: VISTA DEL MAPA 3D (Para todos) ---
  return (
    <div className="relative h-screen w-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* CAPA 3D */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          camera={{ position: [60, 60, 60], fov: 45 }} 
          shadows={false} // Desactivamos sombras para rendimiento
          dpr={[1, 1.5]}  // Limitamos resolución para velocidad
        >
          <Suspense fallback={<Loader />}>
            <Campus3D onEdificioClick={(name) => {
              const loc = locations.find(l => l.name === name);
              if (loc) setSelectedLoc(loc);
            }} />
            <Environment preset="city" />
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 5]} intensity={1.2} />
          </Suspense>
          <OrbitControls makeDefault minDistance={20} maxDistance={200} />
        </Canvas>
      </div>

      {/* CAPA DE INTERFAZ (UI) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4">
            <UniversityLogo /> {/* Logo visible */}
            
            {/* Buscador (Solo aparece si el panel está cerrado) */}
            {!showSearch && (
              <button 
                onClick={() => setShowSearch(true)}
                className="ml-20 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-gray-600 hover:text-[#D9232D] transition-all border border-white/50"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:block">Buscar...</span>
              </button>
            )}
          </div>

          {/* Botones de Usuario */}
          <div className="flex gap-2">
            {/* Botón Admin (Solo si eres admin) */}
            {userRole === 'admin' && (
              <button 
                onClick={() => setViewMode('admin')}
                className="bg-white p-3 rounded-xl shadow-lg text-[#1e3a8a] hover:bg-gray-100 transition-colors border-2 border-[#1e3a8a]"
                title="Ir al Panel Administrativo"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={() => setUserRole(null)}
              className="bg-white p-3 rounded-xl shadow-lg text-red-600 hover:bg-red-50 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paneles Flotantes */}
        <div className="pointer-events-auto">
          {showSearch && (
            <SearchPanel 
              locations={locations} 
              onLocationSelect={(loc) => { setSelectedLoc(loc); setShowSearch(false); }} 
              onClose={() => setShowSearch(false)} 
            />
          )}

          <BuildingInfoCard 
            location={selectedLoc} 
            onClose={() => setSelectedLoc(null)} 
          />
        </div>

        {/* Controles Abajo */}
        <div className="pointer-events-auto">
           <Instructions />
           <ZoomControls />
        </div>
      </div>
    </div>
  );
}