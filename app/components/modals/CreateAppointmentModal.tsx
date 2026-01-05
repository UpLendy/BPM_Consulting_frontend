'use client';

import { useState } from 'react';
import BaseModal from './BaseModal';
import { CreateAppointmentDTO, AppointmentType } from '@/app/types';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointmentDTO) => void;
  prefilledDate?: Date;
  prefilledTime?: string;
  empresarioId?: string;
  ingenieroId?: string;
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledDate,
  prefilledTime,
  empresarioId,
  ingenieroId
}: CreateAppointmentModalProps) {
  // Internal state for form handling (separate from DTO structure slightly for easier input handling)
  const [formState, setFormState] = useState({
    date: prefilledDate || new Date(),
    startTime: prefilledTime || '09:00',
    endTime: '',
    description: '',
    appointmentType: AppointmentType.ASESORIA,
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.startTime) newErrors.startTime = 'Hora de inicio es requerida';
    if (!formState.endTime) newErrors.endTime = 'Hora de fin es requerida';
    if (!formState.description) newErrors.description = 'Descripción es requerida';
    if (!formState.location) newErrors.location = 'Ubicación es requerida';

    // Validate time range
    if (formState.startTime && formState.endTime) {
      if (formState.startTime >= formState.endTime) {
        newErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Convert to DTO format
      const dateStr = formState.date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Construct ISO strings for start and end time
      // Assuming formState.date is the day, combining with time strings
      const startDateTime = new Date(`${dateStr}T${formState.startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${formState.endTime}:00`);

      const dto: CreateAppointmentDTO = {
        description: formState.description,
        appointmentType: formState.appointmentType,
        date: dateStr,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formState.location,
        empresaId: empresarioId,
        ingenieroId: ingenieroId
      };

      onSubmit(dto);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormState({
      date: prefilledDate || new Date(),
      startTime: prefilledTime || '09:00',
      endTime: '',
      description: '',
      appointmentType: AppointmentType.ASESORIA,
      location: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agendar Nueva Cita"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Cita */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Cita *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormState({ ...formState, appointmentType: AppointmentType.ASESORIA })}
              className={`p-3 border-2 rounded-lg transition-colors ${
                formState.appointmentType === AppointmentType.ASESORIA
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">Asesoría</span>
            </button>
            <button
              type="button"
              onClick={() => setFormState({ ...formState, appointmentType: AppointmentType.AUDITORIA })}
              className={`p-3 border-2 rounded-lg transition-colors ${
                formState.appointmentType === AppointmentType.AUDITORIA
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">Auditoría</span>
            </button>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha *
          </label>
          <input
            type="date"
            value={formState.date.toISOString().split('T')[0]}
            onChange={(e) => setFormState({ ...formState, date: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Inicio *
            </label>
            <input
              type="time"
              value={formState.startTime}
              onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.startTime && (
              <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Fin *
            </label>
            <input
              type="time"
              value={formState.endTime}
              onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación *
          </label>
          <input
            type="text"
            value={formState.location}
            onChange={(e) => setFormState({ ...formState, location: e.target.value })}
            placeholder="Ej: Planta principal, Sala de juntas, etc."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.location && (
            <p className="mt-1 text-xs text-red-600">{errors.location}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe el motivo de la cita..."
            required
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agendar Cita
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
