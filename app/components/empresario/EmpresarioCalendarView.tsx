'use client';

import { useState, useMemo } from 'react';
import Calendar from '@/app/components/calendar/Calendar';
import {
  EmpresarioAvailableCell,
  EmpresarioOccupiedCell,
  EmpresarioMyAppointmentCell
} from '@/app/components/calendar/cells';
import {
  ViewAppointmentModal,
  CreateAppointmentModal
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Filter appointments of assigned engineer
  const engineerAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.ingenieroId === ingenieroAsignadoId);
  }, [appointments, ingenieroAsignadoId]);

  // Identify MY appointments (this empresa)
  const myAppointments = useMemo(() => {
    return engineerAppointments.filter((apt) => apt.empresaId === empresaId);
  }, [engineerAppointments, empresaId]);

  // Create comprehensive slots for calendar
  const allSlots = useMemo(() => {
    const slots: TimeSlot[] = [];

    // 1. Add available slots (green - can schedule)
    availableSlots.forEach((slot) => {
      slots.push({
        ...slot,
        isAvailable: true
      });
    });

    // 2. Add engineer's appointments
    engineerAppointments.forEach((apt) => {
      const isMyAppointment = apt.empresaId === empresaId;
      
      slots.push({
        date: new Date(apt.fecha),
        startTime: apt.horaInicio,
        endTime: apt.horaFin,
        isAvailable: false,
        appointmentId: apt.id,
        isMyAppointment
      });
    });

    return slots;
  }, [availableSlots, engineerAppointments, empresaId]);

  // Handlers
  const handleSchedule = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCreateModalOpen(true);
  };

  const handleViewMyAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  const handleCreateSubmit = (data: CreateAppointmentDTO) => {
    if (onCreateAppointment) {
      onCreateAppointment(data);
    }
  };

  // Custom cell renderer for empresario
  const renderDayContent = (date: Date, daySlots: TimeSlot[]) => {
    if (daySlots.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {daySlots.map((slot, idx) => {
          // Available slot (green - can schedule)
          if (slot.isAvailable) {
            return (
              <EmpresarioAvailableCell
                key={idx}
                slot={slot}
                onSchedule={handleSchedule}
              />
            );
          }

          // My appointment (blue - can view)
          if (slot.isMyAppointment && slot.appointmentId) {
            const appointment = myAppointments.find((apt) => apt.id === slot.appointmentId);
            if (appointment) {
              return (
                <EmpresarioMyAppointmentCell
                  key={idx}
                  appointment={appointment}
                  slot={slot}
                  onView={handleViewMyAppointment}
                />
              );
            }
          }

          // Occupied by another empresa (gray - just shows occupied, NO details)
          return (
            <EmpresarioOccupiedCell
              key={idx}
              slot={slot}
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
              Agendar Cita
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualiza disponibilidad y agenda tus citas
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{myAppointments.length}</p>
              <p className="text-xs text-gray-600">Mis citas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{availableSlots.length}</p>
              <p className="text-xs text-gray-600">Disponibles</p>
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
            slots={allSlots}
            renderDayContent={renderDayContent}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">Disponible (click para agendar)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-700">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-700">Mi cita (click para ver)</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
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
