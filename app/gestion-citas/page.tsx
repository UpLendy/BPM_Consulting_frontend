'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO, AppointmentFilters } from '@/app/types';
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
  
  // Admin Filters
  const [adminFilters, setAdminFilters] = useState<{
    status: AppointmentStatus | 'all';
    type: AppointmentType | 'all';
  }>({ status: 'all', type: 'all' });

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
             const data = await appointmentService.getCompanyEngineerAppointments();
             setAppointments(data);
        } else if (currentUser.role === 'engineer') {
             const data = await appointmentService.getAppointmentsByEngineer(engineerIdToUse);
             setAppointments(data);
        } else if (currentUser.role === 'admin') {
             // Admin sees all active appointments with filters
             // Fetch ALL appointments first to get correct counts (if not already done or just always refresh to be safe)
             // Optimization: Could fetch "stats" separately? 
             // Simplest fix: Fetch all first. Then filter locally?
             // User requested: "esos datos... no deberian de cambiar... el filtro debe mostrar cuantas de ese tipo hay en todo momento"
             // This implies the COUNTS should be based on the TOTAL dataset, regardless of current filter.
             
             // Strategy: 
             // 1. Fetch ALL appointments (base set)
             // 2. Derive filtered list from base set locally? 
             // Wait, user explicitly asked for backend filtering "endpoint de admin... para crear filtros de busqueda".
             // If we use backend filtering, we only get filtered results. We can't count the others.
             // UNLESS we make two calls: one for stats (or all), one for list.
             // OR we just fetch ALL and filter Client-Side. 
             // But user pushed for Backend params.
             
             // Compromise: 
             // - Fetch ALL appointments initially (or in parallel) to get the "Counts".
             // - Fetch FILTERED appointments for the list.
             
             // Let's do parallel fetch if filters are active.
             // Actually, if we want counts based on "Status", we need the global counts.
             
             const filters: AppointmentFilters = {};
             if (adminFilters.status !== 'all') filters.estado = adminFilters.status;
             if (adminFilters.type !== 'all') filters.tipo = adminFilters.type;
             
             // Fetch filtered list
             const filteredDataPromise = appointmentService.getAllAppointments(filters);
             
             // Fetch all for counts (unfiltered) - only if we haven't or want to refresh
             const allDataPromise = appointmentService.getAllAppointments({}); // Empty filters = all
             
             const [filteredData, allData] = await Promise.all([filteredDataPromise, allDataPromise]);
             
             setAppointments(filteredData);
             setAllAppointments(allData);
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
      // NOTE: location and other fields are sent to backend in DTO.
      // Backend returns the created appointment.
      const newAppointment = await appointmentService.createAppointment({
        ...data,
        // Ensure backend required fields are present if DTO optionality differs
        empresaId: currentUser.id,
        // ingenieroId might be assigned by backend or passed from UI
      });

      setAppointments([...appointments, newAppointment]);
      alert('Cita creada exitosamente!');
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
            allAppointments={allAppointments}
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
