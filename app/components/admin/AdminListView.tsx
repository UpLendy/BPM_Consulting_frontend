'use client';

import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import FilterButtons from './FilterButtons';
import EmptyState from './EmptyState';
import { AppointmentCard } from '@/app/components/appointments';
import {
  ViewAppointmentModal,
  RescheduleAppointmentModal
} from '@/app/components/modals';
import Pagination from '@/app/components/common/Pagination';
import { Appointment, AppointmentStatus, AppointmentType, PaginatedResponse, RescheduleAppointmentDTO } from '@/app/types';

interface AdminListViewProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  meta?: PaginatedResponse<Appointment>['meta'];
  filters: {
    status: AppointmentStatus | 'all';
    type: AppointmentType | 'all';
    page: number;
  };
  onFilterChange?: (filters: any) => void;
  onDelete?: (appointment: Appointment) => void;
  onReschedule?: (id: string, data: RescheduleAppointmentDTO) => void;
  isAdmin?: boolean;
}

export default function AdminListView({
  appointments,
  allAppointments = [],
  meta,
  filters,
  onFilterChange,
  onDelete,
  onReschedule,
  isAdmin = false
}: AdminListViewProps) {
  // State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Reschedule State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);

  // Use searchQuery from filters, with fallback to empty string
  const searchQuery = (filters as any).searchQuery || '';

  // Filter and search logic (Client-side Search only)
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;

    const query = searchQuery.toLowerCase();
    return appointments.filter((apt) => {
        const matchesEmpresa = apt.companyName?.toLowerCase().includes(query);
        const matchesIngeniero = apt.engineerName?.toLowerCase().includes(query);
        const matchesDescripcion = apt.description.toLowerCase().includes(query);

        return matchesEmpresa || matchesIngeniero || matchesDescripcion;
    });
  }, [appointments, searchQuery]);

  // Sort appointments intelligently (FUTURE/TODAY first, then PAST)
  const sortedAppointments = useMemo(() => {
     if (!filteredAppointments.length) return [];

     const now = new Date();
     const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

     // Helper to get exact timestamp of an appointment or rough timestamp from string
     const getAptTime = (apt: Appointment) => {
         const d = new Date(apt.date);
         
         // Fix timezone offset issues if it's just 'YYYY-MM-DD'
         const dateTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
         
         // Assuming startTime is string like "HH:mm" or "HH:mm:ss"
         let timeMs = 0;
         if (typeof apt.startTime === 'string') {
             const [hours, minutes] = apt.startTime.split(':').map(Number);
             timeMs = ((hours || 0) * 3600 + (minutes || 0) * 60) * 1000;
         }
         
         return dateTime + timeMs;
     };

     // Split into Future/Today and Past
     const upcoming: Appointment[] = [];
     const past: Appointment[] = [];

     filteredAppointments.forEach(apt => {
         const aptDate = new Date(apt.date);
         const dateStart = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate()).getTime();
         
         if (dateStart >= todayStart) {
             upcoming.push(apt);
         } else {
             past.push(apt);
         }
     });

     // Sort Upcoming: Ascending (Nearest first)
     upcoming.sort((a, b) => getAptTime(a) - getAptTime(b));

     // Sort Past: Descending (Most recent past first)
     past.sort((a, b) => getAptTime(b) - getAptTime(a));

     return [...upcoming, ...past];
  }, [filteredAppointments]);

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

  // Local Pagination Logic
  const itemsPerPage = 10;
  const currentPage = filters.page || 1;

  const currentMeta = useMemo(() => {
      if (meta) return meta; // Use external if provided
      const total = sortedAppointments.length;
      const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      return {
          total,
          page: currentPage,
          limit: itemsPerPage,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
      };
  }, [meta, sortedAppointments.length, currentPage]);

  const displayedAppointments = useMemo(() => {
      if (meta) return sortedAppointments; // External pagination means we already have exactly what we want
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAppointments, meta, currentPage]);

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

  const handleEditClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setRescheduleModalOpen(true);
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
              {currentMeta ? `${currentMeta.total} citas encontradas` : `${sortedAppointments.length} citas encontradas`}
            </span>
          </div>

          <div className="flex space-x-4">
             <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={(query) => {
                       if (onFilterChange) {
                           onFilterChange({ ...filters, searchQuery: query, page: 1 });
                       }
                    }}
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
                      {displayedAppointments.map((apt: Appointment) => (
                          <AppointmentCard
                             key={apt.id}
                             appointment={apt}
                             onView={() => handleView(apt)}
                             onEdit={() => handleEditClick(apt)}
                             onDelete={onDelete}
                          />
                      ))}
                   </div>
               )}
            </div>

            {/* Pagination */}
            {currentMeta && currentMeta.totalPages > 1 && (
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                    <Pagination
                       currentPage={currentMeta.page}
                       totalPages={currentMeta.totalPages}
                       onPageChange={handlePageChange}
                       hasNextPage={currentMeta.hasNextPage}
                       hasPreviousPage={currentMeta.hasPreviousPage}
                       totalItems={currentMeta.total}
                    />
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

      <RescheduleAppointmentModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        appointment={appointmentToReschedule}
        isAdmin={isAdmin}
        onReschedule={(data) => {
          if (appointmentToReschedule && onReschedule) {
            onReschedule(appointmentToReschedule.id, data);
            setRescheduleModalOpen(false);
          }
        }}
      />
    </div>
  );
}
