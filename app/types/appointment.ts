import { AppointmentStatus, AppointmentType } from './roles';

/**
 * Appointment interface
 */
export interface Appointment {
    id: string;
    empresaId: string;
    empresaName: string;
    ingenieroId: string;
    ingenieroName: string;
    fecha: Date;
    horaInicio: string;  // Format: "09:00"
    horaFin: string;     // Format: "11:00"
    descripcion: string;
    tipo: AppointmentType;
    estado: AppointmentStatus;
    createdBy: string;
    createdAt: Date;
}

/**
 * Create Appointment DTO (Data Transfer Object)
 * Used when creating a new appointment
 */
export interface CreateAppointmentDTO {
    empresaId: string;
    ingenieroId: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    descripcion: string;
    tipo: AppointmentType;
}

/**
 * Update Appointment DTO
 * Used when updating an existing appointment
 */
export interface UpdateAppointmentDTO {
    fecha?: Date;
    horaInicio?: string;
    horaFin?: string;
    descripcion?: string;
    tipo?: AppointmentType;
    estado?: AppointmentStatus;
}

/**
 * Appointment filters (for admin search/filter)
 */
export interface AppointmentFilters {
    empresaId?: string;
    ingenieroId?: string;
    estado?: AppointmentStatus;
    tipo?: AppointmentType;
    fechaInicio?: Date;
    fechaFin?: Date;
    searchQuery?: string;
}
