import React, { useMemo, useRef } from "react";
import { TrendingUp, Users, Calendar, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

// 🔥 GSAP
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Hook Inteligente
import { useAnalytics } from "../../hooks/useAnalytics";

const COLORS = ['#1e3a8a', '#D9232D', '#10B981', '#F59E0B', '#8b5cf6', '#ec4899'];
const TIMEZONE_OFFSET = -5; 

export function AnalyticsTab({ locations }) {
  const { summary, topLocations, peakHours, loading } = useAnalytics();
  
  // 🔥 REFERENCIA PARA ANIMAR TODO EL CONTENEDOR
  const containerRef = useRef();

  // 🔥 ANIMACIÓN DE ENTRADA CON GSAP
  useGSAP(() => {
    // Seleccionamos todos los elementos con la clase 'animate-item' y los animamos en cascada
    gsap.fromTo(".animate-item", 
      { y: 50, opacity: 0 }, // Estado inicial (abajo e invisibles)
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.1, // Retraso de 0.1s entre cada elemento
        ease: "back.out(1.2)" // Efecto de rebote ligero al llegar
      }
    );
  }, { scope: containerRef, dependencies: [loading] }); // Se ejecuta cuando termina de cargar

  // PROCESAR HORAS PICO
  const trafficData = useMemo(() => {
    if (!peakHours.length) return [];
    const buckets = Array.from({ length: 24 }, (_, i) => ({
      label: `${i}:00`,
      visitas: 0
    }));
    peakHours.forEach(item => {
      let serverHour = parseInt(item.hour || item.name);
      if (!isNaN(serverHour)) {
        const localHour = (serverHour + TIMEZONE_OFFSET + 24) % 24;
        buckets[localHour].visitas += parseInt(item.visitas || item.count || 0);
      }
    });
    return buckets;
  }, [peakHours]);

  // PROCESAR TOP LUGARES
  const formattedTopLocations = useMemo(() => {
    return topLocations.map(item => ({
      ...item,
      name: item.name.replace('Facultad de ', '').replace('Facultad ', '').substring(0, 15)
    }));
  }, [topLocations]);

  // PROCESAR CATEGORÍAS
  const statsCategorias = useMemo(() => {
    if (!locations.length) return [];
    const counts = {};
    locations.forEach(loc => {
      let cat = loc.category?.includes('Facultad') ? 'Facultades' : (loc.category || 'Otro');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, value: counts[key] }))
      .sort((a, b) => b.value - a.value);
  }, [locations]);

  // RENDERIZADO DE CARGA
  if (loading) {
    return (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">Sincronizando datos en tiempo real...</p>
        </div>
    );
  }

  return (
    // Asignamos la ref al contenedor principal
    <div ref={containerRef} className="space-y-6 pb-8">
      
      {/* TARJETAS KPI (Agregamos clase 'animate-item') */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="animate-item">
            <StatCard title="Visitas Totales" value={summary.totalVisits} icon={TrendingUp} color="bg-green-500" />
        </div>
        <div className="animate-item">
            <StatCard title="Usuarios Registrados" value={summary.totalUsers} icon={Users} color="bg-blue-500" />
        </div>
        <div className="animate-item">
            <StatCard title="Eventos en Sistema" value={summary.totalEvents} icon={Calendar} color="bg-purple-500" />
        </div>
      </div>

      {/* GRÁFICO DE TENDENCIA */}
      <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 h-80 flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-600" /> Actividad Diaria
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
              Hora Local (UTC{TIMEZONE_OFFSET})
            </span>
        </div>
        <div className="flex-1 w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                    formatter={(value) => [`${value} visitas`, "Tráfico"]}
                />
                <Area type="monotone" dataKey="visitas" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICOS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Lugares */}
        <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
            <MapPin size={18} className="text-blue-600" /> Lugares Más Visitados
          </h3>
          <div className="flex-1 w-full min-h-0">
            {formattedTopLocations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedTopLocations} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="visits" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={24} name="Visitas" />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Sin datos aún</div>
            )}
          </div>
        </div>
        
        {/* Distribución */}
        <div className="animate-item bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
             <TrendingUp size={18} className="text-green-600" /> Distribución de Infraestructura
           </h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={statsCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                   {statsCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02] cursor-default">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center text-white`}>
        <div className={`w-full h-full rounded-full ${color} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}