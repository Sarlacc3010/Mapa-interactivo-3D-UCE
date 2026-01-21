import React, { useMemo, useRef } from "react";
import { TrendingUp, Users, Calendar, MapPin, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAnalytics } from "../../hooks/useAnalytics";
import { useTheme } from "../../context/ThemeContext";

const TIMEZONE_OFFSET = -5; 

export function AnalyticsTab({ locations }) {
  const { theme } = useTheme();
  const { summary, topLocations, peakHours, loading } = useAnalytics();
  const containerRef = useRef();

  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(".animate-item", 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, { scope: containerRef, dependencies: [loading] }); 

  // Lógica de datos original intacta
  const trafficData = useMemo(() => {
    if (!peakHours.length) return [];
    const buckets = Array.from({ length: 24 }, (_, i) => ({ label: `${i}:00`, visitas: 0 }));
    peakHours.forEach(item => {
      let serverHour = parseInt(item.hour || item.name);
      if (!isNaN(serverHour)) {
        const localHour = (serverHour + TIMEZONE_OFFSET + 24) % 24;
        buckets[localHour].visitas += parseInt(item.visitas || item.count || 0);
      }
    });
    return buckets;
  }, [peakHours]);

  const formattedTopLocations = useMemo(() => {
    return topLocations.map(item => ({
      ...item,
      name: (item.name || "").replace('Facultad de ', '').replace('Facultad ', '').substring(0, 15)
    }));
  }, [topLocations]);

  const statsCategorias = useMemo(() => {
    if (!locations.length) return [];
    const counts = {};
    locations.forEach(loc => {
      let cat = loc.category?.includes('Facultad') ? 'Facultades' : (loc.category || 'Otro');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [locations]);

  if (loading) {
    return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${theme === 'dark' ? 'border-cyan-500/30 border-t-cyan-400' : 'border-blue-500 border-t-transparent'}`}></div>
            <p className={`text-sm font-mono animate-pulse ${theme === 'dark' ? 'text-cyan-400' : 'text-gray-500'}`}>CARGANDO...</p>
        </div>
    );
  }

  // ===========================================================================
  // 1. RAMA MODO OSCURO: DISEÑO NEÓN INTACTO
  // ===========================================================================
  if (theme === 'dark') {
    const NEON_COLORS = ['#22d3ee', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#38bdf8'];
    return (
      <div ref={containerRef} className="space-y-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-item"><StatCardNeon title="Visitas Totales" value={summary.totalVisits} icon={Activity} color="text-emerald-400" bgGlow="bg-emerald-500/10" border="border-emerald-500/30" shadow="shadow-[0_0_15px_rgba(16,185,129,0.15)]" /></div>
          <div className="animate-item"><StatCardNeon title="Usuarios Registrados" value={summary.totalUsers} icon={Users} color="text-cyan-400" bgGlow="bg-cyan-500/10" border="border-cyan-500/30" shadow="shadow-[0_0_15px_rgba(6,182,212,0.15)]" /></div>
          <div className="animate-item"><StatCardNeon title="Eventos Activos" value={summary.totalEvents} icon={Calendar} color="text-purple-400" bgGlow="bg-purple-500/10" border="border-purple-500/30" shadow="shadow-[0_0_15px_rgba(168,85,247,0.15)]" /></div>
        </div>
        <div className="animate-item bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl h-80 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 z-10 text-slate-100">
              <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-cyan-400" /> Tráfico en Tiempo Real</h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-white/5">UTC{TIMEZONE_OFFSET}</span>
          </div>
          <div className="flex-1 w-full h-full min-h-[200px] z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{ color: '#22d3ee' }} />
                  <Area type="monotone" dataKey="visitas" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" />
                </AreaChart>
              </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-item bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl h-96 flex flex-col text-slate-100">
            <h3 className="font-bold mb-6 flex items-center gap-2"><MapPin size={18} className="text-pink-400" /> Edficios Más Visitados</h3>
            <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={formattedTopLocations} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/><Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: '#fff' }} /><Bar dataKey="visits" fill="#f472b6" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="animate-item bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl h-96 flex flex-col text-slate-100">
             <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-purple-400" /> Distribución</h3>
             <div className="flex-1 w-full min-h-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statsCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{statsCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', color: '#fff' }} /><Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 2. RAMA MODO CLARO: DISEÑO INSTITUCIONAL (CON COLORES CORREGIDOS)
  // ===========================================================================
  const LIGHT_COLORS = ['#1e3a8a', '#D9232D', '#10B981', '#F59E0B', '#8b5cf6', '#ec4899'];
  return (
    <div ref={containerRef} className="space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-item"><StatCardLight title="Visitas Totales" value={summary.totalVisits} icon={TrendingUp} color="bg-green-500" /></div>
        <div className="animate-item"><StatCardLight title="Usuarios Registrados" value={summary.totalUsers} icon={Users} color="bg-blue-500" /></div>
        <div className="animate-item"><StatCardLight title="Eventos en Sistema" value={summary.totalEvents} icon={Calendar} color="bg-purple-500" /></div>
      </div>

      <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
        <div className="flex justify-between items-center mb-2 text-gray-800">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-purple-600" /> Actividad Diaria</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">Hora Local (UTC{TIMEZONE_OFFSET})</span>
        </div>
        <div className="flex-1 w-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="colorVisLight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
              {/* Tooltip con colores forzados para Modo Claro */}
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                labelStyle={{ color: '#111827', fontWeight: 'bold' }} 
                itemStyle={{ color: '#1e3a8a' }} 
                formatter={(value) => [`${value} visitas`, "Tráfico"]} 
              />
              <Area type="monotone" dataKey="visitas" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisLight)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col text-gray-800">
          <h3 className="font-bold mb-4 flex items-center gap-2 shrink-0"><MapPin size={18} className="text-blue-600" /> Lugares Más Visitados</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedTopLocations} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false}/>
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }} 
                    itemStyle={{ color: '#D9232D' }} 
                  />
                  <Bar dataKey="visits" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={24} name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col text-gray-800">
          <h3 className="font-bold mb-4 flex items-center gap-2 shrink-0"><TrendingUp size={18} className="text-green-600" /> Distribución de Infraestructura</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statsCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                  {statsCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={LIGHT_COLORS[index % LIGHT_COLORS.length]} />))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }} 
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#4b5563' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Auxiliares Neón y Institucionales
function StatCardNeon({ title, value, icon: Icon, color, bgGlow, border, shadow }) {
  return (
    <div className={`group relative bg-slate-900/80 p-6 rounded-2xl border ${border} ${shadow} flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900`}>
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${bgGlow}`}></div>
      <div className="relative z-10"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-3xl font-bold text-slate-100 group-hover:text-white transition-colors">{value}</h3></div>
      <div className={`relative z-10 w-12 h-12 rounded-xl ${bgGlow} flex items-center justify-center`}><Icon size={24} className={`${color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} /></div>
    </div>
  );
}

function StatCardLight({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02] cursor-default text-gray-900">
      <div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-3xl font-bold text-gray-800">{value}</h3></div>
      <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center text-white`}><div className={`w-full h-full rounded-full ${color} flex items-center justify-center shadow-md`}><Icon size={20} className="text-white" /></div></div>
    </div>
  );
}