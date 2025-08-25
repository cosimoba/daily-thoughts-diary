import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Modal from './ui/Modal';
import RichTextEditor from './RichTextEditor';
import MoodSelector from './MoodSelector';
import TagSuggestionSystem from './TagSuggestionSystem';
import ImageAttachments from './ImageAttachments';
import ThoughtPreview from './ThoughtPreview';
import { useAutoSave, useDraftStorage, getAutoSaveStatusText } from '../hooks/useAutoSave';
import { validateEntryData, getFieldErrorMessages } from '../utils/formValidation';
import { CreateEntryDto, UpdateEntryDto, Mood, Privacy, Entry } from '../types';
import clsx from 'clsx';

interface ThoughtEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: Entry; // For editing existing entry
  onSave?: (entry: Entry) => void;
  onError?: (error: any) => void;
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

export default function ThoughtEntryModal({
  isOpen,
  onClose,
  entry,
  onSave,
  onError
}: ThoughtEntryModalProps) {
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
  const [currentTab, setCurrentTab] = useState<'write' | 'preview'>('write');
  const [showValidation, setShowValidation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Draft management
  const { draft, saveDraft, clearDraft } = useDraftStorage(entry?.id || 'new-entry');

  // Prepare data for auto-save
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
      .filter((file): file is File => !!file)
  };

  // Auto-save functionality
  const {
    save,
    isDirty,
    isSaving,
    lastSaved,
    saveStatus,
    error: saveError
  } = useAutoSave(entry?.id || null, formData, {
    enabled: isOpen && content.trim().length > 0,
    onSave: (savedEntry) => {
      setHasUnsavedChanges(false);
      clearDraft();
      onSave?.(savedEntry);
    },
    onError: (error) => {
      onError?.(error);
    }
  });

  // Validation
  const validation = validateEntryData(formData);

  // Initialize form with entry data or draft
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
      setAttachments(entry.attachments?.map(att => ({
        id: att.id,
        url: att.url,
        filename: att.filename,
        size: att.size,
        type: 'uploaded' as const
      })) || []);
    } else if (draft) {
      // Load from draft
      setTitle(draft.title || '');
      setContent(draft.content || '');
      setMood(draft.mood);
      setPrivacy(draft.privacy || Privacy.PRIVATE);
      setLocation(draft.location || '');
      setWeather(draft.weather || '');
      setTags(draft.tags || []);
    } else {
      // New entry - reset form
      setTitle('');
      setContent('');
      setMood(undefined);
      setPrivacy(Privacy.PRIVATE);
      setLocation('');
      setWeather('');
      setTags([]);
      setAttachments([]);
    }
  }, [entry, draft, isOpen]);

  // Save draft when form changes
  useEffect(() => {
    if (!entry && content.trim().length > 0) {
      saveDraft(formData);
    }
  }, [formData, entry, saveDraft]);

  // Track unsaved changes
  useEffect(() => {
    const hasContent = content.trim().length > 0;
    const hasChanges = hasContent || title.trim().length > 0 || tags.length > 0 || mood;
    setHasUnsavedChanges(hasChanges && isDirty);
  }, [content, title, tags, mood, isDirty]);

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    
    setCurrentTab('write');
    setShowValidation(false);
    onClose();
  };

  // Handle manual save
  const handleSave = async () => {
    setShowValidation(true);
    
    if (!validation.isValid) {
      return;
    }

    try {
      await save();
      onClose();
    } catch (error) {
      // Error is handled by auto-save hook
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string> => {
    // This would integrate with your file upload service
    // For now, return a placeholder URL
    return URL.createObjectURL(file);
  };

  // Get auto-save status text
  const autoSaveStatusText = getAutoSaveStatusText(saveStatus, lastSaved, isSaving);

  // Tab content
  const renderTabContent = () => {
    if (currentTab === 'preview') {
      return (
        <div className="p-6">
          <ThoughtPreview
            title={title}
            content={content}
            mood={mood}
            tags={tags}
            location={location}
            weather={weather}
            attachments={attachments.filter(att => att.type === 'uploaded')}
            mode="full"
            showMetadata={false}
          />
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <label className="label">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your thought a title..."
            className={clsx(
              'input',
              showValidation && getFieldErrorMessages(validation.errors, 'title').length > 0 && 'border-red-500'
            )}
          />
          {showValidation && getFieldErrorMessages(validation.errors, 'title').map((error, index) => (
            <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <label className="label">Your Thoughts</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="What's on your mind?"
            minHeight="200px"
            maxHeight="400px"
            onImageUpload={handleImageUpload}
            className={clsx(
              showValidation && getFieldErrorMessages(validation.errors, 'content').length > 0 && 'border-red-500'
            )}
          />
          {showValidation && getFieldErrorMessages(validation.errors, 'content').map((error, index) => (
            <p key={index} className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ))}
        </div>

        {/* Mood Selector */}
        <MoodSelector
          value={mood}
          onChange={setMood}
          layout="compact"
          showLabels={true}
        />

        {/* Tags */}
        <TagSuggestionSystem
          content={content}
          selectedTags={tags}
          onTagsChange={setTags}
        />

        {/* Image Attachments */}
        <ImageAttachments
          attachments={attachments}
          onChange={setAttachments}
          maxFiles={5}
        />

        {/* Additional Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Location */}
          <div>
            <label className="label">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you?"
              className="input"
            />
          </div>

          {/* Weather */}
          <div>
            <label className="label">Weather (optional)</label>
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="How's the weather?"
              className="input"
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <label className="label">Privacy</label>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as Privacy)}
            className="input"
          >
            <option value={Privacy.PRIVATE}>Private (only me)</option>
            <option value={Privacy.FRIENDS}>Friends</option>
            <option value={Privacy.PUBLIC}>Public</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={entry ? 'Edit Entry' : 'New Entry'}
      size="xl"
      closeOnBackdrop={!hasUnsavedChanges}
      className="h-[90vh]"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentTab('write')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                currentTab === 'write'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <DocumentTextIcon className="h-4 w-4" />
              Write
            </button>
            <button
              onClick={() => setCurrentTab('preview')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                currentTab === 'preview'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
              )}
            >
              <EyeIcon className="h-4 w-4" />
              Preview
            </button>
          </div>

          {/* Auto-save status */}
          <div className="flex items-center gap-3 text-xs">
            {autoSaveStatusText && (
              <span className={clsx(
                'flex items-center gap-1',
                saveStatus === 'saved' && 'text-green-600 dark:text-green-400',
                saveStatus === 'saving' && 'text-blue-600 dark:text-blue-400',
                saveStatus === 'error' && 'text-red-600 dark:text-red-400'
              )}>
                {saveStatus === 'saved' && <CheckIcon className="h-3 w-3" />}
                {saveStatus === 'saving' && <div className="spinner w-3 h-3" />}
                {saveStatus === 'error' && <ExclamationTriangleIcon className="h-3 w-3" />}
                {autoSaveStatusText}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {content && (
                <span>
                  {content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length} words
                  {validation.errors.length > 0 && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                      • {validation.errors.length} validation error{validation.errors.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || (!validation.isValid && showValidation)}
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
                    {entry ? 'Update' : 'Save'} Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}