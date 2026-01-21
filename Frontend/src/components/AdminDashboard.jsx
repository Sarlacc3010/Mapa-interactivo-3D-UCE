import React, { useState, useRef } from "react";
import { useLocations } from "../hooks/useLocations";
import { Sidebar } from "./dashboard/Sidebar";
import { AnalyticsTab } from "./dashboard/AnalyticsTab";
import { EventsTab } from "./dashboard/EventsTab";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

// 🔥 GSAP
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const { theme } = useTheme(); 
  const [activeTab, setActiveTab] = useState('events');
  const { locations } = useLocations();

  // Ref para animar la entrada del Dashboard
  const dashboardRef = useRef();

  useGSAP(() => {
    // Animaciones originales exactas
    gsap.from(".sidebar-anim", { x: -50, opacity: 0, duration: 0.6, ease: "power2.out" });
    gsap.from(".header-anim", { y: -20, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
    gsap.from(".content-anim", { y: 20, opacity: 0, duration: 0.6, delay: 0.3, ease: "power2.out" });
    
    // Solo si estamos en modo neón, aplicamos el fade adicional
    if (theme === 'dark') {
      gsap.from(".fade-in-up", { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
    }
  }, { scope: dashboardRef, dependencies: [theme] });

  // ===========================================================================
  // 1. RAMA MODO OSCURO: TU DISEÑO NEÓN (SLATE-950) INTACTO
  // ===========================================================================
  if (theme === 'dark') {
    return (
      <div ref={dashboardRef} className="flex h-screen bg-slate-950 font-sans overflow-hidden text-slate-200">
        
        {/* Sidebar fijo */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onViewMap={onViewMap} 
          onLogout={onLogout} 
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header del Dashboard */}
          <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-xl font-bold text-white capitalize tracking-tight fade-in-up">
              {activeTab === 'dashboard' ? 'Resumen General' : 'Gestión de Eventos'}
            </h2>
            <div className="flex items-center gap-4 fade-in-up">
              <ThemeToggle /> {/* Switch de tema siempre visible */}
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/20">
                  ADMIN_ACCESS
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-400">
                  AD
              </div>
            </div>
          </header>

          {/* Área de Contenido */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
            {activeTab === 'dashboard' && (
              <AnalyticsTab events={events} locations={locations} />
            )}

            {activeTab === 'events' && (
              <EventsTab 
                events={events} 
                locations={locations} 
                onAddEvent={onAddEvent} 
                onUpdateEvent={onUpdateEvent} 
                onDeleteEvent={onDeleteEvent} 
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  // ===========================================================================
  // 2. RAMA MODO CLARO: TU DISEÑO ORIGINAL (LITERAL)
  // ===========================================================================
  return (
    <div ref={dashboardRef} className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR (Con clase para animar) */}
      <div className="sidebar-anim h-full">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onViewMap={onViewMap} 
            onLogout={onLogout} 
          />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="header-anim h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {activeTab === 'dashboard' ? 'Resumen General' : 'Gestión de Eventos'}
          </h2>
          <div className="flex items-center gap-4">
            <ThemeToggle /> {/* Switch de tema siempre visible */}
            <span className="text-sm text-gray-500">Administrador</span>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold border-2 border-white shadow-sm">AD</div>
          </div>
        </header>

        <div className="content-anim flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
          {/* 2. CONTENIDO MODULAR */}
          {activeTab === 'dashboard' && (
            <AnalyticsTab events={events} locations={locations} />
          )}

          {activeTab === 'events' && (
            <EventsTab 
              events={events} 
              locations={locations} 
              onAddEvent={onAddEvent} 
              onUpdateEvent={onUpdateEvent} 
              onDeleteEvent={onDeleteEvent} 
            />
          )}
        </div>
      </main>
    </div>
  );
}