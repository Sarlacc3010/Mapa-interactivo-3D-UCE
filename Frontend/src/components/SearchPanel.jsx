import React, { useState, useEffect } from "react";
import { Search, X, MapPin, Building2, BookOpen, Car, Theater, Briefcase } from "lucide-react";
import { Input, Badge, ScrollArea } from "./ui/shim";

const categoryIcons = {
  'Facultades': Building2,
  'Facultad': Building2,
  'Académico': Building2,
  'Biblioteca': BookOpen,
  'Administrativo': Briefcase,
  'Teatro': Theater,
  'Otro': MapPin
};

const FILTER_CATEGORIES = ["Todos", "Facultades", "Biblioteca", "Administrativo"];

export function SearchPanel({ locations = [], onLocationSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const checkIsOpen = (schedule) => {
    if (!schedule) return false;
    const day = currentTime.getDay();
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isWeekDay = day >= 1 && day <= 5;

    if (!isWeekDay) return false;

    const timePattern = /(\d{1,2}):(\d{2})/g;
    const times = schedule.match(timePattern);

    if (times && times.length >= 2) {
        const [startH, startM] = times[0].split(':').map(Number);
        const [endH, endM] = times[1].split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        return minutes >= startTotal && minutes < endTotal;
    }
    return false;
  };

  const filtered = locations.filter(loc => {
    const name = loc.name || "";
    const category = loc.category || "Otro"; 
    const matchText = name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchCat = false;
    if (selectedCategory === "Todos") matchCat = true;
    else if (selectedCategory === "Facultades") matchCat = category === "Facultades" || category === "Facultad" || category === "Académico";
    else matchCat = category === selectedCategory;
    
    return matchText && matchCat;
  });

  // --- MODO COLAPSADO (BOTÓN SUTIL) ---
  if (!isExpanded) {
      return (
        <button 
            onClick={() => setIsExpanded(true)}
            // CAMBIO AQUÍ: Estilo 'Glass' sutil en lugar de botón blanco sólido
            className="absolute top-28 left-6 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group
                       bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg
                       hover:bg-white/20 hover:scale-105 active:scale-95 hover:border-white/30"
            title="Buscar ubicación"
        >
            <Search className="w-5 h-5 opacity-90 group-hover:opacity-100" />
        </button>
      );
  }

  // --- MODO EXPANDIDO (PANEL) ---
  return (
    <div className="absolute top-24 left-6 z-20 w-96 max-h-[75vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-10 duration-300 border border-white/40 ring-1 ring-black/5">
      
      {/* Cabecera */}
      <div className="p-5 border-b border-gray-100/50 shrink-0 bg-white/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[#1e3a8a] font-bold text-xl tracking-tight">Explorar UCE</h2>
            <p className="text-xs text-gray-500 mt-0.5">Encuentra facultades y servicios</p>
          </div>
          <button 
            onClick={() => { setIsExpanded(false); setSearchQuery(""); }} 
            className="p-2 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-red-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
          <Input 
            autoFocus
            placeholder="Buscar facultad..." 
            className="pl-10 h-10 bg-white/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-5 py-3 border-b border-gray-100/50 flex gap-2 overflow-x-auto shrink-0 bg-gray-50/50 no-scrollbar">
        {FILTER_CATEGORIES.map(cat => (
          <Badge 
            key={cat} 
            variant={selectedCategory === cat ? "default" : "outline"}
            className={`cursor-pointer whitespace-nowrap px-4 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat 
                ? "bg-[#1e3a8a] hover:bg-[#152c6e] text-white border-transparent shadow-sm" 
                : "bg-white/80 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-white"
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1 bg-white/30">
        <div className="p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
              <div className="w-16 h-16 bg-gray-100/50 rounded-full flex items-center justify-center">
                 <Search className="w-8 h-8 opacity-30" />
              </div>
              <span className="text-sm font-medium opacity-70">
                {selectedCategory === "Todos" ? "No encontrado." : `Sin resultados en ${selectedCategory}.`}
              </span>
            </div>
          ) : (
            filtered.map(loc => {
              const Icon = categoryIcons[loc.category] || MapPin;
              const isOpen = checkIsOpen(loc.schedule);
              return (
                <div 
                  key={loc.id || loc._id} 
                  onClick={() => onLocationSelect(loc)}
                  className="group p-4 bg-white/80 hover:bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1e3a8a]/30 transition-all cursor-pointer flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50/50 text-[#1e3a8a] flex items-center justify-center group-hover:bg-[#1e3a8a] group-hover:text-white transition-all duration-300 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-[#1e3a8a] mb-1">{loc.name}</h4>
                    {loc.schedule && (
                      <div className="mt-1 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={`text-[10px] font-bold uppercase ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
                              {isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{loc.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}