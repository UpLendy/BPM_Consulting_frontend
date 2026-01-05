'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO } from '@/app/types';
import { mapBackendRoleToFrontend } from '@/app/types/auth';

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'engineer' | 'company';
}

export default function GestionCitasPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      // No auth, redirect to login
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

  // Mock data for testing
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      empresaId: 'emp_1',
      empresaName: 'Café del Valle S.A.',
      ingenieroId: 'ing_1',
      ingenieroName: 'Ernesto Ballesteros',
      fecha: new Date('2026-02-05'),
      horaInicio: '09:00',
      horaFin: '11:00',
      descripcion: 'Asesoría inicial sobre procesos',
      tipo: AppointmentType.ASESORIA,
      estado: AppointmentStatus.PENDIENTE,
      createdBy: 'admin',
      createdAt: new Date()
    },
    {
      id: '2',
      empresaId: 'emp_2',
      empresaName: 'Procesadora del Eje',
      ingenieroId: 'ing_1',
      ingenieroName: 'Ernesto Ballesteros',
      fecha: new Date('2026-02-10'),
      horaInicio: '14:00',
      horaFin: '16:00',
      descripcion: 'Auditoría de calidad',
      tipo: AppointmentType.AUDITORIA,
      estado: AppointmentStatus.COMPLETADA,
      createdBy: 'admin',
      createdAt: new Date()
    },
    {
      id: '3',
      empresaId: 'emp_1',
      empresaName: 'Café del Valle S.A.',
      ingenieroId: 'ing_2',
      ingenieroName: 'Carlos Morales',
      fecha: new Date('2026-02-15'),
      horaInicio: '10:00',
      horaFin: '12:00',
      descripcion: 'Revisión de mejoras',
      tipo: AppointmentType.ASESORIA,
      estado: AppointmentStatus.PENDIENTE,
      createdBy: 'admin',
      createdAt: new Date()
    }
  ]);

  // Mock available slots for Empresario
  const availableSlots: TimeSlot[] = [
    {
      date: new Date('2026-02-07'),
      startTime: '09:00',
      endTime: '11:00',
      isAvailable: true
    },
    {
      date: new Date('2026-02-12'),
      startTime: '15:00',
      endTime: '17:00',
      isAvailable: true
    }
  ];

  // Handlers
  const handleEditAppointment = (appointment: Appointment) => {
    console.log('Edit appointment:', appointment);
    alert(`Función de edición pendiente de implementar para: ${appointment.empresaName}`);
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
  };

  const handleCreateAppointment = (data: CreateAppointmentDTO) => {
    console.log('Create appointment:', data);
    
    if (!currentUser) return;

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      empresaId: data.empresaId,
      empresaName: 'Nueva Empresa', // Would come from backend
      ingenieroId: data.ingenieroId,
      ingenieroName: 'Ingeniero Asignado', // Would come from backend
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      descripcion: data.descripcion,
      tipo: data.tipo,
      estado: AppointmentStatus.PENDIENTE,
      createdBy: currentUser.id,
      createdAt: new Date()
    };
    setAppointments([...appointments, newAppointment]);
    alert('Cita creada exitosamente!');
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
            ingenieroAsignadoId={'ing_1'} // TODO: Get from backend
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
