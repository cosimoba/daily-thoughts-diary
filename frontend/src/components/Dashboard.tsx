import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useEntriesByDate } from '../hooks/useEntries';
import { Entry } from '../types';
import ThoughtCard from './ThoughtCard';
import EmptyState from './ui/EmptyState';
import { EntryCardSkeleton } from './ui/LoadingSkeleton';
import LoadingSpinner from './ui/LoadingSpinner';

interface DashboardProps {
  selectedDate?: Date;
  viewMode?: 'timeline' | 'compact';
  onViewEntry?: (entry: Entry) => void;
  onEditEntry?: (entry: Entry) => void;
  onDeleteEntry?: (entry: Entry) => void;
}

interface DayGroupProps {
  date: string;
  entries: Entry[];
  onViewEntry?: (entry: Entry) => void;
  onEditEntry?: (entry: Entry) => void;
  onDeleteEntry?: (entry: Entry) => void;
  viewMode: 'timeline' | 'compact';
}

function DayGroup({ 
  date, 
  entries, 
  onViewEntry, 
  onEditEntry, 
  onDeleteEntry, 
  viewMode 
}: DayGroupProps) {
  const dateObj = parseISO(date);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getTotalWords = () => {
    return entries.reduce((total, entry) => total + entry.wordCount, 0);
  };

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatDateLabel(dateObj)}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </span>
              <span>
                {getTotalWords()} words
              </span>
              <time dateTime={date}>
                {format(dateObj, 'MMM d, yyyy')}
              </time>
            </div>
          </div>
          
          <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Entries */}
      {isExpanded && (
        <div className={
          viewMode === 'compact' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {entries.map((entry) => (
            <ThoughtCard
              key={entry.id}
              entry={entry}
              onView={onViewEntry}
              onEdit={onEditEntry}
              onDelete={onDeleteEntry}
              compact={viewMode === 'compact'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  selectedDate,
  viewMode = 'timeline',
  onViewEntry,
  onEditEntry,
  onDeleteEntry
}: DashboardProps) {
  const navigate = useNavigate();
  
  // Calculate date range for fetching entries
  const dateRange = useMemo(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return { from: dateStr, to: dateStr };
    }
    
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      from: format(thirtyDaysAgo, 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd')
    };
  }, [selectedDate]);

  const { 
    data: entriesByDate, 
    isLoading, 
    error,
    refetch 
  } = useEntriesByDate(dateRange.from, dateRange.to);

  const handleViewEntry = (entry: Entry) => {
    if (onViewEntry) {
      onViewEntry(entry);
    } else {
      navigate(`/entries/${entry.id}`);
    }
  };

  const handleEditEntry = (entry: Entry) => {
    if (onEditEntry) {
      onEditEntry(entry);
    } else {
      navigate(`/entries/${entry.id}/edit`);
    }
  };

  const handleDeleteEntry = (entry: Entry) => {
    if (onDeleteEntry) {
      onDeleteEntry(entry);
    }
    // Note: Delete functionality should be handled by parent component or hook
  };

  const handleCreateEntry = () => {
    navigate('/entries/new');
  };

  // Transform data into sorted array of [date, entries] pairs
  const sortedEntries = useMemo(() => {
    if (!entriesByDate) return [];
    
    return Object.entries(entriesByDate)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .filter(([_, entries]) => entries.length > 0);
  }, [entriesByDate]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton for date headers and entries */}
        {Array.from({ length: 3 }).map((_, dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            
            <div className={
              viewMode === 'compact' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }>
              {Array.from({ length: viewMode === 'compact' ? 3 : 2 }).map((_, entryIndex) => (
                <EntryCardSkeleton key={entryIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Failed to load entries. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          Retry
        </button>
      </div>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <EmptyState
        title="No thoughts yet"
        description={
          selectedDate
            ? `No entries found for ${format(selectedDate, 'MMMM d, yyyy')}. Start writing to capture your thoughts for this day.`
            : "You haven't written any thoughts yet. Start your journey by creating your first entry."
        }
        icon={
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" 
            />
          </svg>
        }
        action={{
          label: selectedDate ? 'Add entry for this date' : 'Write your first thought',
          onClick: handleCreateEntry,
          variant: 'primary'
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {sortedEntries.map(([date, entries]) => (
        <DayGroup
          key={date}
          date={date}
          entries={entries}
          onViewEntry={handleViewEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          viewMode={viewMode}
        />
      ))}

      {/* Load more indicator or pagination could go here */}
      {sortedEntries.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing entries from {format(parseISO(dateRange.from), 'MMM d')} to {format(parseISO(dateRange.to), 'MMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  );
}