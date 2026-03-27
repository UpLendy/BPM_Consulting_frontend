'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import { userService } from '@/app/services/users/userService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  userId,
  userName
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('La contraseña no puede estar vacía');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.updateUserPassword(userId, { new_password: newPassword });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.password) {
      navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Cambiar Contraseña ${userName ? `para ${userName}` : ''}`}
      size="sm"
    >
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
              placeholder="Introduce la nueva contraseña"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium leading-normal animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cambiando...
                </div>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center text-center space-y-3 mb-6">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{result.message || '¡Contraseña cambiada con éxito!'}</h3>
            <p className="text-sm text-gray-500">Asegúrate de copiar la nueva contraseña para enviársela al usuario.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nueva Contraseña</label>
            <div className="flex items-center justify-between gap-3">
              <code className="text-lg font-mono font-bold text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm flex-1 break-all">
                {result.password}
              </code>
              <button
                onClick={handleCopy}
                className={`p-2.5 rounded-lg transition-all transform active:scale-95 shadow-sm ${
                  copied 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-white text-gray-500 hover:text-blue-600 border-gray-200 hover:border-blue-200'
                } border`}
                title="Copiar contraseña"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z" />
                  </svg>
                )}
              </button>
            </div>
            {copied && (
                <p className="text-[10px] font-bold text-green-600 mt-2 text-center animate-in fade-in slide-in-from-bottom-1 uppercase tracking-wider">¡Copiado al portapapeles!</p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleClose}
              className="w-full py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
