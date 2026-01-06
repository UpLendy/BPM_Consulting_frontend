'use client';

import { useState, useMemo } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { IngenieroAppointmentCell } from '@/app/components/calendar/cells';
import { ViewAppointmentModal } from '@/app/components/modals';
import { Appointment, TimeSlot } from '@/app/types';

interface IngenieroCalendarViewProps {
  ingenieroId: string;
  appointments: Appointment[]; // All appointments, will be filtered
}

export default function IngenieroCalendarView({
  ingenieroId,
  appointments
}: IngenieroCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filter appointments: ONLY for this engineer
  const myAppointments = useMemo(() => {
    // If ingenieroId not present in appointment object, assume all passed appointments are for this engineer (if fetch was specific)
    return appointments.filter((apt) => !apt.ingenieroId || apt.ingenieroId === ingenieroId);
  }, [appointments, ingenieroId]);

  // Convert appointments to TimeSlots for calendar
  // Convert appointments to TimeSlots for calendar
  const slots = useMemo(() => {
    return myAppointments.map((apt): TimeSlot => ({
      date: new Date(apt.date),
      startTime: getDisplayTime(apt.startTime),
      endTime: getDisplayTime(apt.endTime),
      isAvailable: false,
      appointmentId: apt.id,
      isMyAppointment: true // Always true for engineer viewing their own
    }));
  }, [myAppointments]);

  // Handler for clicking on appointment
  const handleAppointmentClick = (slot: TimeSlot) => {
    if (slot.appointmentId) {
      const appointment = myAppointments.find((apt) => apt.id === slot.appointmentId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setViewModalOpen(true);
      }
    }
  };

  // Custom cell renderer for engineer
  const renderDayContent = (date: Date, daySlots: TimeSlot[]) => {
    if (daySlots.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {daySlots.map((slot, idx) => {
          const appointment = myAppointments.find((apt) => apt.id === slot.appointmentId);
          if (!appointment) return null;

          return (
            <IngenieroAppointmentCell
              key={idx}
              appointment={appointment}
              onClick={() => handleAppointmentClick(slot)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mis Citas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualiza tus citas asignadas
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{myAppointments.length}</p>
              <p className="text-xs text-gray-600">Total de citas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Calendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            slots={slots}
            onSlotClick={handleAppointmentClick}
            renderDayContent={renderDayContent}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">Asesoría</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-700">Auditoría</span>
          </div>
          <div className="ml-auto text-gray-500">
            Click en una cita para ver detalles
          </div>
        </div>
      </div>

      {/* Modal */}
      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
