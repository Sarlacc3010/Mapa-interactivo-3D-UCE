import React, { useState } from "react";
import { Search, X, MapPin, Building2, BookOpen, Coffee, Car, Theater, Briefcase } from "lucide-react";
import { Input, Badge, ScrollArea } from "./ui/shim";

// Mapeo ampliado para cubrir más casos de la UCE
const categoryIcons = {
  'Académico': Building2,
  'Biblioteca': BookOpen,
  'Cafetería': Coffee,
  'Estacionamiento': Car,
  'Administrativo': Briefcase, // Agregado por si acaso
  'Teatro': Theater,           // Agregado por si acaso
  'Otro': MapPin
};

// Categorías para los filtros visuales
const FILTER_CATEGORIES = ["Todos", "Académico", "Biblioteca", "Cafetería", "Estacionamiento", "Administrativo"];

export function SearchPanel({ locations = [], onLocationSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Lógica de filtrado
  const filtered = locations.filter(loc => {
    // Protección: aseguramos que existan name y category antes de comparar
    const name = loc.name || "";
    const category = loc.category || "Otro";

    const matchText = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "Todos" || category === selectedCategory;
    
    return matchText && matchCat;
  });

  return (
    <div className="absolute top-20 left-6 z-20 w-80 max-h-[70vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-5 border border-gray-200">
      
      {/* Cabecera */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[#1e3a8a] font-bold text-lg">Explorar UCE</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar facultad..." 
            className="pl-9 bg-gray-50 border-transparent focus:bg-white focus:border-red-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros (Categorías) */}
      <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {FILTER_CATEGORIES.map(cat => (
          <Badge 
            key={cat} 
            variant={selectedCategory === cat ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap px-3 py-1 hover:bg-blue-50 transition-colors"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Lista de Resultados */}
      <ScrollArea className="flex-1 p-2 bg-gray-50/50">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <span>No se encontraron lugares.</span>
            </div>
          ) : (
            filtered.map(loc => {
              // Lógica defensiva: Si no hay icono para la categoría, usa MapPin
              const Icon = categoryIcons[loc.category] || MapPin;
              
              // Soporte para _id (MongoDB) o id (Frontend simulado)
              const uniqueId = loc.id || loc._id; 

              return (
                <div 
                  key={uniqueId} 
                  onClick={() => onLocationSelect(loc)}
                  className="p-3 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{loc.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                      {loc.description || "Sin descripción disponible"}
                    </p>
                    {loc.schedule && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                           🕒 {loc.schedule}
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