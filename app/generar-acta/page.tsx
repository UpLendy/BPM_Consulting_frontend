'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { authService } from '@/app/services/authService';
import { Appointment } from '@/app/types';
import { HiDocumentText, HiPencilAlt } from 'react-icons/hi';
import AdvisoryActModal from '@/app/components/visita/AdvisoryActModal';
import BaseModal from '@/app/components/modals/BaseModal';
import { HiExclamation, HiCheckCircle } from 'react-icons/hi';

export default function GenerarActaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeModal, setActiveModal] = useState<'act' | 'sign' | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [idToFinalize, setIdToFinalize] = useState<string | null>(null);

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

      const response = await appointmentService.getAppointmentsByEngineer(engineerId);
      if (response.success) {
        setAppointments((response.data || []).filter(a => a.status === 'EN_REVISION'));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [router]);

  const handleFinalizeAppointment = (id: string) => {
    setIdToFinalize(id);
    setShowConfirmModal(true);
  };

  const confirmFinalize = async () => {
    if (!idToFinalize) return;
    
    setShowConfirmModal(false);
    setFinishing(idToFinalize);
    setError(null);
    
    const response = await appointmentService.completeAppointment(idToFinalize);
    
    if (response.success) {
      // Llamar a la validación obligatoriamente después de completar
      await appointmentService.createAppointmentValidation(idToFinalize);
      fetchAppointments();
    } else {
      setError(response.error || 'Error al finalizar la cita');
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setFinishing(null);
    setIdToFinalize(null);
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
        
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center animate-fade-in shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-bold uppercase tracking-tight">
                  Atención: {error}
                </p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

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

        {/* Modal de Confirmación Personalizado */}
        <BaseModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmar Finalización"
          size="sm"
        >
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <HiExclamation className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">¿Estás seguro?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Deseas finalizar esta cita. Asegúrate de haber <strong>guardado el acta</strong> primero, ya que esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinalize}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all uppercase text-xs"
              >
                Sí, finalizar
              </button>
            </div>
          </div>
        </BaseModal>
      </div>
    </DashboardLayout>
  );
}
