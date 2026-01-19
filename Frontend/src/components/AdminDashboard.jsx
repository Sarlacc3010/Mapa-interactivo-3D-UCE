import React, { useState } from "react";
import { useLocations } from "../hooks/useLocations";
import { Sidebar } from "./Dashboard/Sidebar";
import { AnalyticsTab } from "./dashboard/AnalyticsTab";
import { EventsTab } from "./dashboard/EventsTab";

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const [activeTab, setActiveTab] = useState('events');
  const { locations } = useLocations();

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* 1. SIDEBAR SEPARADO */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onViewMap={onViewMap} 
        onLogout={onLogout} 
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {activeTab === 'dashboard' ? 'Resumen General' : 'Gestión de Eventos'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Administrador</span>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold border-2 border-white shadow-sm">AD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
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