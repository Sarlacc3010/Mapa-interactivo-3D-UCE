import React, { useState, useEffect, useMemo } from "react";
import { Button, Input, Card, Badge } from "../ui/shim";
import { Plus, Trash2, Calendar, MapPin, Edit, X, Filter, Clock, Save, Sparkles } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function EventsTab({ events, locations, onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const { theme } = useTheme();
  const [filterLocation, setFilterLocation] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [newEvent, setNewEvent] = useState({ title: "", description: "", location_id: "", date: "", time: "", end_time: "" });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredEvents = useMemo(() => {
    if (!filterLocation) return events;
    return events.filter(e => String(e.location_id) === String(filterLocation));
  }, [events, filterLocation]);

  const handleEditClick = (event) => {
    setEditingId(event.id);
    setNewEvent({ ...event, location_id: String(event.location_id), date: event.date.split('T')[0], end_time: event.end_time || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewEvent({ title: "", description: "", location_id: "", date: "", time: "", end_time: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // VALIDATION: End Time > Start Time
    if (newEvent.end_time && newEvent.end_time <= newEvent.time) {
      alert("⚠️ La hora de fin debe ser posterior a la hora de inicio");
      setIsSubmitting(false);
      return;
    }

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const API_BASE = isLocal ? 'http://localhost:5000' : '';
      const url = editingId ? `${API_BASE}/api/events/${editingId}` : `${API_BASE}/api/events`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newEvent, location_id: parseInt(newEvent.location_id) })
      });
      if (res.ok) {
        const data = await res.json();
        const locName = locations.find(l => String(l.id) === String(newEvent.location_id))?.name;
        const completeEvent = { ...data, location_name: locName };
        editingId ? onUpdateEvent(completeEvent) : onAddEvent(completeEvent);
        handleCancel();
      } else {
        const errorData = await res.json();
        const message = errorData.error || 'Error al guardar el evento';
        setErrorMessage(message);
        alert(`❌ ${message}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión con el servidor');
      alert('❌ Error de conexión con el servidor');
    }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar evento?")) return;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = isLocal ? 'http://localhost:5000' : '';
    const res = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) onDeleteEvent(id);
  };

  // ===========================================================================
  // BRANCH 1: DARK MODE (NEON DESIGN INTACT)
  // ===========================================================================
  if (theme === 'dark') {
    const getEventStatusNeon = (event) => {
      if (!event.date || !event.time) return { label: "Sin fecha", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" };
      const start = new Date(`${event.date.split('T')[0]}T${event.time}`);
      const endStr = event.end_time || event.time;
      let end = new Date(`${event.date.split('T')[0]}T${endStr}`);
      if (event.time === endStr) end.setHours(end.getHours() + 1);
      if (now > end) return { label: "Finalizado", color: "text-slate-500 bg-white/5 border-white/5 grayscale opacity-70" };
      if (now >= start && now <= end) return { label: "En curso", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]" };
      const diffHours = (start - now) / 36e5;
      if (diffHours < 24 && diffHours > 0) return { label: "Próximamente", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
      return { label: "Programado", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
        <div className="xl:col-span-1">
          <div className="sticky top-6 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl ring-1 ring-black/50">
            <div className="mb-6 pb-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="font-bold text-white text-lg flex items-center gap-2"><Sparkles size={18} className="text-cyan-400" /> {editingId ? "Editar Evento" : "Crear Evento"}</h2>
              {editingId && <button onClick={handleCancel} className="text-red-400 text-xs flex items-center gap-1 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20"><X size={14} /> Cancelar</button>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Título del Evento</label>
                <input required maxLength={100} placeholder="Ej: Feria de Ciencias" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 placeholder:text-slate-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 appearance-none focus:outline-none focus:border-cyan-500/50 text-sm" value={newEvent.location_id} onChange={e => setNewEvent({ ...newEvent, location_id: e.target.value })} required>
                    <option value="" className="bg-slate-900">Seleccionar lugar...</option>
                    {locations.map(l => <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Detalles</label>
                <textarea maxLength={500} className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600 resize-none" placeholder="Descripción..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fecha</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inicio</label>
                  <input type="time" required value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fin</label>
                  <input type="time" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 ${isSubmitting ? "bg-slate-800 text-slate-500 cursor-wait" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"}`}>
                {isSubmitting ? "Procesando..." : <><Save size={18} /> {editingId ? "Actualizar" : "Guardar"}</>}
              </button>
            </form>
          </div>
        </div>
        <div className="xl:col-span-2 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3"><h2 className="font-bold text-white text-lg">Agenda UCE</h2><span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-mono text-slate-300 border border-white/5">{filteredEvents.length}</span></div>
            <div className="flex items-center gap-3"><Filter size={16} className="text-slate-400" /><select className="bg-slate-950 border border-white/10 rounded-lg text-sm p-2 text-slate-300 focus:outline-none" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}><option value="">Todas las ubicaciones</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map(event => {
              const status = getEventStatusNeon(event);
              return (
                <div key={event.id} className={`relative group p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${editingId === event.id ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-900/60 border-white/5 hover:border-cyan-500/30 hover:bg-slate-900/80 hover:shadow-lg'}`}>
                  <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full border ${status.color}`}>{status.label}</div>
                  <div><h3 className="font-bold text-slate-100 pr-20 text-lg mb-2 group-hover:text-cyan-400 transition-colors">{event.title}</h3><p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">{event.description}</p></div>
                  <div className="text-xs text-slate-500 space-y-2 border-t border-white/5 pt-3 mt-2">
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-cyan-500" /> <span className="text-slate-300">{event.location_name}</span></div>
                    <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> {event.date.split('T')[0]}</span><span className="flex items-center gap-1.5"><Clock size={14} className="text-pink-400" /> {event.time} - {event.end_time || "?"}</span></div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => handleEditClick(event)} className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-white/5"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white border border-white/5"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // BRANCH 2: LIGHT MODE (ORIGINAL DESIGN WITH DARK TEXT)
  // ===========================================================================
  const getEventStatusLight = (event) => {
    if (!event.date || !event.time) return { label: "Sin fecha", color: "bg-gray-100 text-gray-500" };
    const start = new Date(`${event.date.split('T')[0]}T${event.time}`);
    const endStr = event.end_time || event.time;
    let end = new Date(`${event.date.split('T')[0]}T${endStr}`);
    if (event.time === endStr) end.setHours(end.getHours() + 1);
    if (now > end) return { label: "Finalizado", color: "bg-gray-100 text-gray-500 border-gray-200" };
    if (now >= start && now <= end) return { label: "En este momento", color: "bg-green-100 text-green-700 border-green-200 animate-pulse" };
    const diffHours = (start - now) / 36e5;
    if (diffHours < 24 && diffHours > 0) return { label: "Próximamente", color: "bg-blue-100 text-blue-700 border-blue-200" };
    return { label: "Programado", color: "bg-blue-50 text-blue-600 border-blue-100" };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
      <div className="xl:col-span-1">
        <Card className="p-6 sticky top-6 shadow-lg border-blue-100 bg-white">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-start">
            <div><h2 className="font-bold text-[#1e3a8a] text-lg">{editingId ? "Editar Evento" : "Crear Evento"}</h2></div>
            {editingId && <button onClick={handleCancel} className="text-red-500 text-xs flex items-center gap-1"><X size={14} /> Cancelar</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Text color text-gray-900 added for readability */}
            <Input required maxLength={100} placeholder="Título" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="text-gray-900" />
            <select className="w-full h-10 border rounded-lg px-3 text-sm text-gray-900 bg-white border-gray-200" value={newEvent.location_id} onChange={e => setNewEvent({ ...newEvent, location_id: e.target.value })} required>
              <option value="">Ubicación...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <textarea maxLength={500} className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] text-gray-900 bg-white border-gray-200" placeholder="Descripción" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" min={new Date().toISOString().split('T')[0]} required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="col-span-2 text-gray-900" />
              <Input type="time" required value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="text-gray-900" />
              <Input type="time" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} className="text-gray-900" />
            </div>
            <Button type="submit" className="w-full mt-2 bg-[#1e3a8a] hover:bg-[#152c6e]" disabled={isSubmitting}>{isSubmitting ? "..." : "Guardar"}</Button>
          </form>
        </Card>
      </div>

      <div className="xl:col-span-2 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2"><h2 className="font-bold text-gray-800">Agenda</h2><Badge variant="outline" className="text-gray-600 border-gray-200">{filteredEvents.length}</Badge></div>
          <div className="flex items-center gap-2"><Filter size={16} className="text-gray-400" /><select className="border border-gray-200 rounded text-sm p-1 text-gray-700 bg-white" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}><option value="">Todas</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map(event => {
            const status = getEventStatusLight(event);
            return (
              <div key={event.id} className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group ${editingId === event.id ? 'border-[#1e3a8a] ring-1 ring-[#1e3a8a]' : ''}`}>
                <div className={`absolute bottom-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</div>
                <h3 className="font-bold text-gray-800 pr-16">{event.title}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{event.description}</p>
                <div className="text-xs text-gray-600 flex flex-col gap-1">
                  <span className="flex items-center gap-1 font-semibold text-[#1e3a8a]"><MapPin size={14} /> {event.location_name}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {event.date.split('T')[0]}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {event.time} - {event.end_time || "?"}</span>
                </div>
                <div className="absolute top-4 right-4 flex gap-1">
                  <button onClick={() => handleEditClick(event)} className="p-2 text-gray-400 hover:text-[#1e3a8a]"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}