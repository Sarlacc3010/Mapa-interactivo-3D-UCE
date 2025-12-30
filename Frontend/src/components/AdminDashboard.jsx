import React, { useState } from "react";
import { Button, Input, Card, Badge } from "./ui/shim";
import { LogOut, Map, Plus, Trash2, Calendar, MapPin } from "lucide-react";

export function AdminDashboard({ onLogout, onViewMap, events, onAddEvent, onDeleteEvent }) {
  const [newEvent, setNewEvent] = useState({ title: "", location: "", date: "", time: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddEvent({ ...newEvent, id: Date.now().toString(), capacity: 100, registered: 0 });
    setNewEvent({ title: "", location: "", date: "", time: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header Admin */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D9232D] rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <div>
              <h1 className="text-[#1e3a8a] font-bold leading-tight">Panel Administrativo</h1>
              <p className="text-xs text-gray-500">Gestión de Eventos</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onViewMap}><Map className="w-4 h-4 mr-2" /> Ver Mapa</Button>
            <Button variant="ghost" onClick={onLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Crear Evento */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#D9232D]" /> Nuevo Evento
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Título</label>
                <Input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ej: Feria de Ciencias" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Ubicación</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-2 focus:ring-[#D9232D] outline-none"
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  required
                >
                  <option value="">Seleccionar Facultad...</option>
                  <option value="Facultad de Ingeniería">Facultad de Ingeniería</option>
                  <option value="Facultad de Jurisprudencia">Facultad de Jurisprudencia</option>
                  <option value="Biblioteca Central">Biblioteca Central</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Fecha</label>
                  <Input type="date" required value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Hora</label>
                  <Input type="time" required value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2">Publicar Evento</Button>
            </form>
          </Card>
        </div>

        {/* Columna Derecha: Lista de Eventos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-800 mb-2">Eventos Activos ({events.length})</h2>
          {events.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              No hay eventos registrados.
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#D9232D] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#1e3a8a]">{event.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">Activo</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date} • {event.time}</span>
                  </div>
                </div>
                <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDeleteEvent(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}