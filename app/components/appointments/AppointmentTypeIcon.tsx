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
    }
  };
  
  const config = iconConfig[type];
  
  return (
    <div className={`flex items-center gap-2 ${className}`} title={config.label}>
      <div className={`p-2 rounded-lg ${config.color}`}>
        {config.icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{config.label}</span>
    </div>
  );
}
