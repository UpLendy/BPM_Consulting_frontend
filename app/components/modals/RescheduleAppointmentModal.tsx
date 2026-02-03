'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { RescheduleAppointmentDTO, AppointmentType, Appointment, AppointmentStatus, Engineer } from '@/app/types';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { engineerService } from '@/app/services/engineers/engineerService';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (data: RescheduleAppointmentDTO) => void;
  appointment: Appointment | null;
  isAdmin?: boolean;
}

export default function RescheduleAppointmentModal({
  isOpen,
  onClose,
  onReschedule,
  appointment,
  isAdmin = false
}: RescheduleAppointmentModalProps) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(false);

  const getSafeDateStr = (dateInput: any) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    // Use UTC methods to avoid timezone shifts pulling midnight to the previous day
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getInitialFormState = (apt: Appointment | null) => ({
    date: apt ? getSafeDateStr(apt.date) : '',
    startTime: apt ? getDisplayTime(apt.startTime) : '09:00',
    endTime: apt ? getDisplayTime(apt.endTime) : '11:00',
    description: apt ? apt.description : '',
    appointmentType: apt ? apt.appointmentType : AppointmentType.ASESORIA,
    location: apt ? apt.location : ''
  });

  const [formState, setFormState] = useState(getInitialFormState(appointment));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && appointment) {
      setFormState(getInitialFormState(appointment));
    }
  }, [isOpen, appointment]);

  const handleStartTimeChange = (newStart: string) => {
    const [h, m] = newStart.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;

    // Calculate new end time (default 2 hours later)
    let endH = h + 2;
    let endM = m;
    
    // Format to HH:mm, handling wrap around if needed
    const formattedEnd = `${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    setFormState(prev => ({
      ...prev,
      startTime: newStart,
      endTime: formattedEnd
    }));
  };

  const adjustEndTime = (minutes: number) => {
    if (!formState.startTime || !formState.endTime) return;
    const [startH, startM] = formState.startTime.split(':').map(Number);
    const [endH, endM] = formState.endTime.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(endH)) return;

    const startTotal = startH * 60 + startM;
    const currentEndTotal = endH * 60 + endM;
    const newEndTotal = currentEndTotal + minutes;
    
    const duration = newEndTotal - startTotal;

    // Duration constraints: 15 min to 6 hours for admin flexibility
    if (duration >= 15 && duration <= 360) {
      const hours = Math.floor(newEndTotal / 60);
      const mins = newEndTotal % 60;
      // Handle potential overflow but usually appointments are same-day
      const adjustedH = hours % 24;
      setFormState(prev => ({
        ...prev,
        endTime: `${String(adjustedH).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.date) newErrors.date = 'La fecha es requerida';
    if (!formState.startTime) newErrors.startTime = 'Hora de inicio es requerida';
    if (!formState.endTime) newErrors.endTime = 'Hora de fin es requerida';
    if (!formState.description) newErrors.description = 'Descripción es requerida';
    if (!formState.location) newErrors.location = 'Ubicación es requerida';

    if (formState.startTime && formState.endTime) {
      const [startH, startM] = formState.startTime.split(':').map(Number);
      const [endH, endM] = formState.endTime.split(':').map(Number);
      
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;
      if (endTotalMinutes <= startTotalMinutes) {
        newErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
      }

      // 60-minute anticipation check - Skip for Admin
      if (formState.date && !isAdmin) {
        const [y, m, d] = formState.date.split('-').map(Number);
        const localStart = new Date(y, m - 1, d, startH, startM);
        const now = new Date();
        const diffMs = localStart.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);

        if (diffMins < 60) {
          newErrors.startTime = 'Solo se pueden reprogramar citas con al menos 60 minutos de anticipación';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && appointment) {
      const dateStr = formState.date;
      const [y, m, d] = dateStr.split('-').map(Number);
      
      const [sh, sm] = formState.startTime.split(':').map(Number);
      const localStart = new Date(y, m - 1, d, sh, sm);
      const startTimeISO = localStart.toISOString();

      const [eh, em] = formState.endTime.split(':').map(Number);
      const localEnd = new Date(y, m - 1, d, eh, em);
      const endTimeISO = localEnd.toISOString();

      const dto: RescheduleAppointmentDTO = {
        description: formState.description,
        appointmentType: formState.appointmentType,
        date: dateStr,
        startTime: startTimeISO,
        endTime: endTimeISO,
        location: formState.location,
        engineerId: appointment.ingenieroId || ''
      };

      onReschedule(dto);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reprogramar / Editar Cita"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
          <p className="text-xs text-blue-700 font-medium">
            <span className="font-bold">Nota:</span> Al reprogramar, la cita mantendrá su estado actual pero se actualizarán los tiempos de la misma.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Tipo de Cita *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[AppointmentType.ASESORIA, AppointmentType.AUDITORIA, AppointmentType.CAPACITACION].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormState({ ...formState, appointmentType: type })}
                className={`p-2 border-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                  formState.appointmentType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-tight">{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={formState.date}
              onChange={(e) => setFormState({ ...formState, date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Hora de Inicio *
            </label>
            <input
              type="time"
              value={formState.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Hora de Fin *
            </label>
            <div className="flex items-center gap-2 h-[42px]">
               <button 
                type="button"
                onClick={() => adjustEndTime(-15)}
                className="w-10 h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
               >
                 <span className="font-bold text-lg text-gray-700">−</span>
               </button>
               
               <input
                type="time"
                value={formState.endTime}
                onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-bold text-center h-full ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />

               <button 
                type="button"
                onClick={() => adjustEndTime(15)}
                className="w-10 h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
               >
                 <span className="font-bold text-lg text-gray-700">+</span>
               </button>
            </div>
            {errors.endTime && <p className="mt-1 text-xs text-red-600 font-bold">{errors.endTime}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Ubicación *
          </label>
          <input
            type="text"
            value={formState.location}
            onChange={(e) => setFormState({ ...formState, location: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Descripción *
          </label>
          <textarea
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
