import React from "react";
import { LogOut, LayoutDashboard, Megaphone, Map } from "lucide-react";
import { UCELogoImage } from "../UCELogoImage";

export function Sidebar({ activeTab, setActiveTab, onViewMap, onLogout }) {
  return (
    <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col shadow-2xl z-20 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-blue-800">
        <UCELogoImage className="w-20 h-auto object-contain drop-shadow-md" />
        <div>
          <span className="text-lg font-bold tracking-wide block leading-none">Admin UCE</span>
          <span className="text-[10px] text-blue-200 uppercase tracking-wider">Panel de Control</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <SidebarItem icon={LayoutDashboard} label="Resumen" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon={Megaphone} label="Gestión Eventos" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
        <SidebarItem icon={Map} label="Ir al Mapa" onClick={onViewMap} />
      </nav>
      <div className="p-4 border-t border-blue-800">
        <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-blue-200 hover:text-white hover:bg-red-600/20 rounded-xl transition-all">
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${active ? "bg-white text-[#1e3a8a] shadow-lg" : "text-blue-200 hover:bg-blue-800 hover:text-white"}`}>
      <Icon size={20} className={active ? "text-[#D9232D]" : "group-hover:text-white"} />
      <span>{label}</span>
    </button>
  );
}