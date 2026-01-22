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
    <div className={`${dayClasses} group relative`} onClick={handleClick}>
      {/* Grefg style bubble */}
      {slots.length > 1 && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100">
           <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap relative">
              {slots.length} CITAS HOY
              {/* Little arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
           </div>
        </div>
      )}

      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-black ${
            isToday ? 'text-blue-600' : ''
          }`}
        >
          {dayNumber}
        </span>
      </div>
      
      {/* Custom Content or Default Slots */}
      <div className="flex-1 overflow-hidden relative">
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
                  className="w-full text-left px-1.5 py-0.5 text-xs rounded truncate shadow-sm font-bold"
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
    </div>
  );
}
