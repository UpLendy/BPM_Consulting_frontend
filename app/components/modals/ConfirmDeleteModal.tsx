'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showReasonField?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Eliminación',
  message = '¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  showReasonField = false,
  reasonLabel = 'Motivo de cancelación',
  reasonPlaceholder = 'Escribe el motivo de la cancelación...',
  reasonRequired = true
}: ConfirmDeleteModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleConfirm = () => {
    if (showReasonField && reasonRequired && !reason.trim()) {
      setReasonError('Debes indicar un motivo');
      return;
    }
    onConfirm(showReasonField ? reason.trim() : undefined);
    setReason('');
    setReasonError('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    setReasonError('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
    >
      <div className="space-y-5">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-gray-700 text-sm">
          {message}
        </p>

        {/* Reason Field */}
        {showReasonField && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              {reasonLabel} {reasonRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError('');
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              className={`w-full border ${reasonError ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-100'} rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-4 focus:border-blue-500 outline-none transition-all resize-none`}
            />
            {reasonError && (
              <p className="text-xs text-red-500 font-medium mt-1">{reasonError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
