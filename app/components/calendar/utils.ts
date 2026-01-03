/**
 * Calendar utility functions
 */

/**
 * Get the number of days in a given month
 */
export function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/**
 * Get the last day of the month (0 = Sunday, 6 = Saturday)
 */
export function getLastDayOfMonth(date: Date): number {
    const daysInMonth = getDaysInMonth(date);
    return new Date(date.getFullYear(), date.getMonth(), daysInMonth).getDay();
}

/**
 * Get all days to display in calendar grid (including prev/next month days)
 */
export function getCalendarDays(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = getFirstDayOfMonth(date);
    const daysInMonth = getDaysInMonth(date);
    const daysInPrevMonth = getDaysInMonth(new Date(year, month - 1));

    const days: Date[] = [];

    // Previous month days (to fill the first week)
    // Adjust for Monday start (firstDay - 1, or 6 if Sunday)
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = startDay - 1; i >= 0; i--) {
        days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Next month days (to complete the grid to 42 days = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
    }

    return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    if (format === 'short') {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Get month name in Spanish
 */
export function getMonthName(date: Date): string {
    return date.toLocaleDateString('es-ES', { month: 'long' });
}

/**
 * Get year from date
 */
export function getYear(date: Date): number {
    return date.getFullYear();
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
}

/**
 * Subtract months from a date
 */
export function subtractMonths(date: Date, months: number): Date {
    return addMonths(date, -months);
}

/**
 * Get day names in Spanish (starting Monday)
 */
export function getDayNames(short: boolean = true): string[] {
    if (short) {
        return ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    }
    return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
}
