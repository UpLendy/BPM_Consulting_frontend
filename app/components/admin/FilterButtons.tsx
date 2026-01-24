'use client';

import { AppointmentStatus, AppointmentType } from '@/app/types';

interface FilterButtonsProps {
  selectedStatus: AppointmentStatus | 'all';
  selectedType: AppointmentType | 'all';
  onStatusChange: (status: AppointmentStatus | 'all') => void;
  onTypeChange: (type: AppointmentType | 'all') => void;
  appointmentCounts?: {
    all: number;
    programada: number;
    confirmada: number;
    en_progreso: number;
    completada: number;
    cancelada: number;
    asesoria: number;
    auditoria: number;
    seguimiento: number;
  };
}

export default function FilterButtons({
  selectedStatus,
  selectedType,
  onStatusChange,
  onTypeChange,
  appointmentCounts
}: FilterButtonsProps) {
  const statusFilters = [
    { value: 'all' as const, label: 'Todas', count: appointmentCounts?.all },
    { value: AppointmentStatus.PROGRAMADA, label: 'Programadas', count: appointmentCounts?.programada },
    { value: AppointmentStatus.CONFIRMADA, label: 'Confirmadas', count: appointmentCounts?.confirmada },
    { value: AppointmentStatus.EN_PROGRESO, label: 'En Progreso', count: appointmentCounts?.en_progreso },
    { value: AppointmentStatus.COMPLETADA, label: 'Completadas', count: appointmentCounts?.completada },
    { value: AppointmentStatus.CANCELADA, label: 'Canceladas', count: appointmentCounts?.cancelada }
  ];

  const typeFilters = [
    { value: 'all' as const, label: 'Todos los tipos' },
    { value: AppointmentType.ASESORIA, label: 'Asesorías', count: appointmentCounts?.asesoria },
    { value: AppointmentType.AUDITORIA, label: 'Auditorías', count: appointmentCounts?.auditoria },
    { value: AppointmentType.SEGUIMIENTO, label: 'Seguimiento', count: appointmentCounts?.seguimiento }
  ];

  return (
    <div className="space-y-4">
      {/* Status Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado
        </label>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={`status-${filter.value}`}
              onClick={() => onStatusChange(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label}
              {typeof filter.count === 'number' && (
                <span className={`ml-1.5 ${
                  selectedStatus === filter.value ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  ({filter.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Cita
        </label>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <button
              key={`type-${filter.value}`}
              onClick={() => onTypeChange(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === filter.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label}
              {typeof filter.count === 'number' && (
                <span className={`ml-1.5 ${
                  selectedType === filter.value ? 'text-purple-200' : 'text-gray-500'
                }`}>
                  ({filter.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
