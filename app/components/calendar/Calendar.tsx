'use client';

import { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import { CalendarProps } from './types';
import { getCalendarDays, addMonths, subtractMonths } from './utils';

export default function Calendar({
  selectedDate,
  onDateChange,
  slots = [],
  onSlotClick,
  onDayClick,
  renderDayContent,
  onMonthChange,
  className = ''
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  
  const handlePrevMonth = () => {
    const newDate = subtractMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange(today);
    if (onMonthChange) onMonthChange(today);
  };
  
  const handleDayClick = (date: Date) => {
    onDateChange(date);
    if (onDayClick) {
      onDayClick(date);
    }
  };
  
  const calendarDays = getCalendarDays(currentDate);
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col ${className}`}>
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      {/* Calendar Grid */}
      <CalendarGrid
        days={calendarDays}
        currentMonth={currentDate.getMonth()}
        currentDate={currentDate}
        slots={slots}
        onDayClick={handleDayClick}
        onSlotClick={onSlotClick}
        renderDayContent={renderDayContent}
      />
    </div>
  );
}
