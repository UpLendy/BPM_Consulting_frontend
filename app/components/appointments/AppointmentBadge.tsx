'use client';

import { AppointmentStatus } from '@/app/types';

interface AppointmentBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export default function AppointmentBadge({ status, className = '' }: AppointmentBadgeProps) {
  const badgeStyles = {
    [AppointmentStatus.PROGRAMADA]: 'bg-blue-100 text-blue-800 border-blue-300',
    [AppointmentStatus.CONFIRMADA]: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    [AppointmentStatus.EN_PROGRESO]: 'bg-amber-100 text-amber-800 border-amber-300',
    [AppointmentStatus.EN_REVISION]: 'bg-purple-100 text-purple-800 border-purple-300',
    [AppointmentStatus.COMPLETADA]: 'bg-green-100 text-green-800 border-green-300',
    [AppointmentStatus.CANCELADA]: 'bg-red-100 text-red-800 border-red-300'
  };
  
  const badgeLabels = {
    [AppointmentStatus.PROGRAMADA]: 'Programada',
    [AppointmentStatus.CONFIRMADA]: 'Confirmada',
    [AppointmentStatus.EN_PROGRESO]: 'En Progreso',
    [AppointmentStatus.EN_REVISION]: 'En Revisión',
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
