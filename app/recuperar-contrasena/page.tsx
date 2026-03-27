'use client';

import { useState } from 'react';
import { authService } from '@/app/services/authService';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await authService.forgotPassword(email);
      setMessage({
        type: 'success',
        text: 'Si el correo existe, recibirás un mensaje con tu nueva contraseña.'
      });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-yellow-400 p-12 rounded-lg shadow-xl w-96">
        <div className="text-center mb-8">
          <img src="/logoBPM.png" alt="BPM Consulting" className="h-20 w-auto mx-auto" />
          <h2 className="text-lg font-bold text-blue-900 mt-4">RECUPERAR CONTRASEÑA</h2>
        </div>

          <div className="text-center space-y-4">
            <div className="bg-white/80 p-4 rounded-lg border border-yellow-500 shadow-sm">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-blue-900 text-sm font-bold">
                Opción Deshabilitada Temporalmente
              </p>
              <p className="text-blue-800 text-xs mt-2">
                Por favor, contacta al administrador para gestionar el acceso a tu cuenta.
              </p>
            </div>
            <Link 
              href="/login" 
              className="block w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 transition-colors"
            >
              Volver al Login
            </Link>
          </div>
      </div>
    </div>
  );
}
