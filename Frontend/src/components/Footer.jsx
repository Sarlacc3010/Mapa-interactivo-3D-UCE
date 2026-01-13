import React from "react";
import { cn } from "./ui/shim";
import { Globe, Facebook, Instagram } from "lucide-react";

export function Footer({ className }) {
  return (
    <footer 
      className={cn(
        // Diseño base: Vidrio esmerilado igual que el Header
        "w-full px-6 py-3 z-20 bg-white/10 backdrop-blur-md border-t border-white/20 text-white",
        // Flexbox para separar contenido en escritorio y apilar en móvil
        "flex flex-col sm:flex-row items-center justify-between gap-3",
        className
      )}
    >
      
      {/* Lado Izquierdo: Copyright */}
      <div className="text-center sm:text-left">
        <p className="text-[10px] sm:text-xs font-medium opacity-90 tracking-wide">
          © 2025 Universidad Central del Ecuador
        </p>
        <p className="text-[9px] sm:text-[10px] opacity-60">
          Todos los derechos reservados
        </p>
      </div>

      {/* Lado Derecho: Redes Sociales */}
      <div className="flex items-center gap-1">
        <SocialLink icon={Globe} href="https://www.uce.edu.ec" label="Web Oficial" />
        <SocialLink icon={Facebook} href="https://www.facebook.com/lacentralec" label="Facebook" />
        <SocialLink icon={Instagram} href="https://www.instagram.com/laucentralec/" label="Instagram" />
      </div>

    </footer>
  );
}

// Componente auxiliar para los iconos
function SocialLink({ icon: Icon, href, label }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      title={label}
      className="p-2 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 hover:scale-110"
    >
      <Icon size={14} strokeWidth={2.5} />
    </a>
  );
}