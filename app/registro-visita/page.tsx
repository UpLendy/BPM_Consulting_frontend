'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { authService } from '@/app/services/authService';
import { Appointment } from '@/app/types';
import { getDisplayTime } from '@/app/components/calendar/utils';
import VisitRegistrationModal from '../components/visita/VisitRegistrationModal';

export default function RegistroVisitaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }
        
        const user = JSON.parse(userStr);
        // Ensure user is engineer (or admin)
        // For now, assuming engineer logic or admin viewing as engineer
        
        const profile = await authService.getProfile();
        const engineerId = profile?.user?.engineerId || user.id;

        // Fetch appointments for this engineer
        // User requested to list them similar to admin view but for the engineer
        const response = await appointmentService.getAppointmentsByEngineer(engineerId);
        
        // Filter? User mentioned query params for PROGRAMADA/ASESORIA in the request,
        // but also said "listar todas...". Let's show all active ones for now or sort by date.
        // Let's filter client-side for active/relevant ones if needed. 
        // Showing all for visibility as requested.
        if (response.success && response.data) {
          const appointmentsData = response.data;
          setAppointments(Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []));
        } else {
          console.error('Failed to fetch appointments:', response.error);
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [router]);

  const handleOpenModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-inter max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Registro de Visita</h1>
          <p className="text-gray-500">Seleccione una cita para diligenciar el formulario de visita.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500">No tienes citas asignadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((apt) => (
              <div 
                key={apt.id}
                onClick={() => handleOpenModal(apt)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${apt.status === 'PROGRAMADA' ? 'bg-blue-100 text-blue-700' : 
                          apt.status === 'CONFIRMADA' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'}`}>
                         {apt.status}
                       </span>
                       <span className="text-xs text-gray-500 font-medium border border-gray-200 px-2 py-0.5 rounded">
                         {apt.appointmentType}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {apt.companyName || 'Empresa Sin Nombre'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(apt.date).toLocaleDateString('es-ES', { dateStyle: 'full' })} 
                      {' • '} 
                      {getDisplayTime(apt.startTime)} - {getDisplayTime(apt.endTime)}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 line-clamp-1">
                      {apt.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      Registrar Visita &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAppointment && (
          <VisitRegistrationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            appointment={selectedAppointment}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
