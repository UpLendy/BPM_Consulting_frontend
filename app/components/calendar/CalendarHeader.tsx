'use client';

import { CalendarHeaderProps } from './types';
import { getMonthName, getYear } from './utils';

export default function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday
}: CalendarHeaderProps) {
  const monthName = getMonthName(currentDate);
  const year = getYear(currentDate);
  
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      {/* Month and Year */}
      <h2 className="text-xl font-semibold text-gray-900 capitalize">
        {monthName} - {year}
      </h2>
      
      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        {/* Today Button (optional) */}
        {onToday && (
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Hoy
          </button>
        )}
        
        {/* Previous Month */}
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        
        {/* Next Month */}
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
