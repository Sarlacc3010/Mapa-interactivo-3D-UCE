import React, { useState, useEffect } from "react";
import { Search, X, MapPin, Building2, BookOpen, Theater, Briefcase, Clock } from "lucide-react";
import { Input, Badge, ScrollArea } from "./ui/shim"; // Usados solo en modo claro
import { useTheme } from "../context/ThemeContext";

const categoryIcons = {
  'Facultades': Building2, 'Facultad': Building2, 'Académico': Building2,
  'Biblioteca': BookOpen, 'Administrativo': Briefcase, 'Teatro': Theater, 'Otro': MapPin
};

const FILTER_CATEGORIES = ["Todos", "Facultades", "Biblioteca", "Administrativo"];

export function SearchPanel({ locations = [], onLocationSelect }) {
  const { theme } = useTheme(); // Detectamos el modo actual
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
        return minutes >= (startH * 60 + startM) && minutes < (endH * 60 + endM);
    }
    return false;
  };

  const filtered = locations.filter(loc => {
    const name = loc.name || "";
    const category = loc.category || "Otro"; 
    const matchText = name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchCat = selectedCategory === "Todos" || 
      (selectedCategory === "Facultades" && ["Facultades", "Facultad", "Académico"].includes(category)) || 
      category === selectedCategory;
    return matchText && matchCat;
  });

  // ===========================================================================
  // RAMA 1: DISEÑO NEÓN (MODO OSCURO) - TU CÓDIGO INTACTO
  // ===========================================================================
  if (theme === 'dark') {
    if (!isExpanded) {
      return (
        <button 
          onClick={() => setIsExpanded(true)}
          className="absolute top-28 left-6 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-950/80 hover:scale-105 active:scale-95 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          <Search className="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>
      );
    }

    return (
      <div className="absolute top-24 left-6 z-20 w-96 max-h-[75vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-10 duration-500 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 ring-1 ring-black/50">
        <div className="p-5 border-b border-white/5 shrink-0 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
                Explorar UCE <span className="text-cyan-400 text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">BETA</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Encuentra tu destino en el campus</p>
            </div>
            <button onClick={() => { setIsExpanded(false); setSearchQuery(""); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              autoFocus type="text" placeholder="Buscar facultad, auditorio..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 h-11 bg-slate-950/50 border border-white/10 text-slate-200 text-sm rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:bg-slate-900 placeholder:text-slate-600 transition-all"
            />
          </div>
        </div>
        <div className="px-5 py-3 border-b border-white/5 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {FILTER_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${selectedCategory === cat ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filtered.map(loc => {
            const Icon = categoryIcons[loc.category] || MapPin;
            const isOpen = checkIsOpen(loc.schedule);
            return (
              <button key={loc.id} onClick={() => onLocationSelect(loc)} className="w-full text-left group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/5 text-slate-400 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all duration-300 shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-200 text-sm leading-tight group-hover:text-white mb-1 truncate">{loc.name}</h4>
                  {loc.schedule && (
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px] ${isOpen ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${isOpen ? 'text-emerald-400' : 'text-red-400'}`}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
                      <span className="text-[10px] text-slate-600 font-mono border-l border-white/10 pl-2 ml-1">{loc.schedule}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 bg-black/20 border-t border-white/5 text-[10px] text-slate-600 text-center flex items-center justify-center gap-2">
          <Clock size={10} /> <span>Hora del servidor: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RAMA 2: DISEÑO ANTERIOR (MODO CLARO) - TU DISEÑO ORIGINAL CORREGIDO
  // ===========================================================================
  if (!isExpanded) {
    return (
      <button onClick={() => setIsExpanded(true)} className="absolute top-28 left-6 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group bg-black/20 backdrop-blur-md border border-white/10 text-white shadow-lg hover:bg-white/20 hover:scale-105 active:scale-95 hover:border-white/30">
        <Search className="w-5 h-5 opacity-90 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="absolute top-24 left-6 z-20 w-96 max-h-[75vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-10 duration-300 border border-white/40 ring-1 ring-black/5">
      <div className="p-5 border-b border-gray-100/50 shrink-0 bg-white/50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[#1e3a8a] font-bold text-xl tracking-tight">Explorar UCE</h2>
            <p className="text-xs text-gray-500 mt-0.5">Encuentra facultades y servicios</p>
          </div>
          <button onClick={() => { setIsExpanded(false); setSearchQuery(""); }} className="p-2 rounded-full hover:bg-gray-200/50 text-gray-400 hover:text-red-500 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
          <Input 
            autoFocus 
            placeholder="Buscar facultad..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all rounded-xl"
          />
        </div>
      </div>
      <div className="px-5 py-3 border-b border-gray-100/50 flex gap-2 overflow-x-auto shrink-0 bg-gray-50/50 no-scrollbar">
        {FILTER_CATEGORIES.map(cat => (
          <Badge key={cat} variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)} className={`cursor-pointer whitespace-nowrap px-4 py-1.5 text-xs font-medium transition-all ${selectedCategory === cat ? "bg-[#1e3a8a] hover:bg-[#152c6e] text-white border-transparent shadow-sm" : "bg-white/80 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-white"}`}>
            {cat}
          </Badge>
        ))}
      </div>
      <ScrollArea className="flex-1 bg-white/30">
        <div className="p-4 space-y-3">
          {filtered.map(loc => {
            const Icon = categoryIcons[loc.category] || MapPin;
            const isOpen = checkIsOpen(loc.schedule);
            return (
              <div key={loc.id} onClick={() => onLocationSelect(loc)} className="group p-4 bg-white/80 hover:bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1e3a8a]/30 transition-all cursor-pointer flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50/50 text-[#1e3a8a] flex items-center justify-center group-hover:bg-[#1e3a8a] group-hover:text-white transition-all duration-300 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-[#1e3a8a] mb-1">{loc.name}</h4>
                  {loc.schedule && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-bold uppercase ${isOpen ? 'text-green-600' : 'text-red-500'}`}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{loc.schedule}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}