import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
// CORRECTION 1: Import 'api' by default (without braces {})
import api from '../api/client';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    // If no token in URL, immediate error
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        // CORRECTION 2: Use 'api.post' instead of fetch.
        // Axios already knows base is localhost:5000/api, just put final route.
        await api.post('/verify-email', { token });

        setStatus('success');
        // Redirect to login after 3.5 seconds
        setTimeout(() => navigate('/login'), 3500);

      } catch (error) {
        console.error("Error verificando:", error);
        setStatus('error');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100 transition-all duration-300 transform hover:scale-[1.01]">

        {/* STATE: LOADING */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center animate-pulse">
            <Loader size={50} className="text-blue-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando tu cuenta...</h2>
            <p className="text-gray-500">Estamos validando tu enlace de seguridad.</p>
          </div>
        )}

        {/* STATE: SUCCESS */}
        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Cuenta Verificada!</h2>
            <p className="text-gray-600 mb-6">Tu correo ha sido confirmado correctamente. <br /> Te estamos redirigiendo...</p>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20"
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        )}

        {/* STATE: ERROR */}
        {status === 'error' && (
          <div className="flex flex-col items-center animate-in shake duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enlace Inválido</h2>
            <p className="text-gray-600 mb-6">
              El enlace de verificación ha expirado o ya fue utilizado anteriormente.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/login')}
                className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver al Login
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400 font-mono">
        Campus Virtual UCE &copy; 2026
      </p>
    </div>
  );
}