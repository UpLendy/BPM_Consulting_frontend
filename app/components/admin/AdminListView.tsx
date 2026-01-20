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
  allAppointments?: Appointment[]; // Full list for counts
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  filters?: {
      status: AppointmentStatus | 'all';
      type: AppointmentType | 'all';
  };
  onFilterChange?: (newFilters: { status?: AppointmentStatus | 'all'; type?: AppointmentType | 'all' }) => void;
}

export default function AdminListView({
  appointments,
  allAppointments = [],
  onEdit,
  onDelete,
  filters = { status: 'all', type: 'all' },
  onFilterChange
}: AdminListViewProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filter and search logic (Client-side Search only)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
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
  }, [appointments, searchQuery]);

  // Calculate counts for filters (Based on ALL appointments, so they don't change with filters)
  const appointmentCounts = useMemo(() => {
    const dataSource = allAppointments.length > 0 ? allAppointments : appointments;
    return {
      all: dataSource.length,
      programada: dataSource.filter((a) => a.status === AppointmentStatus.PROGRAMADA).length,
      confirmada: dataSource.filter((a) => a.status === AppointmentStatus.CONFIRMADA).length,
      en_progreso: dataSource.filter((a) => a.status === AppointmentStatus.EN_PROGRESO).length,
      completada: dataSource.filter((a) => a.status === AppointmentStatus.COMPLETADA).length,
      cancelada: dataSource.filter((a) => a.status === AppointmentStatus.CANCELADA).length,
      asesoria: dataSource.filter((a) => a.appointmentType === AppointmentType.ASESORIA).length,
      auditoria: dataSource.filter((a) => a.appointmentType === AppointmentType.AUDITORIA).length,
      seguimiento: dataSource.filter((a) => a.appointmentType === AppointmentType.SEGUIMIENTO).length
    };
  }, [allAppointments, appointments]);

  const handleStatusChange = (status: AppointmentStatus | 'all') => {
      if (onFilterChange) onFilterChange({ ...filters, status });
  };

  const handleTypeChange = (type: AppointmentType | 'all') => {
      if (onFilterChange) onFilterChange({ ...filters, type });
  };
    
  // Handlers
  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };
    
  const handleEdit = (appointment: Appointment) => {
    if (onEdit) onEdit(appointment);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedAppointment && onDelete) {
      onDelete(selectedAppointment.id);
      setDeleteModalOpen(false); // Close modal
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Citas (Admin)
            </h1>
            <span className="text-sm text-gray-500">
              {filteredAppointments.length} citas encontradas
            </span>
          </div>
          
          <div className="flex space-x-4">
             <div className="flex-1">
                 <SearchBar 
                    value={searchQuery}
                    onChange={setSearchQuery}
                 />
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar / Top Filters */}
         {/* Moving Filters to Sidebar or Top? FilterButtons uses vertical layout usually? 
             Let's put it in a sidebar for desktop.
         */}
         <div className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block overflow-y-auto">
            <FilterButtons 
                selectedStatus={filters.status}
                selectedType={filters.type}
                onStatusChange={handleStatusChange}
                onTypeChange={handleTypeChange}
                appointmentCounts={appointmentCounts}
            />
         </div>

         {/* Main List */}
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {filteredAppointments.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                   {filteredAppointments.map((apt) => (
                       <AppointmentCard 
                          key={apt.id}
                          appointment={apt}
                          onView={() => handleView(apt)}
                          onEdit={() => handleEdit(apt)}
                          onDelete={() => handleDeleteClick(apt)}
                          // Admin specific actions usually?
                       />
                   ))}
                </div>
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
        message={`¿Estás seguro de que deseas eliminar la cita para ${selectedAppointment?.companyName}?`}
      />
    </div>
  );
}
