'use client';

import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import FilterButtons from './FilterButtons';
import EmptyState from './EmptyState';
import { AppointmentCard } from '@/app/components/appointments';
import {
  ViewAppointmentModal
} from '@/app/components/modals';
import Pagination from '@/app/components/common/Pagination';
import { Appointment, AppointmentStatus, AppointmentType, PaginatedResponse } from '@/app/types';

interface AdminListViewProps {
  appointments: Appointment[];
  meta?: PaginatedResponse<Appointment>['meta'];
  allAppointments?: Appointment[]; // Full list for counts (Legacy)
  globalCounts?: any; // New global stats
  filters?: {
      status: AppointmentStatus | 'all';
      type: AppointmentType | 'all';
      page?: number;
  };
  onFilterChange?: (newFilters: { status?: AppointmentStatus | 'all'; type?: AppointmentType | 'all'; page?: number }) => void;
  onDelete?: (appointment: Appointment) => void;
}

export default function AdminListView({
  appointments,
  meta,
  allAppointments = [],
  globalCounts,
  filters = { status: 'all', type: 'all', page: 1 },
  onFilterChange,
  onDelete
}: AdminListViewProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
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
    if (globalCounts) return globalCounts;

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
  }, [allAppointments, appointments, globalCounts]);

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

   const handlePageChange = (page: number) => {
      if (onFilterChange) onFilterChange({ ...filters, page });
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
              {meta ? `${meta.total} citas encontradas` : `${filteredAppointments.length} citas encontradas`}
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

      <div className="flex flex-1 overflow-hidden relative">
         {/* Sidebar / Top Filters */}
         <div className="w-64 bg-white border-r border-gray-200 p-4 hidden md:block overflow-y-auto">
            <FilterButtons 
                selectedStatus={filters.status}
                selectedType={filters.type}
                onStatusChange={handleStatusChange}
                onTypeChange={handleTypeChange}
                appointmentCounts={appointmentCounts}
            />
         </div>

         {/* Main List Area */}
         <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
               {filteredAppointments.length === 0 ? (
                   <EmptyState />
               ) : (
                   <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                      {filteredAppointments.map((apt: Appointment) => (
                          <AppointmentCard 
                             key={apt.id}
                             appointment={apt}
                             onView={() => handleView(apt)}
                             onDelete={onDelete}
                          />
                      ))}
                   </div>
               )}
            </div>

            {/* Pagination */}
            {meta && (
                <Pagination 
                   currentPage={meta.page}
                   totalPages={meta.totalPages}
                   onPageChange={handlePageChange}
                   hasNextPage={meta.hasNextPage}
                   hasPreviousPage={meta.hasPreviousPage}
                   totalItems={meta.total}
                />
            )}
         </div>
      </div>

      {/* Modals */}
      <ViewAppointmentModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
}
