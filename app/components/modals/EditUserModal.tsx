'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { UpdateUserDTO, UserBackend } from '@/app/types';
import { userService } from '@/app/services/users/userService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  currentData?: Partial<UserBackend>;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  currentData
}: EditUserModalProps) {
  const [formState, setFormState] = useState<UpdateUserDTO>({
    email: '',
    first_name: '',
    last_name: '',
    id_number: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch and populate form with user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!isOpen || !userId) return;
      
      try {
        // Fetch all users and find the one we need
        const users = await userService.getAllUsers();
        const user = users.find((u: any) => u.id === userId);
        
        if (user) {
          setFormState({
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            id_number: user.id_number || ''
          });
        } else if (currentData && Object.keys(currentData).length > 0) {
          // Fallback to currentData if provided
          setFormState({
            email: currentData.email || '',
            first_name: currentData.first_name || '',
            last_name: currentData.last_name || '',
            id_number: currentData.id_number || ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to currentData if API fails
        if (currentData) {
          setFormState({
            email: currentData.email || '',
            first_name: currentData.first_name || '',
            last_name: currentData.last_name || '',
            id_number: currentData.id_number || ''
          });
        }
      }
      
      setErrors({});
    };
    
    loadUserData();
  }, [isOpen, userId, currentData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formState.first_name && formState.first_name.length < 2) {
      newErrors.first_name = 'Mínimo 2 caracteres';
    }

    if (formState.last_name && formState.last_name.length < 2) {
      newErrors.last_name = 'Mínimo 2 caracteres';
    }

    if (formState.id_number && formState.id_number.length !== 10) {
      newErrors.id_number = 'Debe tener 10 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    try {
      // Only send fields that are filled
      const updateData: UpdateUserDTO = {};
      if (formState.email && formState.email !== currentData?.email) {
        updateData.email = formState.email;
      }
      if (formState.first_name && formState.first_name !== currentData?.first_name) {
        updateData.first_name = formState.first_name;
      }
      if (formState.last_name && formState.last_name !== currentData?.last_name) {
        updateData.last_name = formState.last_name;
      }
      if (formState.id_number && formState.id_number !== currentData?.id_number) {
        updateData.id_number = formState.id_number;
      }

      await userService.updateUser(userId, updateData);
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.message || 'Error al actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormState({
      email: '',
      first_name: '',
      last_name: '',
      id_number: ''
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuario"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={formState.first_name}
            onChange={(e) => setFormState({ ...formState, first_name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido *
          </label>
          <input
            type="text"
            value={formState.last_name}
            onChange={(e) => setFormState({ ...formState, last_name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.last_name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
          )}
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Identificación *
          </label>
          <input
            type="text"
            value={formState.id_number}
            onChange={(e) => setFormState({ ...formState, id_number: e.target.value })}
            maxLength={10}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.id_number ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.id_number && (
            <p className="mt-1 text-xs text-red-600">{errors.id_number}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar Usuario'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
