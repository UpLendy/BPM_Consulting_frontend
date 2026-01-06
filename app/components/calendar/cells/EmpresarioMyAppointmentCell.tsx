'use client';

import { EmpresarioMyAppointmentCellProps } from './types';

/**
 * EMPRESARIO: Their own appointment (BLUE)
 * - Clickable to view full details
 * - Shows time and description
 * - Different color to distinguish from available/occupied
 */
export default function EmpresarioMyAppointmentCell({
  appointment,
  slot,
  onView,
  className = ''
}: EmpresarioMyAppointmentCellProps) {
  return (
    <button
      onClick={() => onView(appointment)}
      className={`w-full text-left px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 transition-colors text-white ${className}`}
      title={`Mi cita: ${appointment.description}`}
    >
      <div className="font-medium">📅 {slot.startTime}</div>
      <div className="text-[10px] opacity-90 truncate">Mi cita</div>
    </button>
  );
}
