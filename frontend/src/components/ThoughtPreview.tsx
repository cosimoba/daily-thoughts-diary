import { useState } from 'react';
import { 
  EyeIcon, 
  PencilIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import { Entry, Mood, CreateEntryDto, UpdateEntryDto } from '../types';

interface ThoughtPreviewProps {
  // For preview of existing entry
  entry?: Entry;
  // For preview of draft/new entry
  title?: string;
  content: string;
  mood?: Mood;
  tags?: string[];
  location?: string;
  weather?: string;
  attachments?: Array<{ url: string; filename: string }>;
  // Component props
  className?: string;
  showMetadata?: boolean;
  showEditButton?: boolean;
  onEdit?: () => void;
  mode?: 'card' | 'full' | 'minimal';
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

export default function ThoughtPreview({
  entry,
  title,
  content,
  mood,
  tags = [],
  location,
  weather,
  attachments = [],
  className,
  showMetadata = true,
  showEditButton = false,
  onEdit,
  mode = 'card'
}: ThoughtPreviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Use entry data if available, otherwise use individual props
  const displayTitle = entry?.title || title;
  const displayContent = entry?.content || content;
  const displayMood = entry?.mood || mood;
  const displayTags = entry?.tags?.map(tag => tag.name) || tags;
  const displayLocation = entry?.location || location;
  const displayWeather = entry?.weather || weather;
  const displayAttachments = entry?.attachments || attachments;
  const displayDate = entry?.createdAt ? new Date(entry.createdAt) : new Date();
  const displayUpdatedDate = entry?.updatedAt ? new Date(entry.updatedAt) : null;

  // Calculate reading time and word count
  const plainText = displayContent.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readingTimeMinutes = Math.ceil(wordCount / 225); // Average reading speed

  // Get tag colors
  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ];
    return colors[index % colors.length];
  };

  // Render content based on mode
  if (mode === 'minimal') {
    return (
      <div className={clsx('space-y-3', className)}>
        {displayTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h3>
        )}
        
        <div 
          className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
        
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayTags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  getTagColor(index)
                )}
              >
                <TagIcon className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {displayTags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{displayTags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'full') {
    return (
      <div className={clsx('max-w-4xl mx-auto', className)}>
        {/* Header */}
        <div className="mb-8">
          {displayTitle && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {displayTitle}
            </h1>
          )}
          
          {showMetadata && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(displayDate, 'PPP')}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>{readingTimeMinutes} min read</span>
              </div>
              
              <span>{wordCount} words</span>
              
              {displayUpdatedDate && displayUpdatedDate.getTime() !== displayDate.getTime() && (
                <span>• Updated {formatDistanceToNow(displayUpdatedDate)} ago</span>
              )}
            </div>
          )}

          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Entry
            </button>
          )}
        </div>

        {/* Mood and Metadata */}
        {(displayMood || displayLocation || displayWeather) && (
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {displayMood && (
              <div className={clsx(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                moodColors[displayMood]
              )}>
                <span className="text-base">{moodEmojis[displayMood]}</span>
                {displayMood.toLowerCase()}
              </div>
            )}
            
            {displayLocation && (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4" />
                {displayLocation}
              </div>
            )}
            
            {displayWeather && (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <CloudIcon className="h-4 w-4" />
                {displayWeather}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />

        {/* Attachments */}
        {displayAttachments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Attachments
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayAttachments.map((attachment, index) => (
                <button
                  key={index}
                  onClick={() => setImagePreview(attachment.url)}
                  className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <EyeIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                    getTagColor(index)
                  )}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
            <div className="relative max-w-4xl max-h-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setImagePreview(null)} 
            />
          </div>
        )}
      </div>
    );
  }

  // Default card mode
  return (
    <div className={clsx('card p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {displayTitle && (
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {displayTitle}
            </h3>
          )}
          
          {showMetadata && (
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{format(displayDate, 'MMM d, yyyy')}</span>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          )}
        </div>

        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mood and Location */}
      {(displayMood || displayLocation || displayWeather) && (
        <div className="flex flex-wrap items-center gap-2">
          {displayMood && (
            <span className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              moodColors[displayMood]
            )}>
              <span>{moodEmojis[displayMood]}</span>
              {displayMood.toLowerCase()}
            </span>
          )}
          
          {displayLocation && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <MapPinIcon className="h-3 w-3" />
              {displayLocation}
            </span>
          )}
          
          {displayWeather && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <CloudIcon className="h-3 w-3" />
              {displayWeather}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div 
        className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />

      {/* Attachments Preview */}
      {displayAttachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayAttachments.slice(0, 4).map((attachment, index) => (
            <button
              key={index}
              onClick={() => setImagePreview(attachment.url)}
              className="flex-shrink-0 w-16 h-16 rounded overflow-hidden hover:opacity-90 transition-opacity"
            >
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {displayAttachments.length > 4 && (
            <div className="flex-shrink-0 w-16 h-16 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500">
              +{displayAttachments.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayTags.slice(0, 5).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                getTagColor(index)
              )}
            >
              <TagIcon className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {displayTags.length > 5 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{displayTags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              ×
            </button>
          </div>
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setImagePreview(null)} 
          />
        </div>
      )}
    </div>
  );
}