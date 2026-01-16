'use client';

import { useState, useMemo, useEffect } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { appointmentService } from '@/app/services/appointments';
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
  
  // No need for separate OWN check if parent filters for us
  const myAppointments = useMemo(() => {
    return appointments.filter((apt) => !apt.ingenieroId || apt.ingenieroId === ingenieroId);
  }, [appointments, ingenieroId]);

  // Convert appointments to TimeSlots for calendar
  const slots = useMemo(() => {
    return myAppointments.map((apt): TimeSlot => ({
      date: new Date(apt.date),
      startTime: getDisplayTime(apt.startTime),
      endTime: getDisplayTime(apt.endTime),
      isAvailable: false,
      appointmentId: apt.id,
      isMyAppointment: true 
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
              isOwn={true} // In this view, they are all yours
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
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4">
          <Calendar
            className="h-full w-full shadow-none"
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            slots={slots}
            onSlotClick={handleAppointmentClick}
            renderDayContent={renderDayContent}
          />
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
