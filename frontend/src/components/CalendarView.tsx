import { useState, useMemo } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import clsx from 'clsx';
import { useEntriesByDate } from '../hooks/useEntries';
import { CalendarSkeleton } from './ui/LoadingSkeleton';

interface CalendarViewProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  className?: string;
  showEntryCounts?: boolean;
}

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  hasEntries: boolean;
  entryCount: number;
  onClick: () => void;
}

function CalendarDay({ 
  date, 
  isCurrentMonth, 
  isSelected, 
  isToday: isTodayDate, 
  hasEntries, 
  entryCount, 
  onClick 
}: CalendarDayProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative w-full h-10 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        {
          // Current month styling
          'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700': 
            isCurrentMonth && !isSelected && !isTodayDate,
          
          // Other month styling
          'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800': 
            !isCurrentMonth,
          
          // Selected date styling
          'bg-primary-600 text-white hover:bg-primary-700': 
            isSelected,
          
          // Today styling (when not selected)
          'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-800': 
            isTodayDate && !isSelected,
          
          // Has entries styling
          'ring-2 ring-green-200 dark:ring-green-800': 
            hasEntries && !isSelected,
        }
      )}
      title={
        hasEntries 
          ? `${format(date, 'MMMM d, yyyy')} - ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`
          : format(date, 'MMMM d, yyyy')
      }
    >
      <span className="block">
        {format(date, 'd')}
      </span>
      
      {/* Entry indicator dots */}
      {hasEntries && !isSelected && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {Array.from({ length: Math.min(entryCount, 3) }).map((_, index) => (
            <div
              key={index}
              className={clsx(
                'w-1 h-1 rounded-full',
                isTodayDate
                  ? 'bg-primary-600 dark:bg-primary-400'
                  : 'bg-green-500 dark:bg-green-400'
              )}
            />
          ))}
          {entryCount > 3 && (
            <div className="text-xs leading-none">+</div>
          )}
        </div>
      )}
    </button>
  );
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({
  selectedDate,
  onDateSelect,
  onMonthChange,
  className,
  showEntryCounts = true
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  // Get entries for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { data: entriesByDate, isLoading } = useEntriesByDate(
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Get entry count for a specific date
  const getEntryCountForDate = (date: Date) => {
    if (!entriesByDate || !showEntryCounts) return 0;
    const dateKey = format(date, 'yyyy-MM-dd');
    return entriesByDate[dateKey]?.length || 0;
  };

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect?.(today);
    onMonthChange?.(today);
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className={clsx('card p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const entryCount = getEntryCountForDate(date);
          const hasEntries = entryCount > 0;
          
          return (
            <CalendarDay
              key={format(date, 'yyyy-MM-dd')}
              date={date}
              isCurrentMonth={isSameMonth(date, currentMonth)}
              isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
              isToday={isToday(date)}
              hasEntries={hasEntries}
              entryCount={entryCount}
              onClick={() => handleDateClick(date)}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showEntryCounts && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary-100 dark:bg-primary-900 border border-primary-200 dark:border-primary-800" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-800" />
            <span>Has entries</span>
          </div>
        </div>
      )}
    </div>
  );
}