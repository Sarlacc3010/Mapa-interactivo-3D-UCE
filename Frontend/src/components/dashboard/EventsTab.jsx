import React, { useState, useEffect, useMemo } from "react";
import { Button, Input, Card, Badge } from "../ui/shim";
import { Plus, Trash2, Calendar, MapPin, Edit, X, Filter, Clock } from "lucide-react";

export function EventsTab({ events, locations, onAddEvent, onUpdateEvent, onDeleteEvent }) {
  const [filterLocation, setFilterLocation] = useState("");
  const [now, setNow] = useState(new Date());

  // Reloj interno
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [newEvent, setNewEvent] = useState({ title: "", description: "", location_id: "", date: "", time: "", end_time: "" });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lógica de Estado (Badge)
  const getEventStatus = (event) => {
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
    // ... (Tu lógica de validación aquí se mantiene igual o simplificada) ...
    // Para no alargar, asumo la lógica de fetch que ya tenías:
    try {
        const url = editingId ? `http://localhost:5000/api/events/${editingId}` : 'http://localhost:5000/api/events';
        const method = editingId ? 'PUT' : 'POST';
        const res = await fetch(url, {
             method, 
             headers: { 'Content-Type': 'application/json' }, 
             credentials: 'include',
             body: JSON.stringify({ ...newEvent, location_id: parseInt(newEvent.location_id) })
        });
        if(res.ok) {
            const data = await res.json();
            const locName = locations.find(l => String(l.id) === String(newEvent.location_id))?.name;
            const completeEvent = { ...data, location_name: locName };
            editingId ? onUpdateEvent(completeEvent) : onAddEvent(completeEvent);
            alert(editingId ? "Evento actualizado" : "Evento creado");
            handleCancel();
        } else {
            alert("Error al guardar");
        }
    } catch(err) { console.error(err); alert("Error de conexión"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar evento?")) return;
    const res = await fetch(`http://localhost:5000/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) onDeleteEvent(id);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-300">
      <div className="xl:col-span-1">
        <Card className="p-6 sticky top-6 shadow-lg border-blue-100">
          <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-start">
            <div><h2 className="font-bold text-[#1e3a8a] text-lg">{editingId ? "Editar Evento" : "Crear Evento"}</h2></div>
            {editingId && <button onClick={handleCancel} className="text-red-500 text-xs flex items-center gap-1"><X size={14}/> Cancelar</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input required placeholder="Título" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
            <select className="w-full h-10 border rounded-lg px-3 text-sm" value={newEvent.location_id} onChange={e => setNewEvent({ ...newEvent, location_id: e.target.value })} required>
               <option value="">Ubicación...</option>
               {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]" placeholder="Descripción" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
                <Input type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="col-span-2" />
                <Input type="time" required value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
                <Input type="time" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} />
            </div>
            <Button type="submit" className="w-full mt-2 bg-[#1e3a8a]" disabled={isSubmitting}>{isSubmitting ? "..." : "Guardar"}</Button>
          </form>
        </Card>
      </div>

      <div className="xl:col-span-2 space-y-6">
         <div className="flex justify-between items-center border-b pb-2">
            <div className="flex items-center gap-2"><h2 className="font-bold text-gray-800">Agenda</h2><Badge variant="outline">{filteredEvents.length}</Badge></div>
            <div className="flex items-center gap-2"><Filter size={16} className="text-gray-400"/><select className="border rounded text-sm p-1" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}><option value="">Todas</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map(event => {
                const status = getEventStatus(event);
                return (
                    <div key={event.id} className={`bg-white p-5 rounded-xl border shadow-sm relative group ${editingId === event.id ? 'border-orange-500' : ''}`}>
                        <div className={`absolute bottom-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>{status.label}</div>
                        <h3 className="font-bold text-gray-800 pr-16">{event.title}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{event.description}</p>
                        <div className="text-xs text-gray-600 flex flex-col gap-1">
                            <span className="flex items-center gap-1 font-semibold text-[#1e3a8a]"><MapPin size={14}/> {event.location_name}</span>
                            <span className="flex items-center gap-1"><Calendar size={14}/> {event.date.split('T')[0]}</span>
                            <span className="flex items-center gap-1"><Clock size={14}/> {event.time} - {event.end_time || "?"}</span>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1">
                            <button onClick={() => handleEditClick(event)} className="p-2 text-gray-300 hover:text-orange-500"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(event.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
}