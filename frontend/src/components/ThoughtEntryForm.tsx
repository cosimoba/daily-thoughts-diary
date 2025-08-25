import { useState, useEffect, useRef } from 'react';
import { 
  EyeIcon, 
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  BookmarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import MoodSelector from './MoodSelector';
import TagSuggestionSystem from './TagSuggestionSystem';
import ImageAttachments from './ImageAttachments';
import ThoughtPreview from './ThoughtPreview';
import { useAutoSave, useDraftStorage, getAutoSaveStatusText } from '../hooks/useAutoSave';
import { validateEntryData, getFieldErrorMessages } from '../utils/formValidation';
import { CreateEntryDto, UpdateEntryDto, Mood, Privacy, Entry } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface ThoughtEntryFormProps {
  entry?: Entry; // For editing existing entry
  onSave?: (entry: Entry) => void;
  onCancel?: () => void;
  className?: string;
  fullscreen?: boolean;
}

interface AttachmentPreview {
  id: string;
  file?: File;
  url: string;
  filename: string;
  size: number;
  type: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

export default function ThoughtEntryForm({
  entry,
  onSave,
  onCancel,
  className,
  fullscreen = false
}: ThoughtEntryFormProps) {
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [privacy, setPrivacy] = useState<Privacy>(Privacy.PRIVATE);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);

  // UI state
  const [currentView, setCurrentView] = useState<'write' | 'preview'>('write');
  const [showValidation, setShowValidation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Draft management
  const { draft, saveDraft, clearDraft, hasDraft } = useDraftStorage(entry?.id || 'new-entry');

  // Prepare data for auto-save and validation
  const formData: CreateEntryDto | UpdateEntryDto = {
    title: title.trim() || undefined,
    content,
    mood,
    privacy,
    location: location.trim() || undefined,
    weather: weather.trim() || undefined,
    tags: tags.length > 0 ? tags : undefined,
    attachments: attachments
      .filter(att => att.type === 'uploaded')
      .map(att => att.file)
      .filter((file): file is File => !!file),
    ...(entry && { isFavorite })
  };

  // Auto-save functionality
  const {
    save,
    isDirty,
    isSaving,
    lastSaved,
    saveStatus,
    error: saveError,
    hasChanges
  } = useAutoSave(entry?.id || null, formData, {
    enabled: content.trim().length > 0,
    delay: 2000, // 2 seconds for full form
    onSave: (savedEntry) => {
      setHasUnsavedChanges(false);
      clearDraft();
      toast.success(entry ? 'Entry updated successfully!' : 'Entry saved successfully!');
      onSave?.(savedEntry);
    },
    onError: (error) => {
      toast.error('Failed to save entry. Please try again.');
      console.error('Save error:', error);
    }
  });

  // Validation
  const validation = validateEntryData(formData);
  const hasValidationErrors = !validation.isValid;

  // Initialize form
  useEffect(() => {
    if (entry) {
      // Editing existing entry
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood);
      setPrivacy(entry.privacy);
      setLocation(entry.location || '');
      setWeather(entry.weather || '');
      setTags(entry.tags?.map(tag => tag.name) || []);
      setIsFavorite(entry.isFavorite);
      setAttachments(entry.attachments?.map(att => ({
        id: att.id,
        url: att.url,
        filename: att.filename,
        size: att.size,
        type: 'uploaded' as const
      })) || []);
    } else if (draft && hasDraft) {
      // Load from draft
      const shouldLoadDraft = window.confirm(
        'You have an unsaved draft. Would you like to continue where you left off?'
      );
      
      if (shouldLoadDraft) {
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setMood(draft.mood);
        setPrivacy(draft.privacy || Privacy.PRIVATE);
        setLocation(draft.location || '');
        setWeather(draft.weather || '');
        setTags(draft.tags || []);
        toast.success('Draft restored!');
      } else {
        clearDraft();
      }
    }

    // Auto-focus editor on mount
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  }, [entry, draft, hasDraft, clearDraft]);

  // Save draft when form changes
  useEffect(() => {
    if (!entry && (content.trim().length > 0 || title.trim().length > 0)) {
      saveDraft(formData);
    }
  }, [formData, entry, saveDraft]);

  // Track unsaved changes
  useEffect(() => {
    const hasContent = content.trim().length > 0 || title.trim().length > 0;
    setHasUnsavedChanges(hasContent && (isDirty || hasChanges));
  }, [content, title, isDirty, hasChanges]);

  // Handle navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle manual save
  const handleSave = async () => {
    setShowValidation(true);
    
    if (!validation.isValid) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    try {
      await save();
      if (!entry) {
        // For new entries, redirect to dashboard or stay on page
        navigate('/dashboard');
      }
    } catch (error) {
      // Error handling is done in the auto-save hook
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string> => {
    // This would integrate with your actual file upload service
    // For now, return a placeholder URL
    return URL.createObjectURL(file);
  };

  // Toggle favorite
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setHasUnsavedChanges(true);
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    setIsFullscreenMode(!isFullscreenMode);
  };

  // Get auto-save status
  const autoSaveStatusText = getAutoSaveStatusText(saveStatus, lastSaved, isSaving);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'Enter':
            e.preventDefault();
            setCurrentView(currentView === 'write' ? 'preview' : 'write');
            break;
        }
      }
      
      if (e.key === 'Escape' && isFullscreenMode) {
        setIsFullscreenMode(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleSave, currentView, isFullscreenMode]);

  const containerClasses = clsx(
    fullscreen || isFullscreenMode ? 'fixed inset-0 z-40 bg-white dark:bg-gray-900' : 'min-h-screen',
    className
  );

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                title="Back"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {entry ? 'Edit Entry' : 'New Entry'}
                </h1>
                {autoSaveStatusText && (
                  <p className={clsx(
                    'text-xs mt-0.5 flex items-center gap-1',
                    saveStatus === 'saved' && 'text-green-600 dark:text-green-400',
                    saveStatus === 'saving' && 'text-blue-600 dark:text-blue-400',
                    saveStatus === 'error' && 'text-red-600 dark:text-red-400',
                    !saveStatus && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {saveStatus === 'saved' && <CheckIcon className="h-3 w-3" />}
                    {saveStatus === 'saving' && <div className="spinner w-3 h-3" />}
                    {saveStatus === 'error' && <ExclamationTriangleIcon className="h-3 w-3" />}
                    {saveStatus === 'saving' && <CloudArrowUpIcon className="h-3 w-3" />}
                    {autoSaveStatusText}
                  </p>
                )}
              </div>
            </div>

            {/* Center - View Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('write')}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  currentView === 'write'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <DocumentTextIcon className="h-4 w-4" />
                Write
              </button>
              <button
                onClick={() => setCurrentView('preview')}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  currentView === 'preview'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <EyeIcon className="h-4 w-4" />
                Preview
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Favorite button */}
              {entry && (
                <button
                  onClick={handleToggleFavorite}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isFavorite
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? (
                    <BookmarkSolidIcon className="h-5 w-5" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving || (hasValidationErrors && showValidation)}
                className={clsx(
                  'btn btn-primary flex items-center gap-2',
                  isSaving && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {entry ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'write' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="label">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your thoughts a title..."
                  className={clsx(
                    'input text-lg',
                    showValidation && getFieldErrorMessages(validation.errors, 'title').length > 0 && 'border-red-500'
                  )}
                />
                {showValidation && getFieldErrorMessages(validation.errors, 'title').map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <label className="label">Your Thoughts</label>
                <RichTextEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  placeholder="What's on your mind today?"
                  minHeight="300px"
                  onImageUpload={handleImageUpload}
                  autoFocus={true}
                  className={clsx(
                    showValidation && getFieldErrorMessages(validation.errors, 'content').length > 0 && 'border-red-500'
                  )}
                />
                {showValidation && getFieldErrorMessages(validation.errors, 'content').map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>

              {/* Image Attachments */}
              <ImageAttachments
                attachments={attachments}
                onChange={setAttachments}
                maxFiles={10}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mood Selector */}
              <MoodSelector
                value={mood}
                onChange={setMood}
                layout="grid"
                showLabels={true}
                showDescriptions={false}
              />

              {/* Tags */}
              <TagSuggestionSystem
                content={content}
                selectedTags={tags}
                onTagsChange={setTags}
                maxTags={15}
              />

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Additional Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="label text-sm">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where are you?"
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="label text-sm">Weather</label>
                    <input
                      type="text"
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      placeholder="How's the weather?"
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="label text-sm">Privacy</label>
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as Privacy)}
                      className="input text-sm"
                    >
                      <option value={Privacy.PRIVATE}>Private (only me)</option>
                      <option value={Privacy.FRIENDS}>Friends</option>
                      <option value={Privacy.PUBLIC}>Public</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Writing Stats */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Writing Stats
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Words:</span>
                    <span>{editorRef.current?.getWordCount() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{editorRef.current?.getCharCount() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tags:</span>
                    <span>{tags.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span>{attachments.filter(att => att.type === 'uploaded').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="max-w-4xl mx-auto">
            <ThoughtPreview
              title={title}
              content={content}
              mood={mood}
              tags={tags}
              location={location}
              weather={weather}
              attachments={attachments.filter(att => att.type === 'uploaded')}
              mode="full"
              showMetadata={true}
              showEditButton={true}
              onEdit={() => setCurrentView('write')}
            />
          </div>
        )}

        {/* Validation Errors Summary */}
        {showValidation && hasValidationErrors && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Please fix the following errors:
                </h3>
                <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile view toggle */}
      <div className="sm:hidden fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setCurrentView(currentView === 'write' ? 'preview' : 'write')}
          className="btn btn-primary rounded-full p-3 shadow-lg"
        >
          {currentView === 'write' ? (
            <EyeIcon className="h-6 w-6" />
          ) : (
            <DocumentTextIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}