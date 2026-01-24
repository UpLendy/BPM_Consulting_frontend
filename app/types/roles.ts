/**
 * Role enumeration for BPM Consulting users
 */
export enum UserRole {
    ADMIN = 'admin',
    INGENIERO = 'ingeniero',
    EMPRESARIO = 'empresario'
}

/**
 * Appointment status enumeration
 */
export enum AppointmentStatus {
    PROGRAMADA = 'PROGRAMADA',
    CONFIRMADA = 'CONFIRMADA',
    EN_PROGRESO = 'EN_PROGRESO',
    EN_REVISION = 'EN_REVISION',
    COMPLETADA = 'COMPLETADA',
    CANCELADA = 'CANCELADA'
}

/**
 * Appointment type enumeration
 */
export enum AppointmentType {
    ASESORIA = 'ASESORIA',
    AUDITORIA = 'AUDITORIA',
    SEGUIMIENTO = 'SEGUIMIENTO'
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isUserRole(value: string): value is UserRole {
    return Object.values(UserRole).includes(value as UserRole);
}

/**
 * Type guard to check if a string is a valid AppointmentStatus
 */
export function isAppointmentStatus(value: string): value is AppointmentStatus {
    return Object.values(AppointmentStatus).includes(value as AppointmentStatus);
}

/**
 * Type guard to check if a string is a valid AppointmentType
 */
export function isAppointmentType(value: string): value is AppointmentType {
    return Object.values(AppointmentType).includes(value as AppointmentType);
}
