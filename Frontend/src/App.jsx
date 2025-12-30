import React, { useState, Suspense } from 'react';

// --- 1. Librerías Gráficas (React Three Fiber) ---
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';

// --- 2. Iconos (Lucide React) ---
import { Search, LogOut, Settings } from "lucide-react";

// --- 3. Componentes de Estructura (Nuevos) ---
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// --- 4. Pantallas Principales ---
import { LoginScreen } from './components/LoginScreen';
// Asegúrate de tener este archivo o comenta la línea si aún no lo creas:
import { AdminDashboard } from './components/AdminDashboard';

// --- 5. Componentes de UI del Mapa ---
// (Si no tienes alguno de estos archivos, coméntalos temporalmente)
import { SearchPanel } from './components/SearchPanel';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { ZoomControls, Instructions } from './components/Controls';

// --- 6. Modelo 3D y Datos ---
import Campus3D from './Campus3D'; // Asumiendo que está en la raíz de src
import { locations } from './data/locations'; // Asumiendo que está en src/data/locations.js

// --- Loader de Carga (Componente interno) ---
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
  // --- ESTADOS ---
  const [userRole, setUserRole] = useState(null); // null | 'user' | 'admin'
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'admin'
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // Datos de prueba para el Dashboard
  const [events, setEvents] = useState([
    { id: 1, title: "Feria de Ciencias", location: "Facultad de Ingeniería", date: "2025-01-20", time: "10:00" }
  ]);

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
    // Si no tienes AdminDashboard creado aún, puedes poner un <div>Hola Admin</div> temporal
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

  // --- 3. RENDERIZADO: MAPA 3D PRINCIPAL ---
  return (
    <div className="relative h-screen w-screen bg-gray-900 overflow-hidden font-sans flex flex-col">

      {/* CAPA FONDO: El Canvas 3D */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [60, 60, 60], fov: 45 }}
          shadows // <--- ¡Asegúrate de que esto esté aquí!
          dpr={[1, 1.5]}
        >
          <Suspense fallback={<Loader />}>
            <Campus3D onEdificioClick={(name) => {
              const loc = locations.find(l => l.name === name);
              if (loc) setSelectedLoc(loc);
            }} />
            <Environment preset="city" />
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[50, 80, 30]}
              intensity={1.5}
              castShadow // <--- La luz debe emitir sombra
              shadow-mapSize={[1024, 1024]} // Calidad de sombra
            />
          </Suspense>
          <OrbitControls
            makeDefault

            // 1. Limitar rotación vertical (Para no ir debajo del suelo)
            minPolarAngle={0}             // No mirar directo hacia arriba (opcional)
            maxPolarAngle={Math.PI / 2.1} // ¡IMPORTANTE! 90 grados máx (el horizonte)

            // 2. Limitar Zoom (Para no atravesar edificios ni irse al espacio)
            minDistance={20}
            maxDistance={150}

            // 3. Suavizado (Para que se sienta como un drone)
            enableDamping={true}
            dampingFactor={0.05}

          // 4. (Opcional) Limitar rotación horizontal si solo quieres ver una cara
          // minAzimuthAngle={-Math.PI / 4}
          // maxAzimuthAngle={Math.PI / 4}
          />
        </Canvas>
      </div>

      {/* CAPA SUPERIOR: Interfaz (Header y Paneles) */}

      {/* HEADER: Barra superior transparente */}
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

          {/* Botón Admin (Solo si es admin) */}
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

      {/* PANELES FLOTANTES (Search, Info, Controles) */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Paneles interactivos (pointer-events-auto reactiva los clics) */}
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
            />
          )}
        </div>

        {/* Controles de Zoom e Instrucciones */}
        <div className="pointer-events-auto">
          {/* Si no tienes estos componentes, coméntalos */}
          <Instructions />
          <ZoomControls />
        </div>
      </div>

    </div>
  );
}