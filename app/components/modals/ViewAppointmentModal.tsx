import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { Appointment, AppointmentStatus } from '@/app/types';
import { AppointmentBadge, AppointmentTypeIcon } from '@/app/components/appointments';
import { appointmentService } from '@/app/services/appointments/appointmentService';

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
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.name || user.role || '';
        setUserRole(role.toLowerCase());
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
  }, []);

  if (!appointment) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleConfirm = async () => {
    if (!appointment) return;
    
    try {
      setLoading(true);
      await appointmentService.confirmAppointment(appointment.id);
      // Refresh page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Error al confirmar la cita');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmButton = 
    (userRole === 'ingeniero' || userRole === 'engineer') && 
    appointment.status === AppointmentStatus.PROGRAMADA;

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
          <AppointmentTypeIcon type={appointment.appointmentType} />
          <AppointmentBadge status={appointment.status} />
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          <p className="text-base text-gray-900">{appointment.companyName || '-'}</p>
        </div>

        {/* Ingeniero */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingeniero Asignado
          </label>
          <p className="text-base text-gray-900">{appointment.engineerName || '-'}</p>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <p className="text-base text-gray-900 capitalize">{formatDate(appointment.date)}</p>
        </div>

        {/* Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Inicio
            </label>
            <p className="text-base text-gray-900">
                {getDisplayTime(appointment.startTime)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora de Fin
            </label>
            <p className="text-base text-gray-900">
                {getDisplayTime(appointment.endTime)}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <p className="text-base text-gray-900">{appointment.description}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>

          {showConfirmButton && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center gap-2"
            >
              {loading ? (
                <>Wait...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar Asistencia
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
