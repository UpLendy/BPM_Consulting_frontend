/**
 * Central export file for all types
 * Import from here to get all types in one place
 */

// Roles and Enums
export {
    UserRole,
    AppointmentStatus,
    AppointmentType,
    isUserRole,
    isAppointmentStatus,
    isAppointmentType
} from './roles';

// User types
export type {
    User,
    UserBackend,
    CreateUserDTO,
    UpdateUserDTO
} from './user';
export { mapBackendUserToUser } from './user';

// Appointment types
export type {
    Appointment,
    CreateAppointmentDTO,
    UpdateAppointmentDTO,
    RescheduleAppointmentDTO,
    AppointmentFilters,
    PaginatedResponse
} from './appointment';

// TimeSlot and Calendar types
export type {
    TimeSlot,
    CalendarDay,
    EngineerAvailability
} from './timeSlot';
export { CalendarViewMode } from './timeSlot';

// Company types
export type {
    Company,
    CreateCompanyDTO
} from './company';

// Engineer types
export type {
    Engineer,
    CreateEngineerDTO,
    AssignCompanyDTO
} from './engineer';

// Representative types
export type {
    Representative,
    CreateRepresentativeDTO
} from './representative';
