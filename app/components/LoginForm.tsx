'use client';

import { useState } from 'react';
import { authService } from '@/app/services/authService';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      // Guardar token
      localStorage.setItem('token', response.token);
      
      // Guardar user data
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect a gestión de citas
      window.location.href = '/gestion-citas';
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-yellow-400 p-12 rounded-lg shadow-xl w-96">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900">BPM<span className="font-light">Consulting</span></h1>
          <p className="text-xs text-blue-900 mt-2">LÍDERES DEL EJE CAFETERO</p>
          <p className="text-xs text-blue-900">Un camino sin parar a la industria alimentaria</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Usuario */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 pl-10 rounded bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="absolute left-3 top-3 text-gray-500">👤</span>
          </div>

          {/* Campo Contraseña */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="**********"
              className="w-full px-4 py-3 pl-10 rounded bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="absolute left-3 top-3 text-gray-500">🔒</span>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-700 text-sm text-center">{error}</p>
          )}

          {/* Botón Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 disabled:bg-blue-700 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Cargando...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}