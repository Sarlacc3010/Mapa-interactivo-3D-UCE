import React, { useState } from "react";
import { Button, Input, Label } from "./ui/shim"; 
import { Header } from "./Header"; // <--- Nuevo
import { Footer } from "./Footer"; // <--- Nuevo
import { UCELogoImage } from "./UCELogoImage";

export function LoginScreen({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ... (Tu función handleSubmit sigue igual que antes, no la borres)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegistering && password !== confirmPass) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const endpoint = isRegistering ? '/register' : '/login';
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        onLogin(data.role);
      } else { setError(data.error || "Error"); }
    } catch (err) { setError("Sin conexión al servidor"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#1e3a8a] to-[#D9232D] relative overflow-hidden">
      
      {/* 1. HEADER REUTILIZABLE */}
      <Header>
         {/* Aquí inyectamos el contenido específico del Login (Lado derecho) */}
         <div className="hidden sm:block text-white/80 text-xs font-medium cursor-pointer hover:text-white transition-colors">
            Ayuda
         </div>
      </Header>

      {/* 2. MAIN (Formulario) */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
       <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
  
  <div className="text-center mb-6">
   {/* 1. EL LOGO (Siempre visible, centrado) */}
   <div className="flex justify-center mb-2">
     <UCELogoImage className="w-28 h-auto" /> {/* Ajusté un poco el tamaño para que encaje con texto */}
   </div>

   {/* 2. EL TÍTULO (Cambia dinámicamente) */}
   <h1 className="text-[#1e3a8a] text-2xl font-bold">
     {isRegistering ? "Crear Cuenta" : "Bienvenido"}
   </h1>

   {/* 3. SUBTÍTULO */}
   <p className="text-gray-500 text-sm mt-1">
     {isRegistering ? "Registro Académico" : "Ingresa tus credenciales"}
   </p>
</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Correo Institucional</Label>
              <Input type="email" placeholder="usuario@uce.edu.ec" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white" />
            </div>
            {isRegistering && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label>Confirmar Contraseña</Label>
                <Input type="password" placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required className="bg-white" />
              </div>
            )}
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center">⚠️ {error}</div>}
            
            <Button type="submit" className="w-full h-11 mt-4" disabled={loading}>
              {loading ? "Cargando..." : (isRegistering ? "Registrarse" : "Ingresar")}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
             <button onClick={() => { setIsRegistering(!isRegistering); setError(""); }} className="text-[#1e3a8a] font-medium text-sm hover:underline">
               {isRegistering ? "← Volver al Login" : "¿No tienes cuenta? Regístrate"}
             </button>
          </div>
        </div>
      </main>

      {/* 3. FOOTER REUTILIZABLE */}
      <Footer />

    </div>
  );
}