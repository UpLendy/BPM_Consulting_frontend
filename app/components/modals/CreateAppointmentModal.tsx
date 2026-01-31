'use client';

import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { CreateAppointmentDTO, AppointmentType, Appointment, AppointmentStatus } from '@/app/types';
import { getDisplayTime } from '@/app/components/calendar/utils';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointmentDTO) => void;
  prefilledDate?: Date;
  prefilledTime?: string;
  empresarioId?: string;
  ingenieroId?: string;
  existingAppointments?: Appointment[];
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledDate,
  prefilledTime,
  empresarioId,
  ingenieroId,
  existingAppointments = []
}: CreateAppointmentModalProps) {
  const getInitialEndTime = (start: string) => {
    const [h, m] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(h + 2, m, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getSafeDateStr = (dateInput: any) => {
    if (!dateInput) return '';
    if (dateInput instanceof Date) {
        const y = dateInput.getFullYear();
        const m = String(dateInput.getMonth() + 1).padStart(2, '0');
        const d = String(dateInput.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    if (typeof dateInput === 'string') return dateInput.split('T')[0];
    return '';
  };

  const [formState, setFormState] = useState({
    date: prefilledDate || new Date(),
    startTime: prefilledTime || '09:00',
    endTime: getInitialEndTime(prefilledTime || '09:00'),
    description: '',
    appointmentType: AppointmentType.ASESORIA,
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form state when modal opens with new prefilled data
  useEffect(() => {
    if (isOpen) {
      let initialStart = prefilledTime || '09:00';
      
      const selectedDateStr = getSafeDateStr(prefilledDate || formState.date);
      
      // -- BUFFER LOGIC: Check if initialStart needs a 15 min shift --
      const hasClash = existingAppointments.some(apt => {
          if (apt.status === AppointmentStatus.CANCELADA) return false;
          const aptDateStr = getSafeDateStr(apt.date);
          if (aptDateStr !== selectedDateStr) return false;
          
          const endStr = getDisplayTime(apt.endTime);
          return endStr === initialStart;
      });

      if (hasClash) {
          const [h, m] = initialStart.split(':').map(Number);
          const d = new Date();
          d.setHours(h, m + 15, 0, 0);
          initialStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      setFormState({
        date: prefilledDate || new Date(),
        startTime: initialStart,
        endTime: getInitialEndTime(initialStart),
        description: '',
        appointmentType: AppointmentType.ASESORIA,
        location: ''
      });
      setErrors({});
    }
  }, [isOpen, prefilledDate, prefilledTime, existingAppointments]);

  const adjustEndTime = (minutes: number) => {
    const [startH, startM] = formState.startTime.split(':').map(Number);
    const [endH, endM] = formState.endTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const currentEndTotal = endH * 60 + endM;
    const newEndTotal = currentEndTotal + minutes;
    
    const duration = newEndTotal - startTotal;

    // Constraints: 120 min (2h) to 180 min (3h)
    if (duration >= 120 && duration <= 180) {
      const newH = Math.floor(newEndTotal / 60);
      const newM = newEndTotal % 60;
      setFormState(prev => ({
        ...prev,
        endTime: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
      }));
    }
  };

  const [transportWarning, setTransportWarning] = useState<string | null>(null);

  const handleStartTimeChange = (newStart: string) => {
    const [h, m] = newStart.split(':').map(Number);
    const newTotal = h * 60 + m;
    
    const selectedDateStr = getSafeDateStr(formState.date);

    const dayAppointments = existingAppointments.filter(apt => {
        if (apt.status === AppointmentStatus.CANCELADA) return false;
        const aptDateStr = getSafeDateStr(apt.date);
        return aptDateStr === selectedDateStr;
    });

    let adjustedStart = newStart;
    let showWarning = false;

    dayAppointments.forEach(apt => {
        const aptEndStr = getDisplayTime(apt.endTime);
        if (!aptEndStr) return;
        const [aeH, aeM] = aptEndStr.split(':').map(Number);
        const aptEndTotal = aeH * 60 + aeM;
        
        if (newTotal >= aptEndTotal && newTotal < aptEndTotal + 15) {
            showWarning = true;
            const finalMins = aptEndTotal + 15;
            adjustedStart = `${String(Math.floor(finalMins / 60)).padStart(2, '0')}:${String(finalMins % 60).padStart(2, '0')}`;
        }
    });

    if (showWarning) {
        setTransportWarning('Por cuestiones de transporte el ingeniero requiere al menos 15 minutos para llegar al establecimiento');
        setTimeout(() => setTransportWarning(null), 5000);
    } else {
        setTransportWarning(null);
    }

    setFormState(prev => ({
      ...prev,
      startTime: adjustedStart,
      endTime: getInitialEndTime(adjustedStart)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.startTime) newErrors.startTime = 'Hora de inicio es requerida';
    if (!formState.endTime) newErrors.endTime = 'Hora de fin es requerida';
    if (!formState.description) newErrors.description = 'Descripción es requerida';
    if (!formState.location) newErrors.location = 'Ubicación es requerida';

    if (formState.startTime && formState.endTime) {
      const [startH, startM] = formState.startTime.split(':').map(Number);
      const [endH, endM] = formState.endTime.split(':').map(Number);
      
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      if (startTotalMinutes < 300) {
          newErrors.startTime = 'La hora de inicio mínima es a las 5:00 AM';
      } else if (startTotalMinutes > 1140) {
          newErrors.startTime = 'La última cita permitida inicia a las 7:00 PM';
      }

      if (durationMinutes < 0) {
        newErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
      } else if (durationMinutes < 120) {
        newErrors.endTime = 'La duración mínima es de 2 horas';
      } else if (durationMinutes > 180) {
        newErrors.endTime = 'La duración máxima es de 3 horas';
      }

      const selectedDateCompare = getSafeDateStr(formState.date);
      const dayAppointments = existingAppointments.filter(apt => {
          if (apt.status === AppointmentStatus.CANCELADA) return false;
          return getSafeDateStr(apt.date) === selectedDateCompare;
      });

      dayAppointments.forEach(apt => {
          const aptStartStr = getDisplayTime(apt.startTime);
          const aptEndStr = getDisplayTime(apt.endTime);
          if (!aptStartStr || !aptEndStr) return;

          const [asH, asM] = aptStartStr.split(':').map(Number);
          const [aeH, aeM] = aptEndStr.split(':').map(Number);
          
          const aptStartTotal = asH * 60 + asM;
          const aptEndTotal = aeH * 60 + aeM;

          const buffer = 15;

          if (startTotalMinutes < aptEndTotal && endTotalMinutes > aptStartTotal) {
              newErrors.startTime = 'Esta hora presenta un conflicto con otra cita existente.';
          } else {
              if (startTotalMinutes < aptEndTotal + buffer && startTotalMinutes >= aptEndTotal) {
                  newErrors.startTime = `Debes dejar al menos ${buffer} min para el transporte del ingeniero (Mínimo: ${Math.floor((aptEndTotal+buffer)/60)}:${String((aptEndTotal+buffer)%60).padStart(2,'0')})`;
              }
              if (endTotalMinutes > aptStartTotal - buffer && endTotalMinutes <= aptStartTotal) {
                  newErrors.endTime = `Debes dejar al menos ${buffer} min antes de la siguiente cita del ingeniero.`;
              }
          }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const dateStr = getSafeDateStr(formState.date);
      const startTimeISO = `${dateStr}T${formState.startTime}:00.000Z`;
      const endTimeISO = `${dateStr}T${formState.endTime}:00.000Z`;

      const dto: CreateAppointmentDTO = {
        description: formState.description,
        appointmentType: formState.appointmentType,
        date: dateStr,
        startTime: startTimeISO,
        endTime: endTimeISO,
        location: formState.location,
        empresaId: empresarioId,
        ingenieroId: ingenieroId
      };

      onSubmit(dto);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormState({
      date: prefilledDate || new Date(),
      startTime: prefilledTime || '09:00',
      endTime: getInitialEndTime(prefilledTime || '09:00'),
      description: '',
      appointmentType: AppointmentType.ASESORIA,
      location: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agendar Nueva Cita"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Tipo de Cita *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormState({ ...formState, appointmentType: AppointmentType.ASESORIA })}
              className={`p-2 border-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                formState.appointmentType === AppointmentType.ASESORIA
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-tight">Asesoría</span>
            </button>
            <button
              type="button"
              onClick={() => setFormState({ ...formState, appointmentType: AppointmentType.AUDITORIA })}
              className={`p-2 border-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                formState.appointmentType === AppointmentType.AUDITORIA
                  ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                  : 'border-gray-200 text-gray-800 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-tight">Auditoría</span>
            </button>
            {/* Seguimiento option removed per user request (backend support remains) */}
            <button
              type="button"
              onClick={() => setFormState({ ...formState, appointmentType: AppointmentType.CAPACITACION })}
              className={`p-2 border-2 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
                formState.appointmentType === AppointmentType.CAPACITACION
                  ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                  : 'border-gray-200 text-gray-800 hover:border-orange-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-tight">Capacitación</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Fecha *
          </label>
          <input
            type="date"
            value={getSafeDateStr(formState.date)}
            onChange={(e) => setFormState({ ...formState, date: new Date(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Hora de Inicio *
            </label>
            {transportWarning && (
              <div className="absolute -top-7 left-0 w-[200%] z-10">
                <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded shadow-sm border border-amber-200 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  ⚠️ {transportWarning}
                </p>
              </div>
            )}
            <input
              type="time"
              value={formState.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.startTime && (
              <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Hora de Fin (Ajustable) *
            </label>
            <div className="flex items-center gap-2 h-[42px]">
               <button 
                type="button"
                onClick={() => adjustEndTime(-15)}
                className="w-10 h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30"
                title="Reducir 15 min"
               >
                 <span className="font-bold text-lg text-gray-700">−</span>
               </button>
               
               <div className="flex-1 h-full flex items-center justify-center bg-white border border-gray-300 rounded-lg font-bold text-gray-900 text-sm shadow-inner">
                  {formState.endTime}
               </div>

               <button 
                type="button"
                onClick={() => adjustEndTime(15)}
                className="w-10 h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30"
                title="Aumentar 15 min"
               >
                 <span className="font-bold text-lg text-gray-700">+</span>
               </button>
            </div>
            {!errors.endTime && (
              <p className="mt-1 text-[10px] text-gray-500 font-medium italic">
                Duración: 2 a 3 horas (Intervalo 15m)
              </p>
            )}
            {errors.endTime && (
               <p className="mt-1 text-xs text-red-600 font-bold">{errors.endTime}</p>
            )}
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
            placeholder="Ej: Planta principal, Sala de juntas, etc."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.location && (
            <p className="mt-1 text-xs text-red-600">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">
            Descripción *
          </label>
          <textarea
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe el motivo de la cita..."
            required
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agendar Cita
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
