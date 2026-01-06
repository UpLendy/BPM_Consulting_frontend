'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO } from '@/app/types';
import { mapBackendRoleToFrontend } from '@/app/types/auth';
import { appointmentService } from '@/app/services/appointments';

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
  // We don't use availableSlots directly anymore for Empresario view (implicit 8-5)
  // But keeping it empty to satisfy prop type if needed or removing it. 
  // EmpresarioCalendarView uses availableSlots prop? Yes.
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

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
        if (currentUser.role === 'company') {
             // Use the specific endpoint for companies to get their assigned engineer's appointments
             const data = await appointmentService.getCompanyEngineerAppointments();
             setAppointments(data);
        } else if (currentUser.role === 'engineer') {
             // For engineers, fetch their own appointments (using their ID)
             const data = await appointmentService.getAppointmentsByEngineer(currentUser.id);
             setAppointments(data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [currentUser]);

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

  // Handlers
  const handleEditAppointment = (appointment: Appointment) => {
    console.log('Edit appointment:', appointment);
    alert(`Función de edición pendiente de implementar para: ${appointment.companyName}`);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
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
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        );

      case UserRole.INGENIERO:
        return (
          <IngenieroCalendarView
            ingenieroId={currentUser.id}
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
