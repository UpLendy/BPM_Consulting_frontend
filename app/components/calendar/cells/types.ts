/**
 * IMPORTANT: Cell types for different user roles
 * 
 * INGENIERO: Shows only their appointments with full details
 * - Can click to view details
 * - Color coded by appointment type
 * 
 * EMPRESARIO: Shows availability slots
 * - Green = Available (can schedule)
 * - Gray = Occupied by others (no click)
 * - Blue = Their own appointments (can view)
 */

import { Appointment, AppointmentType, TimeSlot } from '@/app/types';

/**
 * Props for Ingeniero appointment cell
 */
export interface IngenieroAppointmentCellProps {
    appointment: Appointment;
    onClick: (appointment: Appointment) => void;
    className?: string;
    isOwn?: boolean;
}

/**
 * Props for Empresario cells
 */
export interface EmpresarioAvailableCellProps {
    slot: TimeSlot;
    onSchedule: (slot: TimeSlot) => void;
    className?: string;
}

export interface EmpresarioOccupiedCellProps {
    slot: TimeSlot;
    className?: string;
}

export interface EmpresarioMyAppointmentCellProps {
    appointment: Appointment;
    slot: TimeSlot;
    onView: (appointment: Appointment) => void;
    className?: string;
}

/**
 * Helper to get color for appointment type
 */
export function getAppointmentColor(type: AppointmentType): string {
    switch (type) {
        case AppointmentType.ASESORIA:
            return 'bg-blue-500 hover:bg-blue-600';
        case AppointmentType.AUDITORIA:
            return 'bg-purple-500 hover:bg-purple-600';
        default:
            return 'bg-gray-500 hover:bg-gray-600';
    }
}

/**
 * Helper to get text color for appointment type
 */
export function getAppointmentTextColor(type: AppointmentType): string {
    switch (type) {
        case AppointmentType.ASESORIA:
            return 'text-blue-700';
        case AppointmentType.AUDITORIA:
            return 'text-purple-700';
        default:
            return 'text-gray-700';
    }
}
