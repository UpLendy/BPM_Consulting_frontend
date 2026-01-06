'use client';

import { IngenieroAppointmentCellProps, getAppointmentColor } from './types';
import { getDisplayTime } from '@/app/components/calendar/utils';

/**
 * Cell for Ingeniero's own appointments
 * - Shows appointment time and empresa
 * - Color coded by type (blue for asesoría, purple for auditoría)
 * - Clickable to view full details
 */
export default function IngenieroAppointmentCell({
  appointment,
  onClick,
  className = '',
  isOwn = false
}: IngenieroAppointmentCellProps) {
  // If isOwn is true, use a distinct color (e.g., Emerald/Green), otherwise use type color
  const colorClass = isOwn ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400' : getAppointmentColor(appointment.appointmentType);
  
  return (
    <button
      onClick={() => onClick(appointment)}
      className={`w-full text-left px-2 py-1 text-xs rounded transition-colors text-white ${colorClass} ${className}`}
      title={`${appointment.companyName || 'Empresa'} - ${appointment.description}`}
    >
      <div className="font-medium truncate">
        {getDisplayTime(appointment.startTime)}
      </div>
      <div className="truncate opacity-90">{appointment.companyName}</div>
    </button>
  );
}
