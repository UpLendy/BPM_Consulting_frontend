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

        {(!message || message.type === 'error') ? (
             <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-blue-900 text-center">
                Ingresa tu correo electrónico registrado.
              </p>

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3 pl-10 rounded bg-white text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="absolute left-3 top-3 text-gray-500">📧</span>
              </div>

              {message && (
                <p className="text-red-700 text-sm text-center font-bold bg-white/50 p-2 rounded">{message.text}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 disabled:bg-blue-700 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Enviando...' : 'Recuperar contraseña'}
              </button>

              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-blue-900 hover:text-blue-700 underline font-medium">
                  ← Volver al Login
                </Link>
              </div>
            </form>
        ) : (
            <div className="text-center space-y-6 animate-fade-in">
                <div className="bg-white/90 p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <p className="text-blue-900 text-sm font-medium">{message.text}</p>
                </div>
                 <Link 
                    href="/login" 
                    className="block w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 transition-colors"
                 >
                  Volver al Login
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
