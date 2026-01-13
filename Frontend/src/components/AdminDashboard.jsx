import React, { useState } from "react";
import { Button, Input, Card, Badge } from "./ui/shim";
import { 
  LogOut, Map, Plus, Trash2, Calendar, MapPin, Edit, X,
  LayoutDashboard, Megaphone, TrendingUp 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

import { useLocations } from "../hooks/useLocations"; 
import { UCELogoImage } from "./UCELogoImage"; // <--- IMPORTAMOS EL LOGO

// Datos estáticos
const DATA_VISITAS = [
  { name: 'Fac. Artes', visitas: 420 },
  { name: 'Biblio. Central', visitas: 350 },
  { name: 'Ingeniería', visitas: 280 },
  { name: 'Odontología', visitas: 190 },
];
const DATA_CATEGORIAS = [
  { name: 'Académico', value: 12 },
  { name: 'Admin', value: 4 },
  { name: 'Servicios', value: 3 },
  { name: 'Deportes', value: 2 },
];
const COLORS = ['#1e3a8a', '#D9232D', '#10B981', '#F59E0B'];

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent, onUpdateEvent }) {
  const [activeTab, setActiveTab] = useState('events');
  const { locations, loading: loadingLocs } = useLocations(); 

  const [newEvent, setNewEvent] = useState({ 
    title: "", description: "", location_id: "", date: "", time: "" 
  });
  
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // --- PREPARAR EDICIÓN ---
  const handleEditClick = (event) => {
    setEditingId(event.id);
    setNewEvent({
        title: event.title || "",
        description: event.description || "",
        location_id: event.location_id ? String(event.location_id) : "", 
        date: event.date ? event.date.split('T')[0] : "",
        time: event.time || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewEvent({ title: "", description: "", location_id: "", date: "", time: "" });
  };

  // --- ENVIAR FORMULARIO (CREAR O EDITAR) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if(!newEvent.location_id) {
          alert("Por favor selecciona una ubicación válida");
          setIsSubmitting(false);
          return;
      }

      const url = editingId 
        ? `http://localhost:5000/api/events/${editingId}`
        : 'http://localhost:5000/api/events';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Cookies HttpOnly
        body: JSON.stringify({
            title: newEvent.title,
            description: newEvent.description,
            date: newEvent.date,
            time: newEvent.time,
            location_id: parseInt(newEvent.location_id)
        })
      });

      if (response.ok) {
        const eventData = await response.json();
        const locationName = locations.find(l => l.id == newEvent.location_id)?.name || "Ubicación";
        const eventoCompleto = { ...eventData, location_name: locationName };

        if (editingId) {
            if(onUpdateEvent) onUpdateEvent(eventoCompleto);
            alert("✅ Evento actualizado correctamente");
        } else {
            onAddEvent(eventoCompleto); 
            alert("✅ Evento creado correctamente");
        }
        
        handleCancelEdit(); 
      } else {
        const err = await response.json();
        alert("Error: " + (err.error || "No se pudo procesar"));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ELIMINAR ---
  const handleDelete = async (id) => {
      if(!confirm("¿Estás seguro de eliminar?")) return;

      try {
          const res = await fetch(`http://localhost:5000/api/events/${id}`, {
              method: 'DELETE',
              credentials: 'include'
          });
          if(res.ok) onDeleteEvent(id);
          else alert("Error al eliminar");
      } catch(e) { console.error(e); }
  };

  const formatDate = (isoString) => {
      if (!isoString) return "";
      return isoString.split('T')[0];
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col shadow-2xl z-20 shrink-0">
        
        {/* LOGO EN LA CABECERA DEL SIDEBAR */}
        <div className="p-6 flex items-center gap-3 border-b border-blue-800">
           {/* Logo directo con brillo suave para resaltar sobre el azul */}
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

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
           <h2 className="text-xl font-bold text-gray-800 capitalize">
             {activeTab === 'dashboard' ? 'Resumen' : 'Gestión de Eventos'}
           </h2>
           <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Administrador</span>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold border-2 border-white shadow-sm">AD</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
            {activeTab === 'dashboard' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard title="Eventos Activos" value={events.length} icon={Calendar} color="bg-blue-500" />
                      <StatCard title="Ubicaciones" value={locations.length} icon={MapPin} color="bg-red-500" />
                      <StatCard title="Visitas" value="1,392" icon={TrendingUp} color="bg-green-500" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                      <h3 className="font-bold text-gray-800 mb-4">Top Lugares</h3>
                      <ResponsiveContainer width="100%" height="90%">
                          <BarChart data={DATA_VISITAS} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="visitas" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                      <h3 className="font-bold text-gray-800 mb-4">Categorías</h3>
                      <ResponsiveContainer width="100%" height="90%">
                          <PieChart>
                            <Pie data={DATA_CATEGORIAS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {DATA_CATEGORIAS.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'events' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
                  <div className="xl:col-span-1">
                    <Card className="p-6 sticky top-6 shadow-lg border-blue-100 transition-all duration-300">
                      <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-start">
                         <div>
                            <h2 className="font-bold text-[#1e3a8a] text-lg flex items-center gap-2">
                                {editingId ? <Edit className="w-5 h-5 text-orange-500" /> : <Plus className="w-5 h-5" />} 
                                {editingId ? "Editar Evento" : "Crear Evento"}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                {editingId ? "Modifica los detalles abajo." : "Completa los datos para publicar."}
                            </p>
                         </div>
                         {editingId && (
                             <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                                 <X size={14} /> Cancelar
                             </button>
                         )}
                      </div>
                      
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                          <Input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="bg-gray-50" />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label>
                          <select 
                            className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                            value={newEvent.location_id} 
                            onChange={e => setNewEvent({...newEvent, location_id: e.target.value})} 
                            required 
                            disabled={loadingLocs}
                          >
                              <option value="">Seleccionar Facultad...</option>
                              {locations.map((loc) => (
                                <option key={loc.id || loc._id} value={loc.id || loc._id}>
                                    {loc.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                          <textarea className="flex w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none min-h-[80px]"
                            value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                          <Input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                        </div>
                        
                        <Button 
                            type="submit" 
                            className={`w-full mt-4 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-[#1e3a8a]"}`} 
                            disabled={isSubmitting}
                        >
                          {isSubmitting 
                             ? "Procesando..." 
                             : (editingId ? "Actualizar Evento" : "Publicar Evento")
                          }
                        </Button>
                      </form>
                    </Card>
                  </div>

                  <div className="xl:col-span-2 space-y-6">
                    <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                        <h2 className="font-bold text-gray-800 text-lg">Agenda</h2>
                        <Badge variant="outline" className="text-[#1e3a8a]">Total: {events.length}</Badge>
                    </div>
                    {events.length === 0 ? (
                      <div className="text-center p-12 text-gray-400">No hay eventos.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.map(event => (
                          <div 
                             key={event.id || event._id} 
                             className={`bg-white p-5 rounded-xl border shadow-sm relative group transition-colors ${editingId === event.id ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-100 hover:border-[#D9232D]'}`}
                          >
                            <h3 className="font-bold text-gray-800 pr-16">{event.title}</h3>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{event.description}</p>
                            <div className="text-xs text-gray-600 flex flex-col gap-1">
                               <span className="flex items-center gap-1 font-semibold text-[#1e3a8a]">
                                  <MapPin className="w-3.5 h-3.5" /> 
                                  {event.location_name || "⚠️ Sin Ubicación"}
                               </span>
                               <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> {formatDate(event.date)} • {event.time || "--:--"}
                               </span>
                            </div>

                            <div className="absolute top-4 right-4 flex gap-1">
                                <button 
                                    onClick={() => handleEditClick(event)} 
                                    className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                   <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(event.id)} 
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
            )}
        </div>
      </main>
    </div>
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

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
       <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
       </div>
       <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center text-white`}>
          <div className={`w-full h-full rounded-full ${color} flex items-center justify-center shadow-md`}><Icon size={20} className="text-white" /></div>
       </div>
    </div>
  );
}