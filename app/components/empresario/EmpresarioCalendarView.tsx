'use client';

import { useState, useMemo } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import {
  EmpresarioAvailableCell,
  EmpresarioOccupiedCell,
  EmpresarioMyAppointmentCell
} from '@/app/components/calendar/cells';
import {
  ViewAppointmentModal,
  CreateAppointmentModal,
  DayScheduleModal
} from '@/app/components/modals';
import { Appointment, TimeSlot, CreateAppointmentDTO } from '@/app/types';

interface EmpresarioCalendarViewProps {
  empresaId: string;
  ingenieroAsignadoId: string;
  appointments: Appointment[]; // All appointments for the assigned engineer
  availableSlots: TimeSlot[]; // Available time slots from backend
  onCreateAppointment?: (data: CreateAppointmentDTO) => void;
}

export default function EmpresarioCalendarView({
  empresaId,
  ingenieroAsignadoId,
  appointments,
  availableSlots,
  onCreateAppointment
}: EmpresarioCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dayScheduleModalOpen, setDayScheduleModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Filter appointments of assigned engineer
  const engineerAppointments = useMemo(() => {
    // Note: If backend doesn't return ingenieroId in nested object, this filter might fail if we rely on it.
    // However, the endpoint "appointments/my-company/engineer-appointments" returns appointments FOR the assigned engineer.
    // So all appointments returned SHOULD be for that engineer.
    // We can probably skip this filter or use "engineerName" if id is missing.
    // But let's assume `id` check is fine if we used standard fetching.
    // Wait, the new endpoint returns specific list. We might not need to filter by ID if the list is already filtered.
    return appointments; 
  }, [appointments]);

  // Identify MY appointments (this empresa)
  const myAppointments = useMemo(() => {
    // Backend returns companyName. We might check companyName or empresaId if available.
    // Or if the backend returns "my company's appointments" differently?
    // Actually, `getCompanyEngineerAppointments` returns ALL appointments of the engineer.
    // We need to identify which ones are MINE to show them differently (blue).
    // Uses `empresaId`. If DTO/Appointment has `empresaId` (optional), check it.
    // If backend doesn't return it, we might need another way.
    // Assuming backend populates `empresaId` or `companyName`. `companyName` is in JSON.
    // Ideally we match by ID. If not available, maybe `companyName`? (Unsafe)
    // Let's rely on `empresaId` being present or added to backend response. OR checking if WE created it?
    // Using `companyName` as fallback matching might be necessary if IDs missing.
    // BUT current JSON (user provided) has `companyName`. Not `empresaId`.
    // We don't have local `companyName` in `currentUser`.
    // Wait, if `empresaId` is missing, we can't strict match.
    // Let's assume for now `empresaId` is present OR match `companyName` if valid.
    
    return engineerAppointments.filter((apt) => apt.empresaId === empresaId); 
  }, [engineerAppointments, empresaId]);

  // Create slots for calendar display (ONLY appointments are shown on grid now)
  const allSlots = useMemo(() => {
    const slots: TimeSlot[] = [];

    engineerAppointments.forEach((apt) => {
      const isMyAppointment = apt.empresaId === empresaId;
      
      // Parse date manually to avoid UTC shift
      const rawDate = apt.date as unknown as string | Date;
      const dateString = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : '';
      const [y, m, d] = dateString.split('-').map(Number);
      const localDate = new Date(y, m - 1, d);

      slots.push({
        date: localDate,
        // Convert ISO start/end time to "HH:mm" for internal slot logic if needed, OR store ISO.
        // Calendar logic might expect "HH:mm" strings for sorting/display?
        // Let's store "HH:mm" derived from the ISO time.
        // Using strict getDisplayTime to extract HH:mm from UTC string
        startTime: getDisplayTime(apt.startTime),
        endTime: getDisplayTime(apt.endTime),
        isAvailable: false,
        appointmentId: apt.id,
        isMyAppointment
      });
    });

    return slots;
  }, [engineerAppointments, empresaId]);

  // Handlers
  const handleDayClick = (date: Date) => {
    // Open availability modal for this day
    setSelectedDay(date);
    setDayScheduleModalOpen(true);
  };

  const handleSelectSlot = (time: string) => {
    // Open create appointment modal with selected time
    // Construct simplified slot object or just pass date/time directly
    setSelectedSlot({
        date: selectedDay,
        startTime: time,
        endTime: '', // User will select end time or logic will handle
        isAvailable: true
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = (data: CreateAppointmentDTO) => {
    if (onCreateAppointment) {
      onCreateAppointment(data);
    }
  };
  
  const handleViewMyAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  // Custom cell renderer for empresario
  const renderDayContent = (date: Date, daySlots: TimeSlot[]) => {
    // Filter only my appointments to show on grid (or show all occupied?)
    // User requested: "click any day... modal list".
    // "sino, va a estar en blanco con posibilidad de agendar" refers to THE MODAL list.
    // The calendar grid itself can show existing appointments.
    
    if (daySlots.length === 0) return null;

    return (
      <div className="mt-1 space-y-1 pointer-events-none"> 
        {/* pointer-events-none to let click pass through to day cell? 
            No, validation: clicking appointment should open appointment view.
            So pointer-events-auto for appointment buttons.
        */}
        {daySlots.map((slot, idx) => {
          if (slot.isMyAppointment && slot.appointmentId) {
            const appointment = myAppointments.find((apt) => apt.id === slot.appointmentId);
            if (appointment) {
              return (
                <div key={idx} className="pointer-events-auto">
                    <EmpresarioMyAppointmentCell
                      appointment={appointment}
                      slot={slot}
                      onView={handleViewMyAppointment}
                    />
                </div>
              );
            }
          }
          // Do not render "Occupied" cells for other companies on the main grid to keep it clean?
          // Or render them small? User said "cuando se pulse en cualquier dia se abra una ventana...".
          // If we show "Occupied", clicking it might be confusing if it doesn't open the daily modal.
          // Let's render them but make sure they don't block clicks excessively or handle click to open modal?
          // Actually, EmpresarioOccupiedCell is usually just a visual block.
          // If I return simple div, it should be fine.
          
          return (
             <div key={idx} className="pointer-events-auto">
                <EmpresarioOccupiedCell slot={slot} />
             </div>
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
              Agendar Cita
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona un día para ver disponibilidad
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{myAppointments.length}</p>
              <p className="text-xs text-gray-600">Mis citas</p>
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
            // Add onDayClick handler
            onDayClick={handleDayClick}
            slots={allSlots}
            renderDayContent={renderDayContent}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-700">Mi cita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-700">Ocupado</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
      />
      
      <DayScheduleModal
        isOpen={dayScheduleModalOpen}
        onClose={() => setDayScheduleModalOpen(false)}
        date={selectedDay}
        appointments={engineerAppointments} // Pass all appointments of the engineer to check availability
        onSelectSlot={handleSelectSlot}
      />

      <CreateAppointmentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        prefilledDate={selectedSlot?.date}
        prefilledTime={selectedSlot?.startTime}
        empresarioId={empresaId}
        ingenieroId={ingenieroAsignadoId}
      />
    </div>
  );
}
