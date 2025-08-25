import { useState } from 'react';
import { 
  HeartIcon, 
  TagIcon, 
  CalendarIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import { Entry, Mood } from '../types';
import { useToggleFavorite } from '../hooks/useEntries';

interface ThoughtCardProps {
  entry: Entry;
  onView?: (entry: Entry) => void;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entry: Entry) => void;
  onShare?: (entry: Entry) => void;
  compact?: boolean;
}

const moodColors = {
  HAPPY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  SAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  EXCITED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  ANXIOUS: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CALM: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ANGRY: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
  GRATEFUL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  CONFUSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  HOPEFUL: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  TIRED: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  ENERGETIC: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  NEUTRAL: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const moodEmojis = {
  HAPPY: '😊',
  SAD: '😢',
  EXCITED: '🤩',
  ANXIOUS: '😰',
  CALM: '😌',
  ANGRY: '😠',
  GRATEFUL: '🙏',
  CONFUSED: '😕',
  HOPEFUL: '🌟',
  TIRED: '😴',
  ENERGETIC: '⚡',
  NEUTRAL: '😐',
};

export default function ThoughtCard({
  entry,
  onView,
  onEdit,
  onDelete,
  onShare,
  compact = false
}: ThoughtCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const toggleFavoriteMutation = useToggleFavorite();

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate({
      id: entry.id,
      isFavorite: !entry.isFavorite
    });
  };

  const formatContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={clsx(
      'card card-hover transition-all duration-200',
      compact ? 'p-4' : 'p-6',
      'group'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {entry.title && (
            <h3 className={clsx(
              'font-semibold text-gray-900 dark:text-gray-100 truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {entry.title}
            </h3>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <time 
              className="text-xs text-gray-500 dark:text-gray-400"
              dateTime={entry.createdAt}
            >
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </time>
            
            {entry.location && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                • {entry.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavoriteMutation.isPending}
            className={clsx(
              'p-1.5 rounded-full transition-colors',
              entry.isFavorite
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
            aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {entry.isFavorite ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="More options"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                {onView && (
                  <button
                    onClick={() => {
                      onView(entry);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View
                  </button>
                )}
                
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(entry);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                )}
                
                {onShare && (
                  <button
                    onClick={() => {
                      onShare(entry);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ShareIcon className="h-4 w-4" />
                    Share
                  </button>
                )}
                
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(entry);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className={clsx(
          'text-gray-700 dark:text-gray-300 mb-4 cursor-pointer',
          compact ? 'text-sm' : 'text-base'
        )}
        onClick={() => onView?.(entry)}
      >
        {formatContent(entry.content, compact ? 100 : 150)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mood */}
          {entry.mood && (
            <span className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              moodColors[entry.mood]
            )}>
              <span>{moodEmojis[entry.mood]}</span>
              {entry.mood.toLowerCase()}
            </span>
          )}

          {/* Tags */}
          {entry.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
            <span
              key={tag.id}
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                getTagColor(index)
              )}
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
            </span>
          ))}
          
          {entry.tags.length > (compact ? 2 : 3) && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{entry.tags.length - (compact ? 2 : 3)} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>{entry.wordCount} words</span>
          </span>
          
          {entry.updatedAt !== entry.createdAt && (
            <span title={`Last edited ${format(new Date(entry.updatedAt), 'PPp')}`}>
              edited
            </span>
          )}
        </div>
      </div>

      {/* Click overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}