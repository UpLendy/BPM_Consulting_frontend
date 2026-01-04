'use client';

import { IngenieroAppointmentCellProps, getAppointmentColor } from './types';

/**
 * Cell for Ingeniero's own appointments
 * - Shows appointment time and empresa
 * - Color coded by type (blue for asesoría, purple for auditoría)
 * - Clickable to view full details
 */
export default function IngenieroAppointmentCell({
  appointment,
  onClick,
  className = ''
}: IngenieroAppointmentCellProps) {
  const colorClass = getAppointmentColor(appointment.tipo);
  
  return (
    <button
      onClick={() => onClick(appointment)}
      className={`w-full text-left px-2 py-1 text-xs rounded transition-colors text-white ${colorClass} ${className}`}
      title={`${appointment.empresaName} - ${appointment.descripcion}`}
    >
      <div className="font-medium truncate">{appointment.horaInicio}</div>
      <div className="truncate opacity-90">{appointment.empresaName}</div>
    </button>
  );
}
