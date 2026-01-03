import { TimeSlot } from '@/app/types';

/**
 * Props for Calendar component
 */
export interface CalendarProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    slots?: TimeSlot[];
    onSlotClick?: (slot: TimeSlot) => void;
    onDayClick?: (date: Date) => void;
    className?: string;
}

/**
 * Props for CalendarHeader component
 */
export interface CalendarHeaderProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday?: () => void;
}

/**
 * Props for CalendarGrid component
 */
export interface CalendarGridProps {
    days: Date[];
    currentMonth: number;
    currentDate: Date;
    slots?: TimeSlot[];
    onDayClick?: (date: Date) => void;
    onSlotClick?: (slot: TimeSlot) => void;
}

/**
 * Props for CalendarDay component
 */
export interface CalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    slots?: TimeSlot[];
    onClick?: () => void;
    onSlotClick?: (slot: TimeSlot) => void;
}
