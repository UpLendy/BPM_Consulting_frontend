'use client';

import { useState, useMemo, useEffect } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { appointmentService } from '@/app/services/appointments';
import { IngenieroAppointmentCell } from '@/app/components/calendar/cells';
import { ViewAppointmentModal, DayScheduleModal } from '@/app/components/modals';
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
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // New handler for clicking on a day cell
  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
    setDayModalOpen(true);
  };

  // Improved handler to view appointment details
  const handleViewAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setViewModalOpen(true);
  };
  
  // No need for separate OWN check if parent filters for us
  const myAppointments = useMemo(() => {
    return appointments.filter((apt) => !apt.ingenieroId || apt.ingenieroId === ingenieroId);
  }, [appointments, ingenieroId]);

  // Convert appointments to TimeSlots for calendar
  const slots = useMemo(() => {
    return myAppointments.map((apt): TimeSlot => {
      let localDate: Date;
      const rawDate = apt.date as unknown as string | Date;
      
      if (rawDate instanceof Date) {
          localDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
      } else {
          const dateString = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
          const [y, m, d] = dateString.split('-').map(Number);
          localDate = new Date(y, m - 1, d);
      }

      return {
        date: localDate,
        startTime: getDisplayTime(apt.startTime),
        endTime: getDisplayTime(apt.endTime),
        isAvailable: false,
        appointmentId: apt.id,
        isMyAppointment: true 
      };
    });
  }, [myAppointments]);

  // Custom cell renderer for engineer
  const renderDayContent = (date: Date, daySlots: TimeSlot[]) => {
    if (daySlots.length === 0) return null;

    const displaySlots = daySlots.slice(0, 2);
    const remaining = daySlots.length - displaySlots.length;

    return (
      <div className="mt-1 space-y-1">
        {displaySlots.map((slot, idx) => {
          const appointment = myAppointments.find((apt) => String(apt.id) === String(slot.appointmentId));
          if (!appointment) return null;
          
          return (
            <IngenieroAppointmentCell
              key={idx}
              appointment={appointment}
              onClick={handleViewAppointment}
              isOwn={true} 
            />
          );
        })}
        {remaining > 0 && (
            <div className="text-[9px] font-black text-blue-600 uppercase text-center py-1 bg-blue-50/50 rounded-lg border border-blue-100">
                + {remaining} más
            </div>
        )}
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
            onDayClick={handleDayClick}
            slots={slots}
            onSlotClick={(slot) => {
                if (slot.appointmentId) {
                    const apt = myAppointments.find(a => String(a.id) === String(slot.appointmentId));
                    if (apt) handleViewAppointment(apt);
                }
            }}
            renderDayContent={renderDayContent}
          />
        </div>
      </div>

      {/* Modals */}
      <DayScheduleModal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        date={selectedDay}
        appointments={myAppointments}
        onViewAppointment={handleViewAppointment}
        // onSelectSlot is NOT provided here, hiding the booking section
      />

      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
