'use client';

import { AppointmentType } from '@/app/types';

interface AppointmentTypeIconProps {
  type: AppointmentType;
  className?: string;
}

export default function AppointmentTypeIcon({ type, className = '' }: AppointmentTypeIconProps) {
  const iconConfig = {
    [AppointmentType.ASESORIA]: {
      color: 'text-blue-600 bg-blue-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      label: 'Asesoría'
    },
    [AppointmentType.AUDITORIA]: {
      color: 'text-purple-600 bg-purple-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      label: 'Auditoría'
    },
    [AppointmentType.SEGUIMIENTO]: {
      color: 'text-emerald-600 bg-emerald-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      label: 'Seguimiento'
    },
    [AppointmentType.CAPACITACION]: {
      color: 'text-orange-600 bg-orange-100',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      label: 'Capacitación'
    }
  };

  const config = iconConfig[type];

  if (!config) return null;
  
  return (
    <div className={`flex items-center gap-2 ${className}`} title={config.label}>
      <div className={`p-2 rounded-lg ${config.color}`}>
        {config.icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{config.label}</span>
    </div>
  );
}
