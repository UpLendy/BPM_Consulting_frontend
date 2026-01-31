'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isProcessing = false,
  confirmDisabled = false,
  children
}: ConfirmationModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="py-2">
        <div className="mb-6 text-gray-600">
            {message}
        </div>
        
        {children}
        
        <div className="flex justify-end gap-3 mt-4">
            <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {cancelLabel}
            </button>
            <button
                onClick={onConfirm}
                disabled={isProcessing || confirmDisabled}
                className={`px-4 py-2 text-white rounded-lg transition-colors shadow-sm min-w-[100px] flex justify-center font-bold
                    ${isProcessing || confirmDisabled 
                        ? 'bg-gray-300 cursor-not-allowed opacity-70' 
                        : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isProcessing ? (
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : confirmLabel}
            </button>
        </div>
      </div>
    </BaseModal>
  );
}
