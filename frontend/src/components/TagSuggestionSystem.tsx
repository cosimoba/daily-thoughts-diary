import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TagIcon, 
  XMarkIcon, 
  PlusIcon,
  SparklesIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { apiClient } from '../services/api';
import { Tag } from '../types';

interface TagSuggestion {
  id: string;
  name: string;
  confidence: number;
  source: 'nlp' | 'existing' | 'manual';
  color?: string;
}

interface TagSuggestionSystemProps {
  content: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
}

// NLP utilities (similar to backend but for client-side)
const extractTagsFromContent = (text: string): TagSuggestion[] => {
  if (!text.trim()) return [];

  const lowercaseText = text.toLowerCase();
  const words = text.match(/\b\w+\b/g) || [];
  
  // Common emotion/mood keywords
  const emotionKeywords = [
    { word: 'happy', confidence: 0.9 },
    { word: 'sad', confidence: 0.9 },
    { word: 'excited', confidence: 0.8 },
    { word: 'anxious', confidence: 0.8 },
    { word: 'grateful', confidence: 0.9 },
    { word: 'angry', confidence: 0.8 },
    { word: 'frustrated', confidence: 0.7 },
    { word: 'peaceful', confidence: 0.8 },
    { word: 'confident', confidence: 0.7 },
    { word: 'worried', confidence: 0.8 },
    { word: 'joyful', confidence: 0.8 },
    { word: 'stressed', confidence: 0.8 },
    { word: 'calm', confidence: 0.8 },
    { word: 'overwhelmed', confidence: 0.7 }
  ];

  // Activity keywords
  const activityKeywords = [
    { word: 'work', confidence: 0.7 },
    { word: 'workout', confidence: 0.8 },
    { word: 'exercise', confidence: 0.8 },
    { word: 'meeting', confidence: 0.7 },
    { word: 'travel', confidence: 0.8 },
    { word: 'family', confidence: 0.8 },
    { word: 'friends', confidence: 0.8 },
    { word: 'project', confidence: 0.7 },
    { word: 'study', confidence: 0.7 },
    { word: 'reading', confidence: 0.7 },
    { word: 'cooking', confidence: 0.7 },
    { word: 'music', confidence: 0.7 },
    { word: 'movie', confidence: 0.6 },
    { word: 'shopping', confidence: 0.6 },
    { word: 'nature', confidence: 0.7 },
    { word: 'beach', confidence: 0.8 },
    { word: 'mountain', confidence: 0.8 }
  ];

  // Life events
  const eventKeywords = [
    { word: 'birthday', confidence: 0.9 },
    { word: 'anniversary', confidence: 0.9 },
    { word: 'graduation', confidence: 0.9 },
    { word: 'wedding', confidence: 0.9 },
    { word: 'promotion', confidence: 0.8 },
    { word: 'interview', confidence: 0.8 },
    { word: 'vacation', confidence: 0.8 },
    { word: 'holiday', confidence: 0.7 }
  ];

  const allKeywords = [...emotionKeywords, ...activityKeywords, ...eventKeywords];
  const suggestions: TagSuggestion[] = [];

  // Extract keyword-based tags
  allKeywords.forEach(({ word, confidence }) => {
    if (lowercaseText.includes(word)) {
      suggestions.push({
        id: `nlp-${word}`,
        name: word,
        confidence,
        source: 'nlp'
      });
    }
  });

  // Extract capitalized words (potential proper nouns/important terms)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
  capitalizedWords.forEach((word, index) => {
    if (word.length > 3 && !['This', 'That', 'The', 'And', 'But', 'Or'].includes(word)) {
      suggestions.push({
        id: `proper-${word}-${index}`,
        name: word.toLowerCase(),
        confidence: 0.6,
        source: 'nlp'
      });
    }
  });

  // Extract hashtags if any
  const hashtags = text.match(/#\w+/g) || [];
  hashtags.forEach((hashtag, index) => {
    suggestions.push({
      id: `hashtag-${index}`,
      name: hashtag.slice(1).toLowerCase(),
      confidence: 0.9,
      source: 'manual'
    });
  });

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = suggestions.reduce((acc, current) => {
    const existing = acc.find(item => item.name === current.name);
    if (!existing || current.confidence > existing.confidence) {
      return acc.filter(item => item.name !== current.name).concat(current);
    }
    return acc;
  }, [] as TagSuggestion[]);

  return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
};

export default function TagSuggestionSystem({ 
  content, 
  selectedTags, 
  onTagsChange, 
  disabled = false,
  maxTags = 10,
  className 
}: TagSuggestionSystemProps) {
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Generate NLP suggestions from content
  const nlpSuggestions = useMemo(() => {
    return extractTagsFromContent(content);
  }, [content]);

  // Filter existing tags based on content and current selection
  const existingTagSuggestions = useMemo(() => {
    if (!content.trim()) return [];

    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\W+/).filter(word => word.length > 2);

    return existingTags
      .filter(tag => !selectedTags.includes(tag.name))
      .filter(tag => {
        const tagLower = tag.name.toLowerCase();
        return words.some(word => 
          word.includes(tagLower) || 
          tagLower.includes(word) ||
          contentLower.includes(tagLower)
        );
      })
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        confidence: 0.5,
        source: 'existing' as const,
        color: tag.color
      }))
      .slice(0, 5);
  }, [existingTags, content, selectedTags]);

  // Combine and deduplicate suggestions
  const allSuggestions = useMemo(() => {
    const combined = [...nlpSuggestions, ...existingTagSuggestions];
    const unique = combined.reduce((acc, current) => {
      const existing = acc.find(item => item.name.toLowerCase() === current.name.toLowerCase());
      if (!existing) {
        acc.push(current);
      } else if (current.confidence > existing.confidence) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
      return acc;
    }, [] as TagSuggestion[]);

    return unique
      .filter(suggestion => !selectedTags.includes(suggestion.name))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  }, [nlpSuggestions, existingTagSuggestions, selectedTags]);

  // Load existing tags from API
  const loadExistingTags = useCallback(async () => {
    try {
      setIsLoadingTags(true);
      const response = await apiClient.get('/tags');
      setExistingTags(response.data.data || []);
    } catch (error) {
      console.error('Failed to load existing tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  // Load existing tags on mount
  useEffect(() => {
    loadExistingTags();
  }, [loadExistingTags]);

  // Add tag handler
  const handleAddTag = (tagName: string) => {
    if (!tagName.trim() || selectedTags.includes(tagName.trim()) || selectedTags.length >= maxTags) {
      return;
    }

    const newTags = [...selectedTags, tagName.trim()];
    onTagsChange(newTags);
    setCustomTagInput('');
    setShowCustomInput(false);
  };

  // Remove tag handler
  const handleRemoveTag = (tagName: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagName);
    onTagsChange(newTags);
  };

  // Handle custom tag input
  const handleCustomTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTagInput.trim()) {
      handleAddTag(customTagInput.trim());
    }
  };

  // Get tag color
  const getTagColor = (index: number, color?: string) => {
    if (color) return color;
    
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    ];
    return colors[index % colors.length];
  };

  const getSuggestionIcon = (source: TagSuggestion['source']) => {
    switch (source) {
      case 'nlp':
        return SparklesIcon;
      case 'existing':
        return TagIcon;
      case 'manual':
        return HashtagIcon;
      default:
        return TagIcon;
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="label">Selected Tags ({selectedTags.length}/{maxTags})</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <span
                key={`selected-${tag}`}
                className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                  getTagColor(index)
                )}
              >
                <TagIcon className="h-3 w-3" />
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tag Suggestions */}
      {allSuggestions.length > 0 && selectedTags.length < maxTags && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="label mb-0">Suggested Tags</label>
            <SparklesIcon className="h-4 w-4 text-primary-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            {allSuggestions.map((suggestion, index) => {
              const IconComponent = getSuggestionIcon(suggestion.source);
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleAddTag(suggestion.name)}
                  disabled={disabled}
                  className={clsx(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                    'border border-dashed border-gray-300 dark:border-gray-600',
                    'hover:bg-primary-50 hover:border-primary-300 dark:hover:bg-primary-900/20 dark:hover:border-primary-600',
                    'transition-all duration-200 cursor-pointer',
                    suggestion.confidence >= 0.8 && 'border-primary-300 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-900/10'
                  )}
                  title={`Confidence: ${Math.round(suggestion.confidence * 100)}% • Source: ${suggestion.source}`}
                >
                  <IconComponent className={clsx(
                    'h-3 w-3',
                    suggestion.source === 'nlp' && 'text-purple-500',
                    suggestion.source === 'existing' && 'text-blue-500',
                    suggestion.source === 'manual' && 'text-green-500'
                  )} />
                  {suggestion.name}
                  <PlusIcon className="h-3 w-3 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      {selectedTags.length < maxTags && (
        <div className="space-y-2">
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              disabled={disabled}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Custom Tag
            </button>
          ) : (
            <form onSubmit={handleCustomTagSubmit} className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Enter tag name..."
                className="input flex-1 text-sm"
                autoFocus
                disabled={disabled}
                maxLength={30}
              />
              <button
                type="submit"
                disabled={!customTagInput.trim() || disabled}
                className="btn btn-primary text-sm px-3"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTagInput('');
                }}
                className="btn btn-ghost text-sm px-3"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoadingTags && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="spinner" />
          Loading existing tags...
        </div>
      )}

      {/* Tag source legend */}
      {allSuggestions.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <SparklesIcon className="h-3 w-3 text-purple-500" />
              <span>AI Suggested</span>
            </div>
            <div className="flex items-center gap-1">
              <TagIcon className="h-3 w-3 text-blue-500" />
              <span>From History</span>
            </div>
            <div className="flex items-center gap-1">
              <HashtagIcon className="h-3 w-3 text-green-500" />
              <span>From Text</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}