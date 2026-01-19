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
    CreateUserDTO
} from './user';
export { mapBackendUserToUser } from './user';

// Appointment types
export type {
    Appointment,
    CreateAppointmentDTO,
    UpdateAppointmentDTO,
    AppointmentFilters
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
