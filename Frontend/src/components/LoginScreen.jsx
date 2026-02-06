import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore"; // Import Zustand Store
import api from "../api/client";
import { Button, Input, Label } from "./ui/shim";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { UCELogoImage } from "./UCELogoImage";
import { MapPin, Loader, User } from "lucide-react";

export function LoginScreen() {
  const login = useAuthStore((state) => state.login); // Access global login action
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Faculty logic
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load faculties on mount
  useEffect(() => {
    api.get('/locations')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          const facs = data.filter(l => l.name.toLowerCase().includes('facultad'));
          setFaculties(facs);
        }
      })
      .catch(err => console.error("Error loading faculties", err));
  }, []);

  const isInstitutional = email.toLowerCase().includes('@uce.edu.ec');

  // HANDLER: Guest Login Logic
  const handleGuestLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post('/login/guest');
      if (response.data.user) {
        // Update global state via Zustand
        login(response.data.user);
      }
    } catch (err) {
      console.error("Guest login failed", err);
      setError("No se pudo ingresar como invitado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // HANDLER: Standard Login/Register Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      if (password !== confirmPass) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (isInstitutional && !selectedFaculty) {
        setError("Por favor selecciona tu Facultad.");
        return;
      }
    }

    setLoading(true);
    const endpoint = isRegistering ? '/register' : '/login';

    try {
      const response = await api.post(endpoint, {
        email,
        password,
        name: isRegistering ? name : undefined,
        faculty_id: (isRegistering && isInstitutional) ? selectedFaculty : null
      });

      const data = response.data;

      if (isRegistering && data.message) {
        alert(data.message);
        setIsRegistering(false);
      } else {
        // LOGIN SUCCESSFUL
        // FIX: Sometimes /login endpoint does not return full name.
        // Make extra call to /profile to ensure full data (name, role, faculty).
        try {
          const profileResponse = await api.get('/profile');
          login(profileResponse.data.user); // Save COMPLETE user
        } catch (profileError) {
          console.warn("No se pudo cargar el perfil completo, usando datos básicos del login", profileError);
          login(data.user); // Fallback if /profile fails
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#1e3a8a] to-[#D9232D] relative overflow-hidden font-sans">
      <Header isLoginPage={true} />

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 h-[70vh] min-h-[550px] flex flex-col overflow-hidden border border-white/20">

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

          <div className="overflow-y-auto p-8 pt-6 custom-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="space-y-5">

              {isRegistering && (
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Nombre Completo</Label>
                  <Input
                    type="text"
                    placeholder="Juan Perez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 focus:border-blue-500"
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
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                />
                {isRegistering && isInstitutional && (
                  <p className="text-[11px] text-green-600 font-bold bg-green-50 p-1.5 rounded border border-green-100">
                    Correo institucional detectado
                  </p>
                )}
              </div>

              {isRegistering && isInstitutional && (
                <div className="space-y-1.5 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <Label className="text-[#1e3a8a] font-bold text-sm block mb-1">Selecciona tu Facultad</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-blue-500 pointer-events-none" size={18} />
                    <select
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      required
                      className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="" className="text-gray-400">-- Seleccionar Opción --</option>
                      {faculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>{fac.name}</option>
                      ))}
                    </select>
                  </div>
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
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                />
              </div>

              {isRegistering && (
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Confirmar Contraseña</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 mt-6 bg-[#1e3a8a] hover:bg-[#152c6e] text-white font-bold rounded-xl"
                disabled={loading}
              >
                {loading ? <Loader className="animate-spin w-4 h-4 mx-auto" /> : (isRegistering ? "Registrarse" : "Iniciar Sesión")}
              </Button>

              {!isRegistering && (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                      const authUrl = isLocal ? 'http://localhost:5000/auth/google' : '/auth/google';
                      window.location.href = authUrl;
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="G" />
                    Ingresar con Google
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">O</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-[#1e3a8a] text-sm font-semibold transition-colors py-2"
                  >
                    <User size={16} /> Continuar como Invitado
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => { setIsRegistering(!isRegistering); setError(""); setSelectedFaculty(""); }}
                className="text-[#1e3a8a] font-semibold text-sm hover:text-blue-800 transition-colors hover:underline underline-offset-4"
              >
                {isRegistering ? "← ¿Ya tienes cuenta? Inicia sesión" : "¿Eres estudiante nuevo? Regístrate aquí"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}