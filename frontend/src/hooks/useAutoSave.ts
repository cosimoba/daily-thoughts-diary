import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { CreateEntryDto, UpdateEntryDto, Entry, ApiResponse } from '../types';

interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-save triggers
  enabled?: boolean; // Whether auto-save is enabled
  onSave?: (entry: Entry) => void; // Callback when save is successful
  onError?: (error: any) => void; // Callback when save fails
}

interface UseAutoSaveReturn {
  save: () => Promise<void>;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
}

export function useAutoSave(
  entryId: string | null,
  data: Partial<CreateEntryDto | UpdateEntryDto>,
  options: AutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    delay = 3000, // 3 seconds default
    enabled = true,
    onSave,
    onError
  } = options;

  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: async (createData: CreateEntryDto) => {
      const response = await apiClient.post<ApiResponse<Entry>>('/entries', createData);
      return response.data.data;
    },
    onSuccess: (entry) => {
      setLastSaved(new Date());
      setSaveStatus('saved');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
      queryClient.setQueryData(['entry', entry.id], entry);
      onSave?.(entry);
    },
    onError: (err: any) => {
      setSaveStatus('error');
      const errorMessage = err.response?.data?.message || 'Failed to save entry';
      setError(errorMessage);
      onError?.(err);
    },
    onMutate: () => {
      setSaveStatus('saving');
      setError(null);
    }
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updateData }: { id: string; updateData: UpdateEntryDto }) => {
      const response = await apiClient.patch<ApiResponse<Entry>>(`/entries/${id}`, updateData);
      return response.data.data;
    },
    onSuccess: (entry) => {
      setLastSaved(new Date());
      setSaveStatus('saved');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
      queryClient.setQueryData(['entry', entry.id], entry);
      onSave?.(entry);
    },
    onError: (err: any) => {
      setSaveStatus('error');
      const errorMessage = err.response?.data?.message || 'Failed to update entry';
      setError(errorMessage);
      onError?.(err);
    },
    onMutate: () => {
      setSaveStatus('saving');
      setError(null);
    }
  });

  // Check if data has meaningful content
  const hasContent = useCallback((data: Partial<CreateEntryDto | UpdateEntryDto>): boolean => {
    const hasTitle = data.title && data.title.trim().length > 0;
    const hasContent = data.content && data.content.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasTags = data.tags && data.tags.length > 0;
    const hasMood = data.mood !== undefined;
    
    return hasTitle || hasContent || hasTags || hasMood;
  }, []);

  // Save function
  const save = useCallback(async () => {
    if (!hasContent(data)) {
      return; // Don't save empty entries
    }

    try {
      if (entryId) {
        // Update existing entry
        await updateMutation.mutateAsync({ 
          id: entryId, 
          updateData: data as UpdateEntryDto 
        });
      } else {
        // Create new entry
        await createMutation.mutateAsync(data as CreateEntryDto);
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Auto-save failed:', error);
    }
  }, [entryId, data, hasContent, createMutation, updateMutation]);

  // Debounced auto-save
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (enabled && hasContent(data)) {
        save();
      }
    }, delay);
  }, [enabled, delay, save, data, hasContent]);

  // Check if data has changed
  const currentDataString = JSON.stringify(data);
  const hasChanges = currentDataString !== lastDataRef.current && lastDataRef.current !== '';
  const isDirty = hasChanges && hasContent(data);

  // Auto-save when data changes
  useEffect(() => {
    if (hasChanges && enabled) {
      debouncedSave();
      // Reset status when new changes are made
      if (saveStatus === 'saved') {
        setSaveStatus('idle');
      }
    }
    
    lastDataRef.current = currentDataString;
  }, [currentDataString, hasChanges, enabled, debouncedSave, saveStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save immediately before page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && enabled) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        // Try to save immediately
        save();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, enabled, save]);

  return {
    save,
    isDirty,
    isSaving: createMutation.isPending || updateMutation.isPending,
    lastSaved,
    hasChanges,
    saveStatus,
    error
  };
}

// Hook for managing draft state in localStorage
export function useDraftStorage(key: string) {
  const [draft, setDraft] = useState<Partial<CreateEntryDto> | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`draft_${key}`);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setDraft(parsedDraft);
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
    }
  }, [key]);

  // Save draft to localStorage
  const saveDraft = useCallback((data: Partial<CreateEntryDto>) => {
    try {
      if (data.content && data.content.trim()) {
        localStorage.setItem(`draft_${key}`, JSON.stringify({
          ...data,
          lastModified: new Date().toISOString()
        }));
        setDraft(data);
      }
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
    }
  }, [key]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft_${key}`);
      setDraft(null);
    } catch (error) {
      console.error('Failed to clear draft from localStorage:', error);
    }
  }, [key]);

  // Check if draft exists
  const hasDraft = Boolean(draft && draft.content && draft.content.trim());

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft
  };
}

// Auto-save status indicator component data
export function getAutoSaveStatusText(status: UseAutoSaveReturn['saveStatus'], lastSaved: Date | null, isSaving: boolean): string {
  if (isSaving) return 'Saving...';
  
  switch (status) {
    case 'saved':
      if (lastSaved) {
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
        
        if (diffSeconds < 60) {
          return `Saved ${diffSeconds}s ago`;
        } else if (diffSeconds < 3600) {
          const minutes = Math.floor(diffSeconds / 60);
          return `Saved ${minutes}m ago`;
        } else {
          return `Saved at ${lastSaved.toLocaleTimeString()}`;
        }
      }
      return 'Saved';
    case 'error':
      return 'Save failed';
    case 'saving':
      return 'Saving...';
    default:
      return '';
  }
}

export default useAutoSave;