'use client';

import { useState, useMemo, useEffect } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { appointmentService } from '@/app/services/appointments';
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

  /* State for Owned Appointments (API Check) */
  const [ownedAppointmentIds, setOwnedAppointmentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMyAppointments = async () => {
        try {
            // Fetch appointments where I am the representative
            const myApts = await appointmentService.getMyAppointments();
            if (myApts && myApts.length > 0) {
                const ids = new Set(myApts.map(a => a.id));
                console.log('--- API My Appointments Fetched (Empresario View) ---');
                console.log('Owned IDs:', Array.from(ids));
                setOwnedAppointmentIds(ids);
            }
        } catch (e) {
            console.error('Error fetching my appointments for verification', e);
        }
    };
    
    fetchMyAppointments();
  }, []);

  // Filter appointments of assigned engineer
  const engineerAppointments = useMemo(() => {
    return appointments; 
  }, [appointments]);

  // Identify MY appointments (this empresa) - DEPRECATED via prop check, now relying on API Check or both?
  // Let's keep this memo but use the Set for the slot flag if available.
  const myAppointments = useMemo(() => {
    // Return appointments that match our owned Set
    if (ownedAppointmentIds.size > 0) {
        return engineerAppointments.filter(apt => ownedAppointmentIds.has(apt.id));
    }
    // Fallback if API hasn't loaded or returned nothing yet (or empty)
    return engineerAppointments.filter((apt) => apt.empresaId === empresaId); 
  }, [engineerAppointments, empresaId, ownedAppointmentIds]);

  // Create slots for calendar display (ONLY appointments are shown on grid now)
  const allSlots = useMemo(() => {
    const slots: TimeSlot[] = [];

    engineerAppointments.forEach((apt) => {
      // Check ownership via API List if populated, else fallback to empresaId
      const isMyAppointment = ownedAppointmentIds.size > 0 
          ? ownedAppointmentIds.has(apt.id) 
          : apt.empresaId === empresaId;
      
      // Parse date manually to avoid UTC shift
      const rawDate = apt.date as unknown as string | Date;
      const dateString = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate instanceof Date ? rawDate.toISOString().split('T')[0] : '';
      const [y, m, d] = dateString.split('-').map(Number);
      const localDate = new Date(y, m - 1, d);

      slots.push({
        date: localDate,
        startTime: getDisplayTime(apt.startTime),
        endTime: getDisplayTime(apt.endTime),
        isAvailable: false,
        appointmentId: apt.id,
        isMyAppointment
      });
    });

    return slots;
  }, [engineerAppointments, empresaId, ownedAppointmentIds]);

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
