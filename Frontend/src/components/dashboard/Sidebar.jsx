import React from 'react';
import { LayoutDashboard, Calendar, Map, LogOut, Megaphone } from "lucide-react";
import { UCELogoImage } from "../UCELogoImage"; 
import { useTheme } from "../../context/ThemeContext";

export function Sidebar({ activeTab, setActiveTab, onViewMap, onLogout }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <aside className={`w-64 h-full flex flex-col shrink-0 transition-all duration-300 border-r ${isDark ? 'bg-slate-900 border-white/10' : 'bg-[#1e3a8a] text-white shadow-2xl'}`}>
      
      {/* Header del Sidebar (Tamaño fijo h-24 y padding p-6) */}
      <div className={`p-6 flex items-center gap-3 border-b h-24 shrink-0 ${isDark ? 'border-white/5' : 'border-blue-800'}`}>
        <UCELogoImage className={`w-16 h-auto object-contain transition-all ${isDark ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'drop-shadow-md'}`} />
        <div className="min-w-0">
          <span className="text-lg font-bold tracking-wide block leading-none truncate">Admin UCE</span>
          <span className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-cyan-400' : 'text-blue-200'}`}>
            {isDark ? 'Panel de Control' : 'Panel de Control'}
          </span>
        </div>
      </div>

      {/* Navegación (Mismo espaciado) */}
      <nav className="flex-1 p-4 space-y-2">
        <NavItem 
          icon={LayoutDashboard} 
          label="Resumen" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          isDark={isDark}
        />
        <NavItem 
          icon={isDark ? Calendar : Megaphone} 
          label={isDark ? "Gestión Eventos" : "Gestión Eventos"} 
          active={activeTab === 'events'} 
          onClick={() => setActiveTab('events')} 
          isDark={isDark}
        />
        <NavItem 
          icon={Map} 
          label="Ir al Mapa" 
          onClick={onViewMap} 
          isDark={isDark}
        />
      </nav>

      {/* Footer (Mismo padding p-4) */}
      <div className={`p-4 border-t shrink-0 ${isDark ? 'border-white/5' : 'border-blue-800'}`}>
        <button 
          onClick={onLogout} 
          className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-red-400 hover:bg-red-950/30' : 'text-blue-200 hover:text-white hover:bg-red-600/20'}`}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active, onClick, isDark }) {
  const activeClass = isDark 
    ? "bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
    : "bg-white text-[#1e3a8a] shadow-lg";
    
  const inactiveClass = isDark
    ? "text-slate-400 hover:bg-white/5 hover:text-white"
    : "text-blue-200 hover:bg-blue-800 hover:text-white";

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group relative overflow-hidden ${active ? activeClass : inactiveClass}`}>
      {active && isDark && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>}
      <Icon size={20} className={active && !isDark ? "text-[#D9232D]" : ""} />
      <span>{label}</span>
    </button>
  );
}