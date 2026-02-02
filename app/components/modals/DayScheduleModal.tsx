'use client';

import { Appointment } from '@/app/types';
import BaseModal from './BaseModal';
import { getDisplayTime } from '@/app/components/calendar/utils';

interface DayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  appointments: Appointment[];
  onSelectSlot?: (time: string) => void;
  onViewAppointment?: (appointment: Appointment) => void;
  ownedAppointmentIds?: Set<string>;
}

export default function DayScheduleModal({
  isOpen,
  onClose,
  date,
  appointments,
  onSelectSlot,
  onViewAppointment,
  ownedAppointmentIds
}: DayScheduleModalProps) {
  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(apt => {
      const rawDate = (apt as any).date as unknown as string | Date;
      let aptDate: Date;
      if (rawDate instanceof Date) {
          aptDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
      } else {
          const dateString = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
          const [y, m, d] = dateString.split('-').map(Number);
          aptDate = new Date(y, m - 1, d);
      }
      return aptDate.toDateString() === date.toDateString();
  });

  // Filter ONLY OWN appointments for the list view
  const myDayAppointments = ownedAppointmentIds 
    ? dayAppointments.filter(apt => ownedAppointmentIds.has(String(apt.id)))
    : dayAppointments;

  // Generate 1-hour slots for all 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0, 1, ..., 23

  const getSlotStatus = (hour: number) => {
    const appointment = dayAppointments.find(apt => {
        const startStr = getDisplayTime(apt.startTime);
        const endStr = getDisplayTime(apt.endTime);
        if (!startStr || !endStr) return false;
        const startHour = parseInt(startStr.split(':')[0], 10);
        const endHour = parseInt(endStr.split(':')[0], 10);
        return hour >= startHour && hour < endHour;
    });
    return appointment ? { isOccupied: true, appointment } : { isOccupied: false };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agenda del Día - ${formatDate(date)}`}
      size="md"
    >
      <div className="space-y-4 mt-4">
        {/* List of current appointments - ONLY MINE */}
        <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Mis Citas</h3>
            {myDayAppointments.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-2">No tienes citas programadas para este día.</p>
            ) : (
                myDayAppointments.map((apt) => (
                    <button
                        key={apt.id}
                        onClick={() => onViewAppointment && onViewAppointment(apt)}
                        className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between hover:bg-blue-100 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-2 rounded-xl">
                                <span className="text-xs font-black uppercase whitespace-nowrap">
                                    {getDisplayTime(apt.startTime)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-900 truncate">
                                    {apt.description || 'Mi Cita'}
                                </p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                                    {apt.appointmentType}
                                </p>
                            </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-blue-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </button>
                ))
            )}
        </div>

        {/* Available slots - ONLY if onSelectSlot is provided */}
        {onSelectSlot && (
            <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Horarios para Agendar</h3>
                <div className="grid grid-cols-1 gap-2">
                    {hours.map((hour) => {
                        const timeLabel = `${hour}:00 - ${hour + 1}:00`;
                        const startTime = `${hour.toString().padStart(2, '0')}:00`;
                        const { isOccupied } = getSlotStatus(hour);

                        if (isOccupied) {
                            return (
                                <div
                                    key={hour}
                                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center text-gray-400 cursor-not-allowed opacity-60"
                                >
                                    <span className="text-sm font-medium">{timeLabel}</span>
                                    <span className="text-[10px] font-black uppercase">Ocupado</span>
                                </div>
                            );
                        }

                        return (
                            <button
                                key={hour}
                                onClick={() => {
                                    onSelectSlot(startTime);
                                    onClose();
                                }}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-center hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all group"
                            >
                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">
                                    {timeLabel}
                                </span>
                                <span className="text-[10px] font-black uppercase text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Agendar
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </BaseModal>
  );
}
