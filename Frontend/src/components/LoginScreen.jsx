import React, { useState, useEffect } from "react";
import { Button, Input, Label } from "./ui/shim"; 
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UCELogoImage } from "./UCELogoImage";
import { MapPin, Loader } from "lucide-react"; 

export function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados del formulario
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  
  // Lógica de Facultades
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");

  // Estados de UI
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. CARGAR LISTA DE FACULTADES
  useEffect(() => {
    fetch('http://localhost:5000/api/locations')
      .then(res => res.json())
      .then(data => {
        // Validación para evitar errores si data no es array
        if (Array.isArray(data)) {
            const facs = data.filter(l => l.name.toLowerCase().includes('facultad'));
            setFaculties(facs);
        }
      })
      .catch(err => console.error("Error cargando facultades", err));
  }, []);

  const isInstitutional = email.toLowerCase().includes('@uce.edu.ec');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
        if (password !== confirmPass) { 
            setError("Las contraseñas no coinciden"); 
            return; 
        }
        if (isInstitutional && !selectedFaculty) {
            setError("Por favor selecciona tu Facultad para continuar.");
            return;
        }
    }
    
    setLoading(true);
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ 
            email, 
            password, 
            name: isRegistering ? name : undefined, 
            faculty_id: (isRegistering && isInstitutional) ? selectedFaculty : null 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Si es registro, mostramos el mensaje de éxito o pasamos al login
        if (isRegistering && data.message) {
            alert(data.message); // O usa un estado para mostrar mensaje UI
            setIsRegistering(false); // Volver al login
        } else {
            onLogin(data.user.role);
        }
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
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#1e3a8a] to-[#D9232D] relative overflow-hidden font-sans">
      
      <Header isLoginPage={true}>
         <a 
           href="mailto:soporte@uce.edu.ec?subject=Ayuda%20Plataforma%203D"
           className="hidden sm:flex items-center gap-2 text-white/80 text-xs font-medium cursor-pointer hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20"
         >
            <span>?</span> Ayuda / Soporte
         </a>
      </Header>
      
      <main className="flex-1 flex items-center justify-center p-4 z-10">
       
       {/* TARJETA PRINCIPAL */}
       <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 min-h-[500px] flex flex-col overflow-hidden border border-white/20">
          
          {/* CABECERA DE LA TARJETA */}
          <div className="text-center p-8 pb-4 shrink-0 border-b border-gray-200 z-20">
            <div className="flex justify-center mb-4">
              <UCELogoImage className="w-20 h-auto drop-shadow-md" />
            </div>
            <h1 className="text-[#1e3a8a] text-2xl font-bold tracking-tight">
              {isRegistering ? "Crear Cuenta" : "Bienvenido"}
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              {isRegistering ? "Registro para estudiantes/docentes" : "Ingresa tus credenciales institucionales"}
            </p>
          </div>

          {/* CUERPO DEL FORMULARIO */}
          <div className="overflow-y-auto p-8 pt-6 custom-scrollbar flex-1">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {isRegistering && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                        {/* 🔥 FORZAMOS COLOR OSCURO EN LABEL */}
                        <Label className="text-gray-700 font-semibold text-sm">Nombre Completo</Label>
                        <Input 
                            type="text" 
                            placeholder="Juan Pérez" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            // 🔥 FORZAMOS TEXTO OSCURO EN INPUT
                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20" 
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Correo Electrónico</Label>
                  <Input 
                    type="email" 
                    placeholder="usuario@uce.edu.ec" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20" 
                  />
                  {isRegistering && isInstitutional && (
                      <p className="text-[11px] text-green-600 font-bold flex items-center gap-1 animate-in fade-in bg-green-50 p-1.5 rounded border border-green-100">
                          ✓ Correo institucional detectado
                      </p>
                  )}
                </div>

                {isRegistering && isInstitutional && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <Label className="text-[#1e3a8a] font-bold text-sm block mb-1">Selecciona tu Facultad</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-blue-500 pointer-events-none" size={18} />
                            <select 
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                required
                                className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 appearance-none shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                <option value="" className="text-gray-400">-- Elige una opción --</option>
                                {faculties.map((fac) => (
                                    <option key={fac.id} value={fac.id} className="text-gray-900">
                                        {fac.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3 pointer-events-none text-blue-400 text-[10px]">
                                ▼
                            </div>
                        </div>
                        <p className="text-[11px] text-blue-600/80 leading-tight pt-2">
                            Esto nos servirá para personalizar tu experiencia en el mapa.
                        </p>
                    </div>
                )}
                
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Contraseña</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20" 
                  />
                </div>

                {isRegistering && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <Label className="text-gray-700 font-semibold text-sm">Confirmar Contraseña</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPass} 
                      onChange={(e) => setConfirmPass(e.target.value)} 
                      required 
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20" 
                    />
                  </div>
                )}

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100 animate-pulse flex items-center justify-center gap-2">
                        <span className="bg-red-100 p-0.5 rounded-full px-1.5">!</span> {error}
                    </div>
                )}
                
                <Button 
                    type="submit" 
                    className="w-full h-12 mt-6 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all bg-[#1e3a8a] hover:bg-[#152c6e] text-white font-bold text-base rounded-xl" 
                    disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                        <Loader className="animate-spin w-4 h-4" /> Procesando...
                    </span>
                  ) : (isRegistering ? "Registrarse" : "Ingresar")}
                </Button>

                {!isRegistering && (
                    <div className="mt-6">
                      <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                          <span className="bg-white px-3 text-gray-400 font-semibold">Institucional</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => window.location.href = "http://localhost:5000/auth/google"}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
                      >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
                        Ingresar con Google
                      </button>
                    </div>
                )}
              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                 <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(""); setSelectedFaculty(""); }} 
                    className="text-[#1e3a8a] font-semibold text-sm hover:text-blue-800 transition-colors hover:underline underline-offset-4"
                 >
                   {isRegistering 
                     ? "← ¿Ya tienes cuenta? Inicia sesión" 
                     : "¿Eres estudiante nuevo? Regístrate aquí"
                   }
                 </button>
              </div>
          </div>
       </div>
      </main>

      <Footer />
    </div>
  );
}