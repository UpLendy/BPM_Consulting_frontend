'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO, RescheduleAppointmentDTO, AppointmentFilters, PaginatedResponse } from '@/app/types';
import { mapBackendRoleToFrontend } from '@/app/types/auth';
import { appointmentService } from '@/app/services/appointments';
import { authService } from '@/app/services/authService';

import { BaseModal, ConfirmDeleteModal } from '@/app/components/modals';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'engineer' | 'company';
  engineerId?: string; // Assigned engineer ID for company users
}

export default function GestionCitasPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]); // For counts
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<Appointment>['meta'] | undefined>(undefined);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  
  // Admin Filters
  const [adminFilters, setAdminFilters] = useState<{
    status: AppointmentStatus | 'all';
    type: AppointmentType | 'all';
    page: number;
  }>({ status: 'all', type: 'all', page: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Read user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const user: AuthUser = JSON.parse(userStr);
      setCurrentUser(user);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch appointments when user is loaded
  useEffect(() => {
    if (!currentUser) return;

    const fetchAppointments = async () => {
      try {
        const profile = await authService.getProfile();
        let engineerIdToUse = currentUser.id;
        const discoveredId = profile?.user?.engineerId;
        
        if (discoveredId) {
            engineerIdToUse = discoveredId;
            setEngineerId(discoveredId);
        }

        // Helper to fetch all pages (max 5 pages of 100 items each = 500 items)
        const fetchAllItems = async (serviceFn: Function, firstArg?: string) => {
            let allItems: Appointment[] = [];
            let page = 1;
            let hasMore = true;
            
            // Calculate date range for current month
            const fechaInicio = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const fechaFin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

            while (hasMore && page <= 5) {
                const filters = { 
                    page, 
                    limit: 100,
                    fechaInicio,
                    fechaFin
                };
                
                const response = firstArg 
                    ? await serviceFn(firstArg, filters)
                    : await serviceFn(filters);
                
                if (response.success && response.data) {
                    const data = response.data.data || [];
                    allItems = [...allItems, ...data];
                    
                    hasMore = response.data.meta?.hasNextPage || false;
                } else {
                    hasMore = false;
                }
                page++;
            }
            return allItems;
        }

        if (currentUser.role === 'company') {
             const allData = await fetchAllItems(appointmentService.getCompanyEngineerAppointments.bind(appointmentService));
             setAppointments(allData);
        } else if (currentUser.role === 'engineer') {
             const allData = await fetchAllItems(appointmentService.getAppointmentsByEngineer.bind(appointmentService), engineerIdToUse);
             setAppointments(allData);
        } else if (currentUser.role === 'admin') {
             const filters: AppointmentFilters = {};
             
             // Admin view keeps limit 10 and doesn't auto-fetch all pages
             if (adminFilters.page > 1) filters.page = adminFilters.page;
             filters.limit = 10;
             
             if (adminFilters.status !== 'all') filters.estado = adminFilters.status;
             if (adminFilters.type !== 'all') filters.tipo = adminFilters.type;
             
             const filteredRes = await appointmentService.getAllAppointments(filters);
             
             const filteredData = (filteredRes?.data || (Array.isArray(filteredRes) ? filteredRes : [])) as Appointment[];

             setAppointments(filteredData);
             setPaginationMeta(filteredRes?.meta);
             // Use filtered Data as a baseline for counts to avoid a second API call that triggers 'Expected integer' on limit
             setAllAppointments(filteredData);
        }
      } catch (error) {
          console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [currentUser, adminFilters, refreshKey, currentMonth]);

  const handleMonthChange = (date: Date) => {
      setCurrentMonth(date);
  };

  // Map backend role to frontend UserRole enum
  const getFrontendRole = (): UserRole => {
    if (!currentUser) return UserRole.ADMIN; // fallback
    
    const mappedRole = mapBackendRoleToFrontend(currentUser.role);
    
    // Convert to UserRole enum
    switch (mappedRole) {
      case 'admin':
        return UserRole.ADMIN;
      case 'ingeniero':
        return UserRole.INGENIERO;
      case 'empresario':
        return UserRole.EMPRESARIO;
      default:
        return UserRole.ADMIN;
    }
  };



  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsConfirmModalOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      const response = await appointmentService.cancelAppointment(appointmentToDelete.id);
      if (response.success) {
        setRefreshKey(prev => prev + 1);
        setSuccessMessage({ 
          title: '¡Cita Cancelada!', 
          message: 'La cita ha sido cancelada exitosamente.' 
        });
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        setErrorMessage(response.error || 'Error al cancelar la cita');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Ocurrió un error inesperado al cancelar la cita');
      setShowErrorModal(true);
    } finally {
      setIsConfirmModalOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleCreateAppointment = async (data: CreateAppointmentDTO) => {
    if (!currentUser) return;

    try {
      const response = await appointmentService.createAppointment({
        ...data,
        empresaId: currentUser.id,
      });

      if (response.success && response.data) {
        setRefreshKey(prev => prev + 1);
        setSuccessMessage({ 
          title: '¡Cita Agendada!', 
          message: 'Tu cita ha sido programada exitosamente en el sistema.' 
        });
        setShowSuccessModal(true);
        // Reset modal after 3 seconds optionally, or let user close it
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        throw new Error(response.error || 'Error al crear la cita');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al crear la cita. Por favor intente nuevamente.');
      setShowErrorModal(true);
    }
  };

  const handleReschedule = async (id: string, data: RescheduleAppointmentDTO) => {
    try {
      const response = await appointmentService.rescheduleAppointment(id, data);
      if (response.success) {
        setRefreshKey(prev => prev + 1);
        setSuccessMessage({ 
          title: '¡Cita Actualizada!', 
          message: 'La cita ha sido reprogramada exitosamente.' 
        });
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      } else {
        setErrorMessage(response.error || 'Error al reprogramar la cita');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Ocurrió un error inesperado al reprogramar la cita');
      setShowErrorModal(true);
    }
  };

  // Render view based on role
  const renderView = () => {
    if (isLoading || !currentUser) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      );
    }

    const role = getFrontendRole();

    switch (role) {
      case UserRole.ADMIN:
        return (
          <AdminListView
            appointments={appointments}
            meta={paginationMeta}
            allAppointments={allAppointments}
            filters={adminFilters}
            onFilterChange={(newFilters) => setAdminFilters(prev => ({ ...prev, ...newFilters }))}
            onDelete={handleDeleteAppointment}
            onReschedule={handleReschedule}
            isAdmin={getFrontendRole() === UserRole.ADMIN}
          />
        );

      case UserRole.INGENIERO:
        return (
          <IngenieroCalendarView
            ingenieroId={engineerId || currentUser.id}
            appointments={appointments}
            onMonthChange={handleMonthChange}
          />
        );

      case UserRole.EMPRESARIO:
        return (
          <EmpresarioCalendarView
            empresaId={currentUser.id}
            ingenieroAsignadoId={currentUser.engineerId || ''}
            appointments={appointments}
            availableSlots={availableSlots}
            onCreateAppointment={handleCreateAppointment}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Rol no reconocido</h2>
              <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderView()}

      {/* Success Modal for Created Appointment */}
      <BaseModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title=""
        size="sm"
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 font-inter">{successMessage.title}</h3>
            <p className="text-gray-600 font-medium mb-6">{successMessage.message}</p>
            <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-sm hover:bg-green-700 transition-colors"
            >
                Entendido
            </button>
        </div>
      </BaseModal>

      {/* Error Modal */}
      <BaseModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        size="sm"
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 font-inter">Ups, algo salió mal</h3>
            <p className="text-gray-600 font-medium mb-6">{errorMessage}</p>
            <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
            >
                Cerrar
            </button>
        </div>
      </BaseModal>

      {/* Confirm Cancellation Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmCancelAppointment}
        title="Cancelar Cita"
        message={`¿Estás seguro de que deseas cancelar la cita de ${appointmentToDelete?.companyName}? Esta acción marcará la cita como cancelada.`}
        confirmText="Sí, cancelar cita"
        cancelText="No, mantener"
      />
    </DashboardLayout>
  );
}
