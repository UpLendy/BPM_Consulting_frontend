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
  const [statusError, setStatusError] = useState<string | null>(null);

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
      setStatusError(null);
      await appointmentService.confirmAppointment(appointment.id);
      // Refresh page to show updated status
      window.location.reload();
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      setStatusError(error.message || 'Error al confirmar la cita');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmButton = 
    (userRole === 'ingeniero' || userRole === 'engineer') && 
    appointment.status === AppointmentStatus.PROGRAMADA;

  const handleStart = async () => {
    if (!appointment) return;
    try {
      setLoading(true);
      setStatusError(null);
      await appointmentService.startAppointment(appointment.id);
      window.location.reload();
    } catch (error: any) {
      console.error('Error starting appointment:', error);
      setStatusError(error.message || 'Error al iniciar la cita');
    } finally {
      setLoading(false);
    }
  };

  const showStartButton =
    (userRole === 'ingeniero' || userRole === 'engineer') &&
    appointment.status === AppointmentStatus.CONFIRMADA;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Cita"
      size="lg"
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {statusError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  {statusError}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setStatusError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Start Appointment Button (Visible if CONFIRMADA) */}
          {showStartButton && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
            >
              {loading ? (
                <>Wait...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Iniciar Visita
                </>
              )}
            </button>
          )}    
        </div>
      </div>
    </BaseModal>
  );
}
