import { AppointmentStatus, AppointmentType } from './roles';

/**
 * Appointment interface
 */
export interface Appointment {
    id: string;
    description: string;
    appointmentType: AppointmentType;
    date: Date; // Keep as Date or string? Backend likely sends ISO string. Ideally generic type, but Date is safer for logic if parsed.
    // However, fetch returns JSON strings. We will need to assume strings or parse them.
    // Let's use string for startTime/endTime (ISO) and Date for date if parsed manually, or string if raw.
    // Given the previous code assumed Date for `fecha`, we should probably parse it at fetch time OR handle string.
    // To minimize refactor, let's stick to string for time, Date for date (if we parse it).
    // BUT the backend returns `startTime` as full ISO.
    startTime: string; // ISO String or "HH:mm" if we transform it. Let's use string and parse ISO.
    endTime: string;   // ISO String
    location: string;
    status: AppointmentStatus;
    companyName?: string;
    engineerName?: string;
    // Keeping internal IDs if backend provides them or mapping needed
    empresaId?: string; // Optional if not returned directly but inferred
    ingenieroId?: string;
    representativeId?: string; // ID of the representative (user causing the appointment or owning it contextually)
}

/**
 * Create Appointment DTO (Data Transfer Object)
 * Used for creating a new appointment
 */
export interface CreateAppointmentDTO {
    description: string;
    appointmentType: AppointmentType;
    date: string; // YYYY-MM-DD
    startTime: string; // ISO String
    endTime: string; // ISO String
    location: string;
    // Optional fields for internal logic if needed, but backend payload is strictly the above
    empresaId?: string;
    ingenieroId?: string;
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
    page?: number;
    limit?: number;
}

/**
 * Paginated response structure from backend
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Appointment Validation structure
 */
export interface AppointmentValidation {
    id: string;
    appointmentId: string;
    status: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
    documentsCount: number;
    approvedDocumentsCount: number;
    createdBy: string;
    createdByName: string;
    reviewedBy: string;
    reviewedByName: string;
    reviewedAt: string;
    message: string;
}
