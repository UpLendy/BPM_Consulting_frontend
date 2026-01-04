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
      if (selectedStatus !== 'all' && apt.estado !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && apt.tipo !== selectedType) {
        return false;
      }

      // Search query (empresa, ingeniero, descripcion)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesEmpresa = apt.empresaName.toLowerCase().includes(query);
        const matchesIngeniero = apt.ingenieroName.toLowerCase().includes(query);
        const matchesDescripcion = apt.descripcion.toLowerCase().includes(query);

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
      pendiente: appointments.filter((a) => a.estado === AppointmentStatus.PENDIENTE).length,
      completada: appointments.filter((a) => a.estado === AppointmentStatus.COMPLETADA).length,
      cancelada: appointments.filter((a) => a.estado === AppointmentStatus.CANCELADA).length,
      asesoria: appointments.filter((a) => a.tipo === AppointmentType.ASESORIA).length,
      auditoria: appointments.filter((a) => a.tipo === AppointmentType.AUDITORIA).length
    };
  }, [appointments]);

  // Handlers
  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    if (onEdit) {
      onEdit(appointment);
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedAppointment && onDelete) {
      onDelete(selectedAppointment.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Citas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Administra y visualiza todas las citas del sistema
            </p>
          </div>

          {/* Appointment Count */}
          <div className="text-right">
            <p className="text-sm text-gray-600">Total de citas</p>
            <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por empresa, ingeniero o descripción..."
        />
      </div>

      {/* Filters and Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar with Filters */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <FilterButtons
            selectedStatus={selectedStatus}
            selectedType={selectedType}
            onStatusChange={setSelectedStatus}
            onTypeChange={setSelectedType}
            appointmentCounts={appointmentCounts}
          />
        </div>

        {/* Appointments List */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-6">
          {filteredAppointments.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredAppointments.length} de {appointments.length} citas
                </p>
              </div>

              {/* Appointments Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
        message={`¿Estás seguro de que deseas eliminar la cita para ${selectedAppointment?.empresaName}?`}
      />
    </div>
  );
}
