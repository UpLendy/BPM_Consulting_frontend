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
            // Fetch appointments where I am the representative (Paginated)
            const response = await appointmentService.getMyAppointments(1, 100); // Get first 100 for verification
            if (response.data && response.data.length > 0) {
                const ids = new Set(response.data.map((a: Appointment) => String(a.id)));
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

  // Identify MY appointments (this empresa)
  const myAppointments = useMemo(() => {
    return engineerAppointments.filter((apt) => {
        const idStr = String(apt.id);
        if (ownedAppointmentIds.size > 0) {
            return ownedAppointmentIds.has(idStr);
        }
        // Fallback check: check both empresaId and representativeId
        return String(apt.empresaId) === String(empresaId) || String(apt.representativeId) === String(empresaId);
    });
  }, [engineerAppointments, empresaId, ownedAppointmentIds]);

  // Create slots for calendar display (ONLY MY appointments are shown on grid now)
  const mySlots = useMemo(() => {
    const slots: TimeSlot[] = [];

    myAppointments.forEach((apt) => {
      // Parse date manually to avoid UTC shift
      let localDate: Date;
      const rawDate = apt.date as unknown as string | Date;
      
      if (rawDate instanceof Date) {
          localDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
      } else {
          const dateString = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
          const [y, m, d] = dateString.split('-').map(Number);
          localDate = new Date(y, m - 1, d);
      }

      slots.push({
        date: localDate,
        startTime: getDisplayTime(apt.startTime),
        endTime: getDisplayTime(apt.endTime),
        isAvailable: false,
        appointmentId: apt.id,
        isMyAppointment: true
      });
    });

    return slots;
  }, [myAppointments]);

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
    setDayScheduleModalOpen(false); // Close daily schedule first
    setViewModalOpen(true);
  };

  // Custom cell renderer for empresario
  const renderDayContent = (date: Date, daySlots: TimeSlot[]) => {
    if (daySlots.length === 0) return null;

    // Show ONLY My Appointments
    const displaySlots = daySlots.slice(0, 2);
    const remaining = daySlots.length - displaySlots.length;

    return (
      <div className="mt-1 space-y-1 pointer-events-none"> 
        {displaySlots.map((slot, idx) => {
          const appointment = myAppointments.find((apt) => String(apt.id) === String(slot.appointmentId));
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
          return null;
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

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4">
          <Calendar
            className="h-full w-full shadow-none"
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            // Add onDayClick handler
            onDayClick={handleDayClick}
            slots={mySlots}
            renderDayContent={renderDayContent}
          />
        </div>
      </div>

      {/* Legend removed via User Request */}
      {/* <div className="bg-white border-t border-gray-200 px-6 py-3">...</div> */}

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
        onViewAppointment={handleViewMyAppointment}
        ownedAppointmentIds={ownedAppointmentIds}
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
