/**
 * TimeSlot represents a time period in the calendar
 */
export interface TimeSlot {
    date: Date;
    startTime: string;  // Format: "09:00"
    endTime: string;    // Format: "11:00"
    isAvailable: boolean;
    appointmentId?: string;  // If occupied, the ID of the appointment
    isMyAppointment?: boolean; // For empresarios: true if this is their appointment
}

/**
 * Calendar Day (for rendering)
 */
export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    slots: TimeSlot[];
}

/**
 * Engineer Availability (for empresarios)
 */
export interface EngineerAvailability {
    ingenieroId: string;
    ingenieroName: string;
    availableSlots: TimeSlot[];
    occupiedSlots: TimeSlot[];
}

/**
 * Calendar view mode
 */
export enum CalendarViewMode {
    MONTH = 'month',
    WEEK = 'week',
    DAY = 'day'
}
