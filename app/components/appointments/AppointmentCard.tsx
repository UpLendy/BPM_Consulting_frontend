'use client';

import { Appointment } from '@/app/types';
import AppointmentBadge from './AppointmentBadge';
import AppointmentTypeIcon from './AppointmentTypeIcon';
import { getDisplayTime } from '@/app/components/calendar/utils';
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
        
        {onEdit && (
          <button
            onClick={() => onEdit(appointment)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Editar
          </button>
        )}
        
        {onDelete && (
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
