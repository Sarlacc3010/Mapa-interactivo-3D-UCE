import React, { useState, useEffect } from 'react';

export function FPSControls() {
    const [keysPressed, setKeysPressed] = useState({
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false,
        ctrl: false
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') setKeysPressed(prev => ({ ...prev, w: true }));
            if (key === 'a') setKeysPressed(prev => ({ ...prev, a: true }));
            if (key === 's') setKeysPressed(prev => ({ ...prev, s: true }));
            if (key === 'd') setKeysPressed(prev => ({ ...prev, d: true }));
            if (e.key === 'Shift') setKeysPressed(prev => ({ ...prev, shift: true }));
            if (e.key === 'Control') setKeysPressed(prev => ({ ...prev, ctrl: true }));
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') setKeysPressed(prev => ({ ...prev, w: false }));
            if (key === 'a') setKeysPressed(prev => ({ ...prev, a: false }));
            if (key === 's') setKeysPressed(prev => ({ ...prev, s: false }));
            if (key === 'd') setKeysPressed(prev => ({ ...prev, d: false }));
            if (e.key === 'Shift') setKeysPressed(prev => ({ ...prev, shift: false }));
            if (e.key === 'Control') setKeysPressed(prev => ({ ...prev, ctrl: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <>
            {/* Crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                <div className="relative w-6 h-6">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                    <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-white opacity-60"></div>
                    <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-white opacity-60"></div>
                    <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-white opacity-60"></div>
                    <div className="absolute left-1/2 bottom-0 w-0.5 h-2 bg-white opacity-60"></div>
                </div>
            </div>

            {/* Controls UI */}
            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10 pointer-events-none z-40">
                <div className="text-white text-xs space-y-1.5 font-mono">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 w-20">Mover:</span>
                        <div className="flex gap-1">
                            <kbd className={`px-2 py-1 rounded ${keysPressed.w ? 'bg-cyan-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>W</kbd>
                            <kbd className={`px-2 py-1 rounded ${keysPressed.a ? 'bg-cyan-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>A</kbd>
                            <kbd className={`px-2 py-1 rounded ${keysPressed.s ? 'bg-cyan-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>S</kbd>
                            <kbd className={`px-2 py-1 rounded ${keysPressed.d ? 'bg-cyan-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>D</kbd>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 w-20">Correr:</span>
                        <kbd className={`px-2 py-1 rounded ${keysPressed.shift ? 'bg-green-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>Shift</kbd>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400 w-20">Agacharse:</span>
                        <kbd className={`px-2 py-1 rounded ${keysPressed.ctrl ? 'bg-yellow-500/80' : 'bg-gray-700/50'} border border-white/20 transition-colors`}>Ctrl</kbd>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 text-gray-400 text-[10px]">
                        Presiona <kbd className="px-1 bg-gray-700/50 rounded border border-white/20">ESC</kbd> para liberar el mouse
                    </div>
                </div>
            </div>
        </>
    );
}
