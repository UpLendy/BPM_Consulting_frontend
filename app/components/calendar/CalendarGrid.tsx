'use client';

import CalendarDay from './CalendarDay';
import { CalendarGridProps } from './types';
import { isToday, isPast, getDayNames } from './utils';

export default function CalendarGrid({
  days,
  currentMonth,
  currentDate,
  slots = [],
  onDayClick,
  onSlotClick,
  renderDayContent
}: CalendarGridProps) {
  const dayNames = getDayNames(true);
  
  // Group slots by date for easy lookup
  const slotsByDate = slots.reduce((acc, slot) => {
    const dateKey = slot.date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);
  
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Day Names Header */}
      <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-50 shrink-0">
        {dayNames.map((dayName, index) => (
          <div
            key={index}
            className="py-2 text-center text-sm font-semibold text-gray-700"
          >
            {dayName}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day, index) => {
          const dateKey = day.toDateString();
          const daySlots = slotsByDate[dateKey] || [];
          
          return (
            <CalendarDay
              key={index}
              date={day}
              isCurrentMonth={day.getMonth() === currentMonth}
              isToday={isToday(day)}
              isPast={isPast(day)}
              slots={daySlots}
              onClick={() => onDayClick && onDayClick(day)}
              onSlotClick={onSlotClick}
              renderCustomContent={renderDayContent ? () => renderDayContent(day, daySlots) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
