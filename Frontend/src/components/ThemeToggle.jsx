import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Component to toggle between Light and Dark (Neon) modes.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-3 rounded-full shadow-lg transition-all duration-500 border
        hover:scale-110 active:scale-95
        ${theme === 'dark'
          ? 'bg-slate-800 text-yellow-400 border-white/10 hover:bg-slate-700 hover:shadow-yellow-400/20'
          : 'bg-white text-orange-500 border-gray-200 hover:bg-orange-50 hover:shadow-orange-500/20'
        }
      `}
      title={theme === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Neón"}
    >
      {theme === 'dark' ? (
        <Moon size={20} className="fill-current" />
      ) : (
        <Sun size={20} className="fill-current" />
      )}
    </button>
  );
}