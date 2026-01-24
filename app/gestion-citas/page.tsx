'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO, AppointmentFilters, PaginatedResponse } from '@/app/types';
import { mapBackendRoleToFrontend } from '@/app/types/auth';
import { appointmentService } from '@/app/services/appointments';
import { authService } from '@/app/services/authService';

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
  const [globalStats, setGlobalStats] = useState<any>(null);
  
  // Admin Filters
  const [adminFilters, setAdminFilters] = useState<{
    status: AppointmentStatus | 'all';
    type: AppointmentType | 'all';
    page: number;
  }>({ status: 'all', type: 'all', page: 1 });

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
      console.error('Error parsing user:', error);
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

        if (currentUser.role === 'company') {
             const response = await appointmentService.getCompanyEngineerAppointments();
             setAppointments(Array.isArray(response) ? response : (response as any).data || []);
        } else if (currentUser.role === 'engineer') {
             const response = await appointmentService.getAppointmentsByEngineer(engineerIdToUse);
             setAppointments(Array.isArray(response) ? response : (response as any).data || []);
        } else if (currentUser.role === 'admin') {
             const filters: AppointmentFilters = {
                page: adminFilters.page,
                limit: 10
             };
             if (adminFilters.status !== 'all') filters.estado = adminFilters.status;
             if (adminFilters.type !== 'all') filters.tipo = adminFilters.type;
             
             // Fetch filtered list (paginated)
             console.log('DEBUG - Fetching filtered appointments with:', filters);
             const filteredRes = await appointmentService.getAllAppointments(filters);
             console.log('DEBUG - Filtered response:', filteredRes);
             
             // Fetch global stats for counts
             const statsRes = await appointmentService.getAppointmentStats();
             if (statsRes.success) {
                setGlobalStats(statsRes.data);
             }
             
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
  }, [currentUser, adminFilters]);

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

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
    setAllAppointments(allAppointments.filter((apt) => apt.id !== appointmentId));
  };

  const handleCreateAppointment = async (data: CreateAppointmentDTO) => {
    if (!currentUser) return;

    try {
      const response = await appointmentService.createAppointment({
        ...data,
        empresaId: currentUser.id,
      });

      if (response.success && response.data) {
        setAppointments([...appointments, response.data]);
        alert('Cita creada exitosamente!');
      } else {
        throw new Error(response.error || 'Error al crear la cita');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Error al crear la cita. Por favor intente nuevamente.');
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
            globalCounts={globalStats}
            onDelete={handleDeleteAppointment}
            filters={adminFilters}
            onFilterChange={(newFilters) => setAdminFilters(prev => ({ ...prev, ...newFilters }))}
          />
        );

      case UserRole.INGENIERO:
        return (
          <IngenieroCalendarView
            ingenieroId={engineerId || currentUser.id}
            appointments={appointments}
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
    </DashboardLayout>
  );
}
