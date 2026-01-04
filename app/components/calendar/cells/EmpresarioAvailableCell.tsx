'use client';

import { EmpresarioAvailableCellProps } from './types';

/**
 * EMPRESARIO: Available time slot (GREEN)
 * - Can click to schedule new appointment
 * - Shows time range
 * - Visual indicator that it's available
 */
export default function EmpresarioAvailableCell({
  slot,
  onSchedule,
  className = ''
}: EmpresarioAvailableCellProps) {
  return (
    <button
      onClick={() => onSchedule(slot)}
      className={`w-full text-left px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 transition-colors text-white ${className}`}
      title="Disponible - Click para agendar"
    >
      <div className="font-medium">✓ {slot.startTime}</div>
      <div className="text-[10px] opacity-90">Disponible</div>
    </button>
  );
}
