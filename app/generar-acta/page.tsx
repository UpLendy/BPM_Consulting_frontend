'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { authService } from '@/app/services/authService';
import { Appointment } from '@/app/types';
import { HiDocumentText, HiPencilAlt } from 'react-icons/hi';
import AdvisoryActModal from '@/app/components/visita/AdvisoryActModal';

export default function GenerarActaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeModal, setActiveModal] = useState<'act' | 'sign' | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      const profile = await authService.getProfile();
      const engineerId = profile?.user?.engineerId || user.id;

      const data = await appointmentService.getAppointmentsByEngineer(engineerId);
      setAppointments(data.filter(a => a.status === 'EN_PROGRESO'));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [router]);

  const handleFinalizeAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas finalizar esta cita? Asegúrate de haber guardado el acta primero.')) return;
    
    try {
      setFinishing(id);
      await appointmentService.completeAppointment(id);
      alert('Visita finalizada exitosamente');
      fetchAppointments();
    } catch (error) {
      console.error('Error finalizing appointment:', error);
      alert('Error al finalizar la cita');
    } finally {
      setFinishing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-10 font-inter max-w-7xl mx-auto min-h-screen">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Generar acta</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Aquí podrás generar el acta de la visita que acabas de realizar
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#525298]"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <HiDocumentText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay citas pendientes para generar acta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {appointments.map((apt) => (
              <div 
                key={apt.id}
                className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 flex flex-col items-center"
              >
                <div className="w-full mb-8 text-center">
                  <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
                    Vista para: {apt.companyName}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {new Date(apt.date).toLocaleDateString('es-ES', { dateStyle: 'full' })} • {apt.location || 'Sede Principal'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl justify-center">
                  <button 
                    onClick={() => {
                      setSelectedAppointment(apt);
                      setActiveModal('act');
                    }}
                    disabled={finishing === apt.id}
                    className="flex-1 min-w-[280px] h-[140px] bg-[#525298] text-white text-4xl font-medium rounded-2xl hover:bg-[#434380] shadow-2xl shadow-blue-900/10 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    Generar acta
                  </button>
                  <button 
                    onClick={() => handleFinalizeAppointment(apt.id)}
                    disabled={finishing === apt.id}
                    className="flex-1 min-w-[280px] h-[140px] bg-emerald-600 text-white text-4xl font-medium rounded-2xl hover:bg-emerald-700 shadow-2xl shadow-emerald-900/10 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {finishing === apt.id ? 'Finalizando...' : 'Finalizar cita'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAppointment && (
          <AdvisoryActModal
            isOpen={activeModal !== null}
            initialStep={activeModal === 'sign' ? 'sign' : 'form'}
            onClose={() => {
              setActiveModal(null);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
