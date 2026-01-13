import React, { useState } from "react";
import { Button, Input, Label } from "./ui/shim"; 
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UCELogoImage } from "./UCELogoImage";
// Nota: Ya no importamos useSearchParams porque App.jsx maneja la sesión
import { useNavigate } from 'react-router-dom';

export function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  
  // Estados de UI
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // MANEJO DEL SUBMIT (Login/Registro con Cookies)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación básica de contraseñas
    if (isRegistering && password !== confirmPass) { 
      setError("Las contraseñas no coinciden"); 
      return; 
    }
    
    setLoading(true);
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Cookies HttpOnly
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Notificamos al componente padre
        onLogin(data.user.role);
      } else {
        setError(data.error || "Ocurrió un error inesperado");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#1e3a8a] to-[#D9232D] relative overflow-hidden">
      
      <Header>
         <div className="hidden sm:block text-white/80 text-xs font-medium cursor-pointer hover:text-white transition-colors">
            Ayuda / Soporte
         </div>
      </Header>
      
      <main className="flex-1 flex items-center justify-center p-4 z-10">
       <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
          
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <UCELogoImage className="w-28 h-auto" />
            </div>
            <h1 className="text-[#1e3a8a] text-2xl font-bold">
              {isRegistering ? "Crear Cuenta" : "Bienvenido"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isRegistering ? "Registro para estudiantes/docentes" : "Ingresa tus credenciales institucionales"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <Label>Correo Institucional</Label>
              <Input 
                type="email" 
                placeholder="usuario@uce.edu.ec" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-white" 
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-white" 
              />
            </div>

            {isRegistering && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label>Confirmar Contraseña</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPass} 
                  onChange={(e) => setConfirmPass(e.target.value)} 
                  required 
                  className="bg-white" 
                />
              </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
                    ⚠️ {error}
                </div>
            )}
            
            <Button 
                type="submit" 
                className="w-full h-11 mt-4 shadow-lg hover:shadow-blue-500/25 transition-all bg-[#1e3a8a] hover:bg-[#152c6e]" 
                disabled={loading}
            >
              {loading 
                ? "Procesando..." 
                : (isRegistering ? "Registrarse" : "Ingresar")
              }
            </Button>

            {!isRegistering && (
                <div className="mt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">O continúa con</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => window.location.href = "http://localhost:5000/auth/google"}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                    Google
                  </button>
                </div>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
             <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(""); }} 
                className="text-[#1e3a8a] font-medium text-sm hover:underline"
             >
               {isRegistering 
                 ? "← ¿Ya tienes cuenta? Inicia sesión" 
                 : "¿No tienes cuenta? Regístrate aquí"
               }
             </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}