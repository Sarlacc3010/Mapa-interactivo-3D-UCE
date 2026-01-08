import React, { useState } from "react";
import { Search, X, MapPin, Building2, BookOpen, Car, Theater, Briefcase } from "lucide-react";
import { Input, Badge, ScrollArea } from "./ui/shim";

// 1. Mapeo de iconos: Asignamos el icono de Edificio a cualquiera de estas variantes
const categoryIcons = {
  'Facultades': Building2,
  'Facultad': Building2,   // Por si viene en singular
  'Académico': Building2,  // Por si viene como en la BD original
  'Biblioteca': BookOpen,
  'Estacionamiento': Car,
  'Administrativo': Briefcase,
  'Teatro': Theater,
  'Otro': MapPin
};

// 2. Filtros visuales (Lo que ve el usuario)
const FILTER_CATEGORIES = ["Todos", "Facultades", "Biblioteca", "Estacionamiento", "Administrativo"];

export function SearchPanel({ locations = [], onLocationSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // 3. Lógica de Filtrado Mejorada
  const filtered = locations.filter(loc => {
    const name = loc.name || "";
    const category = loc.category || "Otro"; 
    
    // A. Filtro por Texto (Buscador)
    const matchText = name.toLowerCase().includes(searchQuery.toLowerCase());

    // B. Filtro por Categoría (Smart Match)
    let matchCat = false;

    if (selectedCategory === "Todos") {
        matchCat = true;
    } else if (selectedCategory === "Facultades") {
        // AQUÍ ESTÁ EL TRUCO:
        // Si el usuario elige "Facultades", aceptamos también "Facultad" o "Académico"
        matchCat = category === "Facultades" || category === "Facultad" || category === "Académico";
    } else {
        // Para el resto (Biblioteca, etc) la coincidencia debe ser exacta
        matchCat = category === selectedCategory;
    }
    
    return matchText && matchCat;
  });

  return (
    <div className="absolute top-20 left-6 z-20 w-96 max-h-[75vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-5 border border-gray-200 ring-1 ring-black/5">
      
      {/* --- Cabecera --- */}
      <div className="p-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[#1e3a8a] font-bold text-xl tracking-tight">Explorar UCE</h2>
            <p className="text-xs text-gray-400 mt-0.5">Encuentra facultades y servicios</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
          <Input 
            placeholder="Buscar facultad, biblioteca..." 
            className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* --- Filtros (Badges) --- */}
      <div className="px-5 py-3 border-b border-gray-50 flex gap-2 overflow-x-auto shrink-0 bg-gray-50/30 no-scrollbar">
        {FILTER_CATEGORIES.map(cat => (
          <Badge 
            key={cat} 
            variant={selectedCategory === cat ? "default" : "outline"}
            className={`cursor-pointer whitespace-nowrap px-4 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat 
                ? "bg-[#1e3a8a] hover:bg-[#152c6e] text-white border-transparent shadow-sm" 
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* --- Lista de Resultados --- */}
      <ScrollArea className="flex-1 bg-gray-50/50">
        <div className="p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                 <Search className="w-8 h-8 opacity-30" />
              </div>
              <span className="text-sm font-medium">
                {selectedCategory === "Todos" 
                    ? "No encontramos ese lugar." 
                    : `No hay resultados en ${selectedCategory}.`
                }
              </span>
            </div>
          ) : (
            filtered.map(loc => {
              // Icono dinámico según categoría real
              const Icon = categoryIcons[loc.category] || MapPin;
              const uniqueId = loc.id || loc._id; 

              return (
                <div 
                  key={uniqueId} 
                  onClick={() => onLocationSelect(loc)}
                  className="group p-4 bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#1e3a8a]/30 transition-all cursor-pointer flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50/80 text-[#1e3a8a] flex items-center justify-center group-hover:bg-[#1e3a8a] group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-0.5">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-[#1e3a8a] transition-colors mb-1">
                        {loc.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {loc.description || "Sin descripción disponible."}
                    </p>
                    
                    {loc.schedule && (
                      <div className="mt-2 flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                         <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                            {loc.schedule}
                         </span>
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