import React, { useState } from "react";
import { Button, Input } from "./ui/shim";
import { UniversityLogo } from "./UniversityLogo"; // Asumo que tienes este o usa un div simple

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "admin@uce.edu.ec" && password === "admin") {
      onLogin('admin');
    } else if (email) {
      onLogin('user');
    } else {
      setError("Ingresa un correo válido");
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#D9232D]">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#D9232D] rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            UCE
          </div>
          <h1 className="text-[#1e3a8a] text-2xl font-bold mb-2">Universidad Central</h1>
          <p className="text-gray-500 text-sm">Mapa Interactivo 3D</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Institucional</label>
            <Input
              type="email"
              placeholder="usuario@uce.edu.ec"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <Button type="submit" className="w-full h-11 text-base shadow-red-200">
            Iniciar Sesión
          </Button>

          <div className="p-4 bg-blue-50 rounded-xl text-xs text-blue-800 space-y-2 border border-blue-100">
            <p><strong>Admin Demo:</strong> admin@uce.edu.ec / admin</p>
            <p><strong>Usuario:</strong> Cualquier otro correo</p>
          </div>
        </form>
      </div>
    </div>
  );
}