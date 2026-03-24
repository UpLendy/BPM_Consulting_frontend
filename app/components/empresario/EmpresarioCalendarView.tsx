'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '@/app/components/calendar/Calendar';
import { getDisplayTime } from '@/app/components/calendar/utils';
import { appointmentService } from '@/app/services/appointments';
import { representativeService } from '@/app/services/representatives/representativeService';
import { formatShortDate } from '@/app/utils/dateUtils';
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
import { Appointment, TimeSlot, CreateAppointmentDTO, AppointmentStatus } from '@/app/types';

interface EmpresarioCalendarViewProps {
  empresaId: string;
  ingenieroAsignadoId: string;
  appointments: Appointment[]; // All appointments for the assigned engineer
  availableSlots: TimeSlot[]; // Available time slots from backend
  onCreateAppointment?: (data: CreateAppointmentDTO) => void;
  onMonthChange?: (date: Date) => void;
  currentMonth: Date;
}

export default function EmpresarioCalendarView({
  empresaId,
  ingenieroAsignadoId,
  appointments,
  availableSlots,
  onCreateAppointment,
  onMonthChange,
  currentMonth
}: EmpresarioCalendarViewProps) {
  const router = useRouter();
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
            let allMyIds = new Set<string>();
            let page = 1;
            let hasMore = true;
            
            // Calculate date range for current month
            const fechaInicio = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const fechaFin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

            while (hasMore && page <= 5) {
                const response = await appointmentService.getMyAppointments({ 
                    page, 
                    limit: 100,
                    fechaInicio,
                    fechaFin
                });
                
                if (response.data && response.data.length > 0) {
                    response.data.forEach((a: Appointment) => allMyIds.add(String(a.id)));
                }
                
                hasMore = response.meta?.hasNextPage || false;
                page++;
            }
            
            setOwnedAppointmentIds(allMyIds);
        } catch (e) {
            console.error('Error fetching my appointments for verification', e);
        }
    };
    
    fetchMyAppointments();
  }, [currentMonth]); // Re-fetch when month changes

  // Filter appointments of assigned engineer
  const engineerAppointments = useMemo(() => {
    return appointments.filter(apt => apt.status !== AppointmentStatus.CANCELADA); 
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

  // Detect appointments that are currently in progress
  const inProgressAppointments = useMemo(() => {
    return myAppointments.filter(apt => apt.status === AppointmentStatus.EN_PROGRESO);
  }, [myAppointments]);

  // Detect appointments that are currently in progress and NEED signature (not signed in last 120m)
  const [showSignatureBanner, setShowSignatureBanner] = useState(false);
  const [rejectedRecordsForSignature, setRejectedRecordsForSignature] = useState<Appointment[]>([]);

  // Check for Rejected Records for Signature
  useEffect(() => {
    const checkRejectedForSignature = async () => {
      // Find appointments that are COMPLETADA or EN_REVISION and might have a rejected record
      const candidates = myAppointments.filter(apt => 
        apt.status === AppointmentStatus.COMPLETADA || apt.status === AppointmentStatus.EN_REVISION
      );
      
      if (candidates.length === 0) return;
      
      const rejectedAppts: Appointment[] = [];
      
      await Promise.all(candidates.map(async (apt) => {
        try {
          const recordRes = await appointmentService.getAppointmentRecord(apt.id);
          
          let isRejectedOrNeedsSignature = false;
          
          if (recordRes.success && recordRes.data) {
             const status = (recordRes.data.status || '').toUpperCase();
             if (status === 'RECHAZADA' || status === 'RECHAZADO') {
                 isRejectedOrNeedsSignature = true;
             }
          } else if (!recordRes.success && recordRes.error && recordRes.error.toLowerCase().includes('firmado')) {
             // Backend throws a 500 error if it's not signed or accepted
             isRejectedOrNeedsSignature = true;
          }

          if (isRejectedOrNeedsSignature) {
             const justSigned = sessionStorage.getItem(`just_signed_${apt.id}`);
             if (!justSigned) {
                 rejectedAppts.push(apt);
             }
          }
        } catch (e) {
          // ignore
        }
      }));
      
      setRejectedRecordsForSignature(rejectedAppts);
    };
    
    checkRejectedForSignature();
  }, [myAppointments]);

  useEffect(() => {
    const checkSignatureStatus = async () => {
        // Find the first appointment that is in progress to check its specific representative
        const activeApt = inProgressAppointments[0];
        
        if (!activeApt || !activeApt.representativeId) {
            setShowSignatureBanner(inProgressAppointments.length > 0); // Show if in progress but no ID (fallback)
            return;
        }

        try {
            // Fetch representative signature to check its timestamp using representativeId
            const sigRes = await representativeService.getRepresentativeSignature(activeApt.representativeId);
            
            if (sigRes && sigRes.updatedAt) {
                const updatedAt = new Date(sigRes.updatedAt);
                const now = new Date();
                const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
                
                // If signed in the last 4320 minutes, don't show the banner
                if (diffMinutes <= 4320) {
                    setShowSignatureBanner(false);
                    return;
                }
            }
            
            // If no signature info OR older than 4320 mins, show banner
            setShowSignatureBanner(true);
        } catch (e) {
            console.error('Error checking signature status (using banner as fallback)', e);
            // Default to showing banner if we can't verify (safer)
            setShowSignatureBanner(true);
        }
    };

    checkSignatureStatus();
  }, [inProgressAppointments.length, inProgressAppointments[0]?.representativeId]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* Rejected Signature Banner (High Priority) */}
      {rejectedRecordsForSignature.length > 0 && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[11px] font-black uppercase tracking-widest text-red-100">Firma Requerida</p>
            </div>
            
            {rejectedRecordsForSignature.map(apt => {
              const localDate = new Date(apt.date);
              return (
                <div key={apt.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-3 pb-3 border-b border-white/20 last:border-0">
                  <div>
                    <h3 className="text-lg font-black">Acta rechazada por falta de firma</h3>
                    <p className="text-sm text-red-100 mt-1">
                      Cita con <span className="font-bold text-white">{apt.engineerName}</span> el {formatShortDate(apt.date)} — Por favor firma nuevamente el acta para proceder.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                        sessionStorage.setItem(`just_signed_${apt.id}`, 'true');
                        router.push(`/firma-acta/${apt.id}`);
                    }}
                    className="px-6 py-3 bg-white text-red-700 font-black rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 flex items-center gap-2 text-sm uppercase tracking-wide shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Firmar Acta
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Visit Signature Banner - Only if NOT recently signed (<120m) */}
      {showSignatureBanner && inProgressAppointments.length > 0 && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          {/* Animated pulse background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-200"></span>
              </span>
              <p className="text-[11px] font-black uppercase tracking-widest text-green-100">Visita en Progreso</p>
            </div>
            
            {inProgressAppointments.map(apt => (
              <div key={apt.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-3">
                <div>
                  <h3 className="text-lg font-black">Tu asesor está en tu establecimiento</h3>
                  <p className="text-sm text-green-100 mt-1">
                    Ingeniero <span className="font-bold text-white">{apt.engineerName}</span> — Por favor firma el acta de asesoría  
                  </p>
                </div>
                <button 
                  onClick={() => router.push(`/firma-acta/${apt.id}`)}
                  className="px-6 py-3 bg-white text-green-700 font-black rounded-xl shadow-lg hover:bg-green-50 transition-all active:scale-95 flex items-center gap-2 text-sm uppercase tracking-wide shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Firmar Acta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            onMonthChange={onMonthChange}
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
        existingAppointments={engineerAppointments}
      />
    </div>
  );
}
