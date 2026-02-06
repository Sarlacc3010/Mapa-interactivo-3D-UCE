import React, { useState, useRef } from "react";
import { useLocations } from "../hooks/useLocations";
import { Sidebar } from "./dashboard/Sidebar";
import { AnalyticsTab } from "./dashboard/AnalyticsTab";
import { EventsTab } from "./dashboard/EventsTab";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";
import { Download, FileText, BarChart3, Map as MapIcon, LogOut } from "lucide-react"; // Icons for Report
import api from "../api/client"; // Axios client for PDF request

// GSAP Animations
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('events');
  const { locations } = useLocations();
  const [downloading, setDownloading] = useState(false);

  // GSAP Ref
  const dashboardRef = useRef();

  useGSAP(() => {
    // Check if elements exist before animating (prevents warnings with lazy loading)
    const sidebar = document.querySelector(".sidebar-anim");
    const header = document.querySelector(".header-anim");
    const content = document.querySelector(".content-anim");

    if (sidebar) {
      gsap.from(".sidebar-anim", { x: -50, opacity: 0, duration: 0.6, ease: "power2.out" });
    }
    if (header) {
      gsap.from(".header-anim", { y: -20, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
    }
    if (content) {
      gsap.from(".content-anim", { y: 20, opacity: 0, duration: 0.6, delay: 0.3, ease: "power2.out" });
    }

    // Neon mode extra animations
    if (theme === 'dark') {
      const fadeElements = document.querySelectorAll(".fade-in-up");
      if (fadeElements.length > 0) {
        gsap.from(".fade-in-up", { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" });
      }
    }
  }, { scope: dashboardRef, dependencies: [theme] });

  // --- PDF REPORT HANDLER ---
  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/analytics/report/pdf', {
        responseType: 'blob', // IMPORTANT: Expect binary data
      });

      // Create blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_sistema_${new Date().toISOString().slice(0, 10)}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

    } catch (error) {
      console.error("Error downloading report", error);
      alert("No se pudo generar el reporte. Intenta más tarde.");
    } finally {
      setDownloading(false);
    }
  };

  // ===========================================================================
  // 1. DARK MODE (NEON LAYOUT)
  // ===========================================================================
  if (theme === 'dark') {
    return (
      <div ref={dashboardRef} className="flex h-screen bg-slate-950 font-sans overflow-hidden text-slate-200">

        {/* Fixed Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onViewMap={onViewMap}
          onLogout={onLogout}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Dashboard Header */}
          <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-xl font-bold text-white capitalize tracking-tight fade-in-up">
              {activeTab === 'dashboard' ? 'Resumen General' : 'Gestión de Eventos'}
            </h2>

            <div className="flex items-center gap-4 fade-in-up">
              {/* PDF REPORT BUTTON (NEON) */}
              {activeTab === 'dashboard' && (
                <button
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-900/50 transition-all text-xs font-medium disabled:opacity-50"
                >
                  {downloading ? (
                    <span className="animate-pulse">Generando...</span>
                  ) : (
                    <>
                      <Download size={14} /> Reporte PDF
                    </>
                  )}
                </button>
              )}

              <ThemeToggle />

              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/20">
                ADMIN_ACCESS
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-400">
                AD
              </div>
            </div>
          </header>

          {/* Content Area */}
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
  // 2. LIGHT MODE (ORIGINAL LAYOUT)
  // ===========================================================================
  return (
    <div ref={dashboardRef} className="flex h-screen bg-gray-50 font-sans overflow-hidden">

      {/* Sidebar */}
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

            {/* PDF REPORT BUTTON (LIGHT) */}
            {activeTab === 'dashboard' && (
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all text-xs font-bold disabled:opacity-50"
              >
                {downloading ? (
                  <span className="animate-pulse">Generando...</span>
                ) : (
                  <>
                    <FileText size={14} /> Exportar Reporte
                  </>
                )}
              </button>
            )}

            <ThemeToggle />
            <span className="text-sm text-gray-500">Administrador</span>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold border-2 border-white shadow-sm">AD</div>
          </div>
        </header>

        <div className="content-anim flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
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