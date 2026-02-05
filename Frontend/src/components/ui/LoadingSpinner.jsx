import React from 'react';

/**
 * Componente centralizado para estados de carga
 * Proporciona diferentes variantes de loaders para distintos contextos
 */

// Loader de pantalla completa
export function ScreenLoader({ message = "CARGANDO INTERFAZ..." }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white gap-4 transition-colors duration-500">
            <div className="w-12 h-12 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
            <div className="animate-pulse font-bold tracking-widest text-sm">{message}</div>
        </div>
    );
}

// Loader inline (para secciones de la página)
export function InlineLoader({ size = "md", message = null }) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4"
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2 py-4">
            <div className={`${sizeClasses[size]} border-[#D9232D] border-t-transparent rounded-full animate-spin`}></div>
            {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
        </div>
    );
}

// Loader para botones
export function ButtonLoader({ size = "sm" }) {
    const sizeClasses = {
        xs: "w-3 h-3 border",
        sm: "w-4 h-4 border-2",
        md: "w-5 h-5 border-2"
    };

    return (
        <div className={`${sizeClasses[size]} border-white border-t-transparent rounded-full animate-spin`}></div>
    );
}

// Loader 3D (para canvas de Three.js)
export function Loader3D() {
    return (
        <div className="flex flex-col items-center gap-2 select-none pointer-events-none">
            <div className="w-10 h-10 border-4 border-[#D9232D] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white font-bold text-xs tracking-widest bg-black/50 px-2 py-1 rounded">
                CARGANDO 3D...
            </div>
        </div>
    );
}

// Export default para compatibilidad
export default ScreenLoader;
