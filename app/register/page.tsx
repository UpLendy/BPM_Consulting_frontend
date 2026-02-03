'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    id_number: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.register(formData);
      setSuccess(true);
      // Wait a bit to show success message then redirect
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el usuario. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-yellow-400 p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img src="/logoBPM.png" alt="BPM Consulting" className="h-20 w-auto mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-blue-900 mb-1">Registro de Empresa</h1>
          <p className="text-xs text-blue-900 opacity-80 uppercase tracking-wider">BPM Consulting</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-8">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-blue-900">¡Registro Exitoso!</h2>
            <p className="text-blue-900">Tu cuenta ha sido creada. Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-blue-900 px-1 uppercase">Nombre</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-blue-900 px-1 uppercase">Apellido</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Apellido"
                  className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* ID Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-900 px-1 uppercase">Cédula</label>
              <input
                type="text"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                placeholder="Número de identificación"
                className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-900 px-1 uppercase">Email Corporativo</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@empresa.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-900 px-1 uppercase">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full px-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
                minLength={6}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm">
                <p className="text-red-700 text-xs text-center font-medium leading-tight">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-800 disabled:bg-blue-700 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : 'Crear Cuenta'}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-blue-900 opacity-80">
                ¿Ya tienes una cuenta?{' '}
                <a href="/login" className="font-bold border-b border-blue-900 hover:text-blue-700 hover:border-blue-700 transition-colors">
                  Inicia Sesión
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
