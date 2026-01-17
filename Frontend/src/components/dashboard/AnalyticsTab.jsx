import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

const COLORS = ['#1e3a8a', '#D9232D', '#10B981', '#F59E0B', '#8b5cf6', '#ec4899'];

export function AnalyticsTab({ events, locations }) {
  const [trafficData, setTrafficData] = useState([]);

  // Cargar datos de tráfico
  useEffect(() => {
    fetch('http://localhost:5000/api/analytics/peak-hours', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTrafficData(data))
      .catch(err => console.error("Error cargando analytics:", err));
  }, [events]);

  // Cálculos Memoizados
  const statsTopLugares = useMemo(() => {
    if (!locations.length) return [];
    return [...locations]
      .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
      .slice(0, 5)
      .map(loc => ({
        name: loc.name.replace('Facultad de ', '').replace('Facultad ', '').substring(0, 12),
        visitas: loc.visit_count || 0
      }));
  }, [locations]);

  const totalVisitas = useMemo(() => locations.reduce((acc, loc) => acc + (loc.visit_count || 0), 0), [locations]);

  const statsCategorias = useMemo(() => {
    const counts = {};
    locations.forEach(loc => {
      let cat = loc.category?.includes('Facultad') ? 'Facultades' : (loc.category || 'Otro');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [locations]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Eventos Activos" value={events.length} icon={Calendar} color="bg-blue-500" />
        <StatCard title="Infraestructura" value={locations.length} icon={MapPin} color="bg-red-500" />
        <StatCard title="Total Interacciones" value={totalVisitas} icon={TrendingUp} color="bg-green-500" />
      </div>

      {/* GRÁFICO DE TENDENCIA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 h-80 flex flex-col">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-600" /> Actividad en Tiempo Real (Hoy)
        </h3>
        <div className="flex-1 w-full h-full min-h-[200px]">
          {trafficData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={2} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <Area type="monotone" dataKey="visitas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVisitas)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-gray-400 text-sm">Cargando datos...</div>}
        </div>
      </div>

      {/* GRÁFICOS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0"><TrendingUp size={18} className="text-blue-600" /> Lugares Más Visitados</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={statsTopLugares} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="visitas" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0"><MapPin size={18} className="text-green-600" /> Distribución</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
               <PieChart>
                 <Pie data={statsCategorias} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                   {statsCategorias.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-3xl font-bold text-gray-800">{value}</h3></div>
      <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center text-white`}><div className={`w-full h-full rounded-full ${color} flex items-center justify-center shadow-md`}><Icon size={20} className="text-white" /></div></div>
    </div>
  );
}