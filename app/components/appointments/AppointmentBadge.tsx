'use client';

import { AppointmentStatus } from '@/app/types';

interface AppointmentBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export default function AppointmentBadge({ status, className = '' }: AppointmentBadgeProps) {
  const badgeStyles = {
    [AppointmentStatus.PENDIENTE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [AppointmentStatus.COMPLETADA]: 'bg-green-100 text-green-800 border-green-300',
    [AppointmentStatus.CANCELADA]: 'bg-red-100 text-red-800 border-red-300'
  };
  
  const badgeLabels = {
    [AppointmentStatus.PENDIENTE]: 'Pendiente',
    [AppointmentStatus.COMPLETADA]: 'Completada',
    [AppointmentStatus.CANCELADA]: 'Cancelada'
  };
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[status]} ${className}`}
    >
      {badgeLabels[status]}
    </span>
  );
}
