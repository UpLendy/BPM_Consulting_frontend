'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';
import Link from 'next/link';

// Componente interno para manejar searchParams dentro de Suspense
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'none' | 'success' | 'error', message: string }>({ type: 'none', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
        setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
        return;
    }

    if (newPassword.length < 6) {
        setStatus({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
    }

    if (!token) {
        setStatus({ type: 'error', message: 'Token de recuperación inválido o faltante.' });
        return;
    }

    setIsLoading(true);
    setStatus({ type: 'none', message: '' });

    try {
      await authService.resetPassword({
        token,
        newPassword,
        confirmPassword
      });
      
      setStatus({ 
        type: 'success', 
        message: '¡Contraseña actualizada correctamente!' 
      });
      
      // Delay redirect slightly so user sees success message
      setTimeout(() => {
          router.push('/login');
      }, 3000);

    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || 'Error al restablecer la contraseña. El enlace puede haber expirado.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
      return (
        <div className="text-center">
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> Enlace inválido. Asegúrate de copiar el enlace completo del correo.</span>
            </div>
            <Link href="/login" className="text-blue-900 underline font-medium">Volver al inicio</Link>
        </div>
      );
  }

  if (status.type === 'success') {
      return (
        <div className="text-center space-y-6 animate-fade-in">
             <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                <strong className="font-bold">¡Éxito! </strong>
                <span className="block sm:inline">{status.message}</span>
            </div>
             <p className="text-gray-600">Redirigiendo al login...</p>
             <Link 
                href="/login" 
                className="block w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 transition-colors mt-4"
             >
               Ir al Login ahora
            </Link>
        </div>
      );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-blue-900 text-center">
        Ingresa tu nueva contraseña a continuación.
        </p>

        {/* Nueva Contraseña */}
        <div className="relative">
        <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full px-4 py-3 pl-10 rounded bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
        />
        <span className="absolute left-3 top-3 text-gray-500">🔒</span>
        </div>

        {/* Confirmar Contraseña */}
        <div className="relative">
        <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full px-4 py-3 pl-10 rounded bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
        />
        <span className="absolute left-3 top-3 text-gray-500">🔐</span>
        </div>

        {status.type === 'error' && (
        <p className="text-red-700 text-sm text-center font-bold bg-white/50 p-2 rounded">{status.message}</p>
        )}

        <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 disabled:bg-blue-700 disabled:cursor-not-allowed transition-colors"
        >
        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
    </form>
  );
}

// Página Principal con Suspense
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-yellow-400 p-12 rounded-lg shadow-xl w-96">
        <div className="text-center mb-8">
          <img src="/logoBPM.png" alt="BPM Consulting" className="h-20 w-auto mx-auto" />
          <h2 className="text-lg font-bold text-blue-900 mt-4">NUEVA CONTRASEÑA</h2>
        </div>

        <Suspense fallback={<div className="text-center font-bold text-blue-900">Cargando...</div>}>
            <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
