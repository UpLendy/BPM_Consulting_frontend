'use client';

import { EmpresarioOccupiedCellProps } from './types';

/**
 * EMPRESARIO: Occupied slot by another company (GRAY)
 * - NOT clickable
 * - Shows only time (NO details about who or what)
 * - Gray to indicate unavailable
 */
export default function EmpresarioOccupiedCell({
  slot,
  className = ''
}: EmpresarioOccupiedCellProps) {
  return (
    <div
      className={`w-full px-2 py-1 text-xs rounded bg-gray-400 text-white cursor-not-allowed ${className}`}
      title="Ocupado - No disponible"
    >
      <div className="font-medium">✗ {slot.startTime}</div>
      <div className="text-[10px] opacity-75">Ocupado</div>
    </div>
  );
}
