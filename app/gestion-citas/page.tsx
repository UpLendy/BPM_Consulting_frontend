'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/components/layout';
import { AdminListView } from '@/app/components/admin';
import { IngenieroCalendarView } from '@/app/components/ingeniero';
import { EmpresarioCalendarView } from '@/app/components/empresario';
import { UserRole, Appointment, AppointmentType, AppointmentStatus, TimeSlot, CreateAppointmentDTO } from '@/app/types';

// TODO: Replace with real auth context when backend is ready
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  empresaId?: string;
  ingenieroAsignadoId?: string;
}

export default function GestionCitasPage() {
  // Mock user - CHANGE THIS TO TEST DIFFERENT ROLES
  const [currentUser] = useState<MockUser>({
    id: 'admin_1',
    email: 'admin@bpm.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN // Change to INGENIERO or EMPRESARIO to test
  });

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
    switch (currentUser.role) {
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
            empresaId={currentUser.empresaId || currentUser.id}
            ingenieroAsignadoId={currentUser.ingenieroAsignadoId || 'ing_1'}
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
