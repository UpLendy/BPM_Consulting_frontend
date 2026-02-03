'use client';

import { Appointment } from '@/app/types';
import AppointmentBadge from './AppointmentBadge';
import AppointmentTypeIcon from './AppointmentTypeIcon';
import { getDisplayTime, getSafeLocalDate } from '@/app/components/calendar/utils';
import { formatShortDate } from '@/app/utils/dateUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  onView?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  className?: string;
}

export default function AppointmentCard({
  appointment,
  onView,
  onEdit,
  onDelete,
  className = ''
}: AppointmentCardProps) {
  const formatDate = (date: any) => {
    return formatShortDate(date);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header: Type Icon + Title + Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <AppointmentTypeIcon type={appointment.appointmentType} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Cita para {appointment.companyName || 'Empresa'}
          </h3>
        </div>
        <AppointmentBadge status={appointment.status} />
      </div>
      
      {/* Content: Details */}
      <div className="space-y-2 mb-4">
        {/* Ingeniero */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span><strong>Ingeniero:</strong> {appointment.engineerName || 'No asignado'}</span>
        </div>
        
        {/* Fecha */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span><strong>Fecha:</strong> {formatDate(appointment.date)}</span>
        </div>
        
        {/* Hora */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span><strong>Hora:</strong> {getDisplayTime(appointment.startTime)} - {getDisplayTime(appointment.endTime)}</span>
        </div>
        
        {/* Descripción */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          <span><strong>Descripción:</strong> {appointment.description}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        {onView && (
          <button
            onClick={() => onView(appointment)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Ver
          </button>
        )}
        
        {onEdit && (appointment.status === 'PROGRAMADA' || appointment.status === 'CONFIRMADA') && (() => {
          // Use the safe utility to get the real local time of the appointment
          const appointmentDate = getSafeLocalDate(appointment.startTime);
          const now = new Date();
          
          const diffMs = appointmentDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          
          // Use 1.01 hours (60.6 min) instead of exactly 1 to avoid rounding edge cases
          // that might trigger the backend's strict 60m check before the UI blocks it.
          const isEditable = diffHours >= 1;

          return (
            <div className="relative group">
              {/* Tooltip on hover only */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 font-bold shadow-xl pointer-events-none">
                {isEditable ? 'Edición disponible (hasta 1h antes)' : 'Edición bloqueada (máx 1h antes)'}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-gray-900 rotate-45"></div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditable) onEdit(appointment);
                }}
                disabled={!isEditable}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 border-2 ${
                  isEditable 
                    ? 'text-blue-700 bg-white border-blue-100 hover:border-blue-600 hover:shadow-md' 
                    : 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed grayscale'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            </div>
          );
        })()}
        
        {onDelete && appointment.status !== 'COMPLETADA' && appointment.status !== 'CANCELADA' && (
          <button
            onClick={() => onDelete(appointment)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
