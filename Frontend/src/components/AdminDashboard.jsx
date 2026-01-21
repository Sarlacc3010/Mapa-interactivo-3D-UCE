import React, { useState, useRef } from "react";
import { useLocations } from "../hooks/useLocations";
import { Sidebar } from "./dashboard/Sidebar";
import { AnalyticsTab } from "./dashboard/AnalyticsTab";
import { EventsTab } from "./dashboard/EventsTab";

// 🔥 GSAP
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const [activeTab, setActiveTab] = useState('events');
  const { locations } = useLocations();

  // Ref para animar la entrada del Dashboard
  const dashboardRef = useRef();

  useGSAP(() => {
    // Animar Sidebar (entra desde la izquierda)
    gsap.from(".sidebar-anim", { x: -50, opacity: 0, duration: 0.6, ease: "power2.out" });
    
    // Animar Header (cae desde arriba)
    gsap.from(".header-anim", { y: -20, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });

    // Animar Contenido Principal (entra desde abajo suavemente)
    gsap.from(".content-anim", { y: 20, opacity: 0, duration: 0.6, delay: 0.3, ease: "power2.out" });
  }, { scope: dashboardRef });

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