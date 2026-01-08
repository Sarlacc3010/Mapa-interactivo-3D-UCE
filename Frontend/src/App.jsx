import React, { useState, useEffect, Suspense } from 'react';

// --- 1. Librerías Gráficas (React Three Fiber) ---
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// --- 2. Iconos (Lucide React) ---
import { Search, LogOut, Settings } from "lucide-react";

// --- 3. Componentes de Estructura ---
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// --- 4. Pantallas Principales ---
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';

// --- 5. Componentes de UI del Mapa ---
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { EventsPopup } from './components/EventsPopup'; // <--- [NUEVO] Importamos el Popup
import { ZoomControls, Instructions } from './components/Controls';

// --- 6. Modelo 3D y Datos ---
import Campus3D from './Campus3D'; 
import { useLocations } from './hooks/useLocations'; 

// --- Loader de Carga ---
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-white font-bold text-xs tracking-widest animate-pulse">CARGANDO...</div>
      </div>
    </Html>
  );
}

export default function App() {
  // Hook que trae las facultades de Mongo/Postgres
  const { locations } = useLocations();
  
  // --- ESTADOS ---
  const [userRole, setUserRole] = useState(null); 
  const [viewMode, setViewMode] = useState('map'); 
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // --- [NUEVO] Estados para el Pop-up de Eventos ---
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [dbEvents, setDbEvents] = useState([]); // Eventos reales traídos del Backend

  // --- [NUEVO] Efecto para cargar eventos reales al iniciar ---
  useEffect(() => {
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => setDbEvents(data))
      .catch(err => console.error("Error cargando eventos:", err));
  }, []);

  // Función para manejar la apertura del modal desde la tarjeta
  const handleShowEvents = (location) => {
    setSelectedLoc(location); // Aseguramos que esté seleccionada
    setShowEventsModal(true); // Abrimos el modal
  };

  // --- 1. RENDERIZADO: PANTALLA DE LOGIN ---
  if (!userRole) {
    return (
      <LoginScreen
        onLogin={(role) => {
          setUserRole(role);
          setViewMode('map');
        }}
      />
    );
  }

  // --- 2. RENDERIZADO: PANEL DE ADMIN ---
  if (userRole === 'admin' && viewMode === 'admin') {
    return (
      <AdminDashboard
        onLogout={() => setUserRole(null)}
        onViewMap={() => setViewMode('map')}
        // Pasamos los eventos reales al dashboard también
        events={dbEvents} 
        onAddEvent={(evt) => setDbEvents([...dbEvents, evt])} // Actualiza la lista local al crear
        onDeleteEvent={(id) => setDbEvents(dbEvents.filter(e => e.id !== id))}
      />
    );
  }

  // --- 3. RENDERIZADO: MAPA 3D PRINCIPAL ---
  return (
    <div className="relative h-screen w-screen bg-gray-900 overflow-hidden font-sans flex flex-col">

      {/* CAPA FONDO: El Canvas 3D */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [60, 60, 60], fov: 45 }}
          shadows 
          dpr={[1, 1.5]}
        >
          <Suspense fallback={<Loader />}>
            <Campus3D 
              onEdificioClick={(name) => {
                const loc = locations.find(l => l.name === name);
                if (loc) setSelectedLoc(loc);
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
          <OrbitControls
            makeDefault
            minPolarAngle={0}            
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={20}
            maxDistance={150}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* CAPA SUPERIOR: Interfaz */}
      <Header className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/80 to-transparent border-none text-white z-50">
        <div className="flex items-center gap-3">
          {/* Botón Buscar */}
          {!showSearch && (
            <button
              onClick={() => setShowSearch(true)}
              className="hidden sm:flex bg-white/10 backdrop-blur hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm items-center gap-2 transition-all border border-white/10"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Facultad</span>
            </button>
          )}

          {/* Botón Admin */}
          {userRole === 'admin' && (
            <button
              onClick={() => setViewMode('admin')}
              className="p-2 bg-[#D9232D] text-white rounded-lg shadow-lg hover:bg-[#b81d26] transition-colors"
              title="Panel Administrativo"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Botón Salir */}
          <button
            onClick={() => setUserRole(null)}
            className="p-2 bg-white/10 text-red-400 rounded-lg hover:bg-red-900/50 hover:text-red-300 transition-colors border border-white/5"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </Header>

      {/* PANELES FLOTANTES */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Zona Interactiva (Buscador y Tarjetas) */}
        <div className="pointer-events-auto">
          {showSearch && (
            <SearchPanel
              locations={locations} 
              onLocationSelect={(loc) => { setSelectedLoc(loc); setShowSearch(false); }}
              onClose={() => setShowSearch(false)}
            />
          )}

          {selectedLoc && (
            <BuildingInfoCard
              location={selectedLoc}
              onClose={() => setSelectedLoc(null)}
              // [NUEVO] Conectamos el botón de la tarjeta con la función del App
              onShowEvents={handleShowEvents} 
            />
          )}
          
          {/* [NUEVO] Componente Pop-up de Eventos */}
          <EventsPopup 
            isOpen={showEventsModal}
            onClose={() => setShowEventsModal(false)}
            locationName={selectedLoc?.name} // Filtra eventos por el nombre del lugar actual
            events={dbEvents}
          />
        </div>

        {/* Zona de Controles (Zoom, Instrucciones) */}
        <div className="pointer-events-auto">
          <Instructions />
          <ZoomControls />
        </div>
      </div>

    </div>
  );
}