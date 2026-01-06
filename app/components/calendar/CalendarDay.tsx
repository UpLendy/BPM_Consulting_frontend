'use client';

import { CalendarDayProps } from './types';
import { TimeSlot } from '@/app/types';

export default function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  isPast,
  slots = [],
  onClick,
  onSlotClick,
  renderCustomContent
}: CalendarDayProps) {
  const dayNumber = date.getDate();
  
  // Base classes
  let dayClasses = 'h-full p-2 border border-gray-200 transition-colors flex flex-col ';
  
  // Styling based on state
  if (!isCurrentMonth) {
    dayClasses += 'bg-gray-50 text-gray-400 ';
  } else if (isPast) {
    dayClasses += 'bg-white text-gray-500 ';
  } else {
    dayClasses += 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer ';
  }
  
  if (isToday) {
    dayClasses += 'ring-2 ring-blue-500 ';
  }
  
  const handleClick = () => {
    if (!isPast && isCurrentMonth && onClick) {
      onClick();
    }
  };
  
  return (
    <div className={dayClasses} onClick={handleClick}>
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium ${
            isToday ? 'text-blue-600' : ''
          }`}
        >
          {dayNumber}
        </span>
      </div>
      
      {/* Custom Content or Default Slots */}
      {renderCustomContent ? (
        renderCustomContent()
      ) : (
        <div className="space-y-1">
          {slots.map((slot, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (onSlotClick) {
                  onSlotClick(slot);
                }
              }}
              className="w-full text-left px-1.5 py-0.5 text-xs rounded truncate"
              style={{
                backgroundColor: slot.isAvailable ? '#10b981' : '#6b7280',
                color: 'white'
              }}
            >
              {slot.startTime}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
