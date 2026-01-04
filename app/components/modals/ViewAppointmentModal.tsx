'use client';

import BaseModal from './BaseModal';
import { Appointment } from '@/app/types';
import { AppointmentBadge, AppointmentTypeIcon } from '@/app/components/appointments';

interface ViewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export default function ViewAppointmentModal({
  isOpen,
  onClose,
  appointment
}: ViewAppointmentModalProps) {
  if (!appointment) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Cita"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with Type and Status */}
        <div className="flex items-center justify-between">
          <AppointmentTypeIcon type={appointment.tipo} />
          <AppointmentBadge status={appointment.estado} />
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <p className="text-base text-gray-900">{appointment.empresaName}</p>
        </div>

        {/* Ingeniero */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingeniero Asignado
          </label>
          <p className="text-base text-gray-900">{appointment.ingenieroName}</p>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <p className="text-base text-gray-900 capitalize">{formatDate(appointment.fecha)}</p>
        </div>

        {/* Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Inicio
            </label>
            <p className="text-base text-gray-900">{appointment.horaInicio}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Fin
            </label>
            <p className="text-base text-gray-900">{appointment.horaFin}</p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <p className="text-base text-gray-900">{appointment.descripcion}</p>
        </div>

        {/* Creado por */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Creado el: {new Date(appointment.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
