import { useState } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Mood } from '../types';

interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
  description: string;
  category: 'positive' | 'negative' | 'neutral' | 'energy';
}

const moodOptions: MoodOption[] = [
  // Positive emotions
  {
    value: Mood.HAPPY,
    label: 'Happy',
    emoji: '😊',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
    description: 'Feeling joyful and content',
    category: 'positive'
  },
  {
    value: Mood.EXCITED,
    label: 'Excited',
    emoji: '🤩',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
    description: 'Full of enthusiasm and anticipation',
    category: 'positive'
  },
  {
    value: Mood.GRATEFUL,
    label: 'Grateful',
    emoji: '🙏',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
    description: 'Feeling thankful and appreciative',
    category: 'positive'
  },
  {
    value: Mood.HOPEFUL,
    label: 'Hopeful',
    emoji: '🌟',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700',
    description: 'Optimistic about the future',
    category: 'positive'
  },
  {
    value: Mood.CALM,
    label: 'Calm',
    emoji: '😌',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    description: 'Peaceful and relaxed',
    category: 'positive'
  },

  // Negative emotions
  {
    value: Mood.SAD,
    label: 'Sad',
    emoji: '😢',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    description: 'Feeling down or melancholic',
    category: 'negative'
  },
  {
    value: Mood.ANXIOUS,
    label: 'Anxious',
    emoji: '😰',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    description: 'Worried or nervous about something',
    category: 'negative'
  },
  {
    value: Mood.ANGRY,
    label: 'Angry',
    emoji: '😠',
    color: 'bg-red-200 text-red-900 border-red-300 hover:bg-red-300 dark:bg-red-800 dark:text-red-100 dark:border-red-600',
    description: 'Feeling frustrated or irritated',
    category: 'negative'
  },
  {
    value: Mood.CONFUSED,
    label: 'Confused',
    emoji: '😕',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
    description: 'Uncertain or unclear about something',
    category: 'negative'
  },

  // Energy levels
  {
    value: Mood.ENERGETIC,
    label: 'Energetic',
    emoji: '⚡',
    color: 'bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200 dark:bg-lime-900 dark:text-lime-200 dark:border-lime-700',
    description: 'Full of energy and vitality',
    category: 'energy'
  },
  {
    value: Mood.TIRED,
    label: 'Tired',
    emoji: '😴',
    color: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
    description: 'Feeling drained or weary',
    category: 'energy'
  },

  // Neutral
  {
    value: Mood.NEUTRAL,
    label: 'Neutral',
    emoji: '😐',
    color: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
    description: 'Feeling balanced, neither positive nor negative',
    category: 'neutral'
  },
];

interface MoodSelectorProps {
  value: Mood | undefined;
  onChange: (mood: Mood | undefined) => void;
  disabled?: boolean;
  className?: string;
  layout?: 'grid' | 'dropdown' | 'compact';
  showLabels?: boolean;
  showDescriptions?: boolean;
  allowClear?: boolean;
}

export default function MoodSelector({
  value,
  onChange,
  disabled = false,
  className,
  layout = 'grid',
  showLabels = true,
  showDescriptions = false,
  allowClear = true
}: MoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMood, setHoveredMood] = useState<Mood | null>(null);

  const selectedMood = moodOptions.find(mood => mood.value === value);

  const handleMoodSelect = (mood: Mood) => {
    onChange(mood);
    if (layout === 'dropdown') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    if (layout === 'dropdown') {
      setIsOpen(false);
    }
  };

  // Grid layout
  if (layout === 'grid') {
    return (
      <div className={clsx('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <label className="label">How are you feeling?</label>
          {allowClear && value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => handleMoodSelect(mood.value)}
              onMouseEnter={() => setHoveredMood(mood.value)}
              onMouseLeave={() => setHoveredMood(null)}
              disabled={disabled}
              className={clsx(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                value === mood.value
                  ? mood.color.replace('hover:', '').replace('border-', 'border-2 border-') + ' ring-2 ring-primary-500 ring-offset-2'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-2xl">{mood.emoji}</span>
              {showLabels && (
                <span className={clsx(
                  'text-sm font-medium',
                  value === mood.value ? 'text-current' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {mood.label}
                </span>
              )}
              {showDescriptions && (hoveredMood === mood.value || value === mood.value) && (
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">
                  {mood.description}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category grouping for large grids */}
        {moodOptions.length > 8 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Positive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Negative</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Energy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Neutral</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dropdown layout
  if (layout === 'dropdown') {
    return (
      <div className={clsx('relative', className)}>
        <label className="label">Mood</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center justify-between gap-3 p-3 rounded-lg border',
            'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
            'hover:border-gray-400 dark:hover:border-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {selectedMood ? (
            <div className="flex items-center gap-3">
              <span className="text-xl">{selectedMood.emoji}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedMood.label}
                </div>
                {showDescriptions && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMood.description}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select your mood...</span>
          )}
          
          <ChevronDownIcon 
            className={clsx(
              'h-5 w-5 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )} 
          />
        </button>

        {isOpen && (
          <>
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
              {allowClear && value && (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    <span className="font-medium">Clear selection</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                </>
              )}
              
              {Object.entries(
                moodOptions.reduce((acc, mood) => {
                  if (!acc[mood.category]) acc[mood.category] = [];
                  acc[mood.category].push(mood);
                  return acc;
                }, {} as Record<string, MoodOption[]>)
              ).map(([category, moods], index) => (
                <div key={category}>
                  {index > 0 && <div className="border-t border-gray-200 dark:border-gray-700" />}
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1">
                      {category}
                    </div>
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => handleMoodSelect(mood.value)}
                        className={clsx(
                          'w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                          value === mood.value && 'bg-primary-50 dark:bg-primary-900/20'
                        )}
                      >
                        <span className="text-lg">{mood.emoji}</span>
                        <div className="text-left">
                          <div className={clsx(
                            'font-medium',
                            value === mood.value 
                              ? 'text-primary-700 dark:text-primary-300' 
                              : 'text-gray-900 dark:text-gray-100'
                          )}>
                            {mood.label}
                          </div>
                          {showDescriptions && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {mood.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
          </>
        )}
      </div>
    );
  }

  // Compact layout - horizontal scrolling
  if (layout === 'compact') {
    return (
      <div className={clsx('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <label className="label text-sm">Mood</label>
          {allowClear && value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => handleMoodSelect(mood.value)}
              disabled={disabled}
              className={clsx(
                'flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                value === mood.value
                  ? mood.color.replace('hover:', '')
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={mood.description}
            >
              <span className="text-lg">{mood.emoji}</span>
              {showLabels && (
                <span className={clsx(
                  'text-xs font-medium whitespace-nowrap',
                  value === mood.value ? 'text-current' : 'text-gray-600 dark:text-gray-400'
                )}>
                  {mood.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}