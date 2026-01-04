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
  const [formData, setFormData] = useState<CreateAppointmentDTO>({
    empresaId: empresarioId || '',
    ingenieroId: ingenieroId || '',
    fecha: prefilledDate || new Date(),
    horaInicio: prefilledTime || '09:00',
    horaFin: '',
    descripcion: '',
    tipo: AppointmentType.ASESORIA
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresaId) newErrors.empresaId = 'Empresa es requerida';
    if (!formData.ingenieroId) newErrors.ingenieroId = 'Ingeniero es requerido';
    if (!formData.horaInicio) newErrors.horaInicio = 'Hora de inicio es requerida';
    if (!formData.horaFin) newErrors.horaFin = 'Hora de fin es requerida';
    if (!formData.descripcion) newErrors.descripcion = 'Descripción es requerida';

    // Validate time range
    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        newErrors.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      empresaId: empresarioId || '',
      ingenieroId: ingenieroId || '',
      fecha: prefilledDate || new Date(),
      horaInicio: prefilledTime || '09:00',
      horaFin: '',
      descripcion: '',
      tipo: AppointmentType.ASESORIA
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
              onClick={() => setFormData({ ...formData, tipo: AppointmentType.ASESORIA })}
              className={`p-3 border-2 rounded-lg transition-colors ${
                formData.tipo === AppointmentType.ASESORIA
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">Asesoría</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipo: AppointmentType.AUDITORIA })}
              className={`p-3 border-2 rounded-lg transition-colors ${
                formData.tipo === AppointmentType.AUDITORIA
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
            value={formData.fecha.toISOString().split('T')[0]}
            onChange={(e) => setFormData({ ...formData, fecha: new Date(e.target.value) })}
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
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.horaInicio ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.horaInicio && (
              <p className="mt-1 text-xs text-red-600">{errors.horaInicio}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Fin *
            </label>
            <input
              type="time"
              value={formData.horaFin}
              onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.horaFin ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.horaFin && (
              <p className="mt-1 text-xs text-red-600">{errors.horaFin}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.descripcion ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe el motivo de la cita..."
            required
          />
          {errors.descripcion && (
            <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>
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
