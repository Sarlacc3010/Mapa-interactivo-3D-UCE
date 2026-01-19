import React, { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

const COLORS = ['#1e3a8a', '#D9232D', '#10B981', '#F59E0B', '#8b5cf6', '#ec4899'];

// 🔥 CONFIGURACIÓN DE AJUSTE HORARIO
// 1. Pon esto en 0 primero. Guarda y mira la gráfica.
// 2. Si la gráfica sale adelantada 5 horas, ponlo en -5.
// 3. Si sale atrasada, ponlo en +5.
const HOURS_OFFSET = 0; 

export function AnalyticsTab({ events, locations }) {
  const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/analytics/peak-hours', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        
        // 🕵️ DEBUGGING: Mira esto en la consola del navegador (F12)
        console.log("--- DATOS CRUDOS DEL SERVIDOR ---");
        console.log(data); 
        // Fíjate qué propiedad tiene la hora: ¿es 'hour', 'name', 'hora'?
        // Y qué valor trae (ej: si son las 10am en tu reloj, ¿dice 10 o 15?)

        // 1. Crear buckets vacíos para las 24 horas (0-23)
        const buckets = Array.from({ length: 24 }, (_, i) => ({
          hourIndex: i,
          label: `${i}:00`,
          visitas: 0
        }));

        // 2. Llenar buckets
        data.forEach(item => {
          // Intentamos leer la hora de varias formas posibles que suelen usar las APIs
          let rawHour = item.hour ?? item.hora ?? item.h ?? item.name;
          
          // Convertimos a entero
          let serverHour = parseInt(rawHour);

          if (!isNaN(serverHour)) {
            // 🔥 FÓRMULA MAESTRA DE AJUSTE
            // El +24 es para evitar números negativos si el offset resta mucho
            const localHour = (serverHour + HOURS_OFFSET + 24) % 24;

            // Acumulamos las visitas
            buckets[localHour].visitas += (item.visitas || item.count || item.total || 0);
          }
        });

        setTrafficData(buckets);
      })
      .catch(err => console.error("Error cargando analytics:", err));
  }, [events]);

  // --- CÁLCULOS ESTADÍSTICOS (Memoizados) ---
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
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" /> Actividad Diaria
            </h3>
            {/* Pequeña leyenda de debug para que sepas qué offset estás usando */}
            <span className="text-xs text-gray-400 font-mono">Offset: {HOURS_OFFSET}h</span>
        </div>
        
        <div className="flex-1 w-full h-full min-h-[200px]">
          {trafficData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                
                <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    interval={3} 
                />
                
                <YAxis 
                    tick={{ fontSize: 11, fill: '#6b7280' }} 
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                />
                
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                    formatter={(value) => [`${value} visitas`, "Tráfico"]}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                />
                
                <Area 
                    type="monotone" 
                    dataKey="visitas" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisitas)" 
                    animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <span>Cargando datos...</span>
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICOS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Lugares */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0"><TrendingUp size={18} className="text-blue-600" /> Lugares Más Visitados</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={statsTopLugares} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="visitas" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Distribución */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex flex-col">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0"><MapPin size={18} className="text-green-600" /> Distribución</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-[1.02]">
      <div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p><h3 className="text-3xl font-bold text-gray-800">{value}</h3></div>
      <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center text-white`}><div className={`w-full h-full rounded-full ${color} flex items-center justify-center shadow-md`}><Icon size={20} className="text-white" /></div></div>
    </div>
  );
}