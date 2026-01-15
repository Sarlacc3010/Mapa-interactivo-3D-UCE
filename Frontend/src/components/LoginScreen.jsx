import React, { useState, useEffect } from "react";
import { Button, Input, Label } from "./ui/shim"; 
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UCELogoImage } from "./UCELogoImage";
import { MapPin } from "lucide-react"; 

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
        const facs = data.filter(l => l.name.toLowerCase().includes('facultad'));
        setFaculties(facs);
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
         <a 
            href="mailto:soporte@uce.edu.ec?subject=Ayuda%20Plataforma%203D"
            className="hidden sm:flex items-center gap-2 text-white/80 text-xs font-medium cursor-pointer hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20"
         >
            <span>?</span> Ayuda / Soporte
         </a>
      </Header>
      
      <main className="flex-1 flex items-center justify-center p-4 z-10">
       
       {/* TARJETA PRINCIPAL: Aquí definimos el color de fondo para TODO (bg-white/95) */}
       <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 h-[70vh] min-h-[500px] flex flex-col overflow-hidden">
          
          {/* CABECERA FIJA */}
          {/* CAMBIO: Quité 'bg-white/50' para que sea transparente y use el fondo del padre */}
          <div className="text-center p-8 pb-4 shrink-0 border-b border-gray-100/50 z-20">
            <div className="flex justify-center mb-2">
              <UCELogoImage className="w-24 h-auto" />
            </div>
            <h1 className="text-[#1e3a8a] text-2xl font-bold">
              {isRegistering ? "Crear Cuenta" : "Bienvenido"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isRegistering ? "Registro para estudiantes/docentes" : "Ingresa tus credenciales institucionales"}
            </p>
          </div>

          {/* CUERPO SCROLLABLE */}
          <div className="overflow-y-auto p-8 pt-4 custom-scrollbar flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {isRegistering && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                        <Label>Nombre Completo</Label>
                        <Input 
                            type="text" 
                            placeholder="Juan Pérez" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            className="bg-white" 
                        />
                    </div>
                )}

                <div className="space-y-1.5">
                  <Label>Correo Electrónico</Label>
                  <Input 
                    type="email" 
                    placeholder="usuario@uce.edu.ec" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="bg-white" 
                  />
                  {isRegistering && isInstitutional && (
                      <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 animate-in fade-in">
                          ✓ Correo institucional detectado
                      </p>
                  )}
                </div>

                {isRegistering && isInstitutional && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <Label className="text-[#1e3a8a]">Selecciona tu Facultad</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-blue-400" size={16} />
                            <select 
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                required
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 appearance-none"
                            >
                                <option value="">-- Elige una opción --</option>
                                {faculties.map((fac) => (
                                    <option key={fac.id} value={fac.id}>
                                        {fac.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400 text-xs">
                                ▼
                            </div>
                        </div>
                        <p className="text-[10px] text-blue-600/80 leading-tight pt-1">
                            Esto nos servirá para personalizar tu experiencia en el mapa.
                        </p>
                    </div>
                )}
                
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
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100 animate-pulse">
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
                          <span className="bg-white px-2 text-gray-500">Visitantes</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => window.location.href = "http://localhost:5000/auth/google"}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                        Ingresar con Google
                      </button>
                    </div>
                )}
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100 text-center pb-2">
                 <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(""); setSelectedFaculty(""); }} 
                    className="text-[#1e3a8a] font-medium text-sm hover:underline"
                 >
                   {isRegistering 
                     ? "← ¿Ya tienes cuenta? Inicia sesión" 
                     : "¿Eres estudiante/docente? Regístrate aquí"
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