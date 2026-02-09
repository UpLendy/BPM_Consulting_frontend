'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { appointmentService } from '@/app/services/appointments/appointmentService';
import { authService } from '@/app/services/authService';
import { Appointment, AppointmentStatus, PaginatedResponse } from '@/app/types';
import { getDisplayTime } from '@/app/components/calendar/utils';
import VisitRegistrationModal from '../components/visita/VisitRegistrationModal';
import { formatLongDate } from '@/app/utils/dateUtils';

export default function RegistroVisitaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<Appointment>['meta'] | undefined>(undefined);
  const itemsPerPage = 10;

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }
        
        const user = JSON.parse(userStr);
        const profile = await authService.getProfile();
        const engineerId = profile?.user?.engineerId || user.id;

        // Fetch ALL appointments (we'll paginate client-side)
        let allFetchedAppointments: Appointment[] = [];
        let page = 1;
        let hasMore = true;

        // Fetch all pages
        while (hasMore && page <= 10) { // Max 10 pages to prevent infinite loop
          const response = await appointmentService.getAppointmentsByEngineer(engineerId, {
            page,
            limit: 100 // Fetch 100 per page to minimize requests
          });
          
          if (response.success && response.data) {
            const pageData = response.data.data || [];
            allFetchedAppointments = [...allFetchedAppointments, ...pageData];
            hasMore = response.data.meta?.hasNextPage || false;
            page++;
          } else {
            hasMore = false;
          }
        }

        // Filter out cancelled appointments
        const activeAppointments = allFetchedAppointments.filter(
          (apt: Appointment) => apt.status !== AppointmentStatus.CANCELADA
        );
        
        // Sort: Priority by status, then by date
        const sortedAppointments = activeAppointments.sort((a, b) => {
          const statusPriority: Record<AppointmentStatus, number> = {
            [AppointmentStatus.EN_PROGRESO]: 1,      // HIGHEST PRIORITY
            [AppointmentStatus.EN_REVISION]: 2,
            [AppointmentStatus.PROGRAMADA]: 3,
            [AppointmentStatus.CONFIRMADA]: 4,
            [AppointmentStatus.COMPLETADA]: 5,
            [AppointmentStatus.CANCELADA]: 6
          };
          
          const priorityA = statusPriority[a.status] || 99;
          const priorityB = statusPriority[b.status] || 99;
          
          // If same priority, sort by date (most recent first)
          if (priorityA === priorityB) {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Descending order (newest first)
          }
          
          return priorityA - priorityB;
        });

        setAllAppointments(sortedAppointments);
        
        // Calculate pagination metadata
        const total = sortedAppointments.length;
        const totalPages = Math.ceil(total / itemsPerPage);
        setPaginationMeta({
          total,
          page: currentPage,
          limit: itemsPerPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        });

      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAllAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [router]); // Only fetch once on mount

  // Update displayed appointments when page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAppointments = allAppointments.slice(startIndex, endIndex);
    setAppointments(paginatedAppointments);

    // Update pagination meta for current page
    if (allAppointments.length > 0) {
      const total = allAppointments.length;
      const totalPages = Math.ceil(total / itemsPerPage);
      setPaginationMeta({
        total,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }
  }, [currentPage, allAppointments]);

  const handleOpenModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <p className="text-gray-500">No tienes citas activas asignadas.</p>
          </div>
        ) : (
          <>
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
                            apt.status === 'EN_PROGRESO' ? 'bg-yellow-100 text-yellow-700' :
                            apt.status === 'EN_REVISION' ? 'bg-orange-100 text-orange-700' :
                            apt.status === 'COMPLETADA' ? 'bg-purple-100 text-purple-700' :
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
                        {formatLongDate(apt.date)} 
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

            {/* Pagination Controls */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600">
                  Mostrando página <span className="font-bold">{paginationMeta.page}</span> de{' '}
                  <span className="font-bold">{paginationMeta.totalPages}</span>
                  {' • '}
                  <span className="font-bold">{paginationMeta.total}</span> citas en total
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginationMeta.hasPreviousPage}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginationMeta.hasNextPage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
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
