'use client';

import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import FilterButtons from './FilterButtons';
import EmptyState from './EmptyState';
import { AppointmentCard } from '@/app/components/appointments';
import {
  ViewAppointmentModal,
  ConfirmDeleteModal
} from '@/app/components/modals';
import { Appointment, AppointmentStatus, AppointmentType } from '@/app/types';

interface AdminListViewProps {
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
}

export default function AdminListView({
  appointments,
  onEdit,
  onDelete
}: AdminListViewProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<AppointmentType | 'all'>('all');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filter and search logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && apt.appointmentType !== selectedType) {
        return false;
      }

      // Search query (empresa, ingeniero, descripcion)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesEmpresa = (apt.companyName || '').toLowerCase().includes(query);
        const matchesIngeniero = (apt.engineerName || '').toLowerCase().includes(query);
        const matchesDescripcion = apt.description.toLowerCase().includes(query);

        if (!matchesEmpresa && !matchesIngeniero && !matchesDescripcion) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, selectedStatus, selectedType, searchQuery]);

  // Calculate counts for filters
  const appointmentCounts = useMemo(() => {
    return {
      all: appointments.length,
      pendiente: appointments.filter((a) => a.status === AppointmentStatus.PENDIENTE).length,
      completada: appointments.filter((a) => a.status === AppointmentStatus.COMPLETADA).length,
      cancelada: appointments.filter((a) => a.status === AppointmentStatus.CANCELADA).length,
      asesoria: appointments.filter((a) => a.appointmentType === AppointmentType.ASESORIA).length,
      auditoria: appointments.filter((a) => a.appointmentType === AppointmentType.AUDITORIA).length
    };
  }, [appointments]);

  // ... (handlers skipped)

  const handleDeleteConfirm = () => {
    if (selectedAppointment && onDelete) {
      onDelete(selectedAppointment.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* ... (header skipped) */}
      
      {/* ... (sidebar skipped) */}

      {/* Modals */}
      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={`¿Estás seguro de que deseas eliminar la cita para ${selectedAppointment?.companyName}?`}
      />
    </div>
  );
}
