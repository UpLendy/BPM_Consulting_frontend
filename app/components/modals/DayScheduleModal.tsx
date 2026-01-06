'use client';

import { Appointment } from '@/app/types';
import BaseModal from './BaseModal';
import { getDisplayTime } from '@/app/components/calendar/utils';

interface DayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  appointments: Appointment[];
  onSelectSlot: (time: string) => void;
}

export default function DayScheduleModal({
  isOpen,
  onClose,
  date,
  appointments,
  onSelectSlot
}: DayScheduleModalProps) {
  // Generate 1-hour slots from 8:00 to 17:00 (5 PM)
  // Last booking slot at 16:00? Or 17:00? "jornada de 8 a 5". Usually means work ends at 5.
  // So slots are 8-9, 9-10... 16-17.
  const hours = Array.from({ length: 9 }, (_, i) => i + 8); // 8, 9, ... 16

  const getSlotStatus = (hour: number) => {
    // Check if any appointment overlaps with this hour ON THIS DAY
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    // Filter appointments for the selected date
    const dayAppointments = appointments.filter(apt => {
        // apt.date might be string "2026-01-08". 
        // new Date("2026-01-08") is UTC -> Previous day in latam.
        // Force local parsing by appending time or splitting.
        // If apt.date is YYYY-MM-DD string:
        const rawDate = apt.date as unknown as string | Date;
        const dateString = rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
        const [y, m, d] = dateString.split('-').map(Number);
        // Create date in local time
        const aptDate = new Date(y, m - 1, d);
        
        return aptDate.toDateString() === date.toDateString();
    });

    const appointment = dayAppointments.find(apt => {
        // Parse ISO string to get local hour via strict string parsing (Fake UTC strategy)
        // startTime: "2026-01-08T09:00:00.000Z" -> "09:00" -> 9
        const startStr = getDisplayTime(apt.startTime);
        const endStr = getDisplayTime(apt.endTime);
        
        if (!startStr || !endStr) return false;

        const startHour = parseInt(startStr.split(':')[0], 10);
        const endHour = parseInt(endStr.split(':')[0], 10);

        // Check availability
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
      title={`Horarios Disponibles - ${formatDate(date)}`}
      size="md"
    >
      <div className="space-y-2 mt-4">
        {hours.map((hour) => {
          const timeLabel = `${hour}:00 - ${hour + 1}:00`;
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const { isOccupied, appointment } = getSlotStatus(hour);

          if (isOccupied) {
            return (
              <div
                key={hour}
                className="p-3 bg-gray-100 border border-gray-200 rounded-lg flex justify-between items-center text-gray-500 cursor-not-allowed"
              >
                <span className="font-medium">{timeLabel}</span>
                <span className="text-sm">Ocupado</span>
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
              className="w-full p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all group"
            >
              <span className="font-medium text-gray-700 group-hover:text-blue-600">
                {timeLabel}
              </span>
              <span className="text-sm text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Agendar
              </span>
            </button>
          );
        })}
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
