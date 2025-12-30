import React from "react";
import { cn } from "./ui/shim"; // Usamos tu utilidad para mezclar clases

export function Footer({ className }) {
  return (
    <footer className={cn("w-full p-4 text-center z-20 bg-black/20 backdrop-blur-sm border-t border-white/10 text-white", className)}>
      <p className="text-[10px] sm:text-xs opacity-80">
        © 2025 Universidad Central del Ecuador. Todos los derechos reservados.
      </p>
    </footer>
  );
}