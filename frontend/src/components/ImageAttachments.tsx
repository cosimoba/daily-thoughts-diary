import { useState, useRef, useCallback } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { apiClient } from '../services/api';

interface AttachmentPreview {
  id: string;
  file?: File;
  url: string;
  filename: string;
  size: number;
  type: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface ImageAttachmentsProps {
  attachments: AttachmentPreview[];
  onChange: (attachments: AttachmentPreview[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
  acceptedFormats?: string[];
}

const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_FILE_SIZE = 10; // 10MB
const DEFAULT_MAX_FILES = 5;

export default function ImageAttachments({
  attachments,
  onChange,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  className,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS
}: ImageAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedFormats.join(', ')}`;
    }
    
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${maxFileSize}MB`;
    }

    if (attachments.length >= maxFiles) {
      return `Maximum number of files (${maxFiles}) reached`;
    }

    return null;
  };

  // Upload file to server
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      const response = await apiClient.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data.url;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList) => {
    const newAttachments: AttachmentPreview[] = [];

    for (let i = 0; i < files.length && attachments.length + newAttachments.length < maxFiles; i++) {
      const file = files[i];
      const validationError = validateFile(file);

      if (validationError) {
        // Add error attachment
        newAttachments.push({
          id: `error-${Date.now()}-${i}`,
          file,
          url: '',
          filename: file.name,
          size: file.size,
          type: 'error',
          error: validationError
        });
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Add uploading attachment
      const uploadingAttachment: AttachmentPreview = {
        id: `uploading-${Date.now()}-${i}`,
        file,
        url: previewUrl,
        filename: file.name,
        size: file.size,
        type: 'uploading'
      };

      newAttachments.push(uploadingAttachment);
    }

    // Update attachments with uploading states
    const updatedAttachments = [...attachments, ...newAttachments];
    onChange(updatedAttachments);

    // Upload files
    for (const attachment of newAttachments) {
      if (attachment.type === 'uploading' && attachment.file) {
        try {
          const uploadedUrl = await uploadFile(attachment.file);
          
          // Update to uploaded state
          const finalAttachments = updatedAttachments.map(att => 
            att.id === attachment.id 
              ? { ...att, url: uploadedUrl, type: 'uploaded' as const }
              : att
          );
          
          onChange(finalAttachments);
        } catch (error: any) {
          // Update to error state
          const errorAttachments = updatedAttachments.map(att =>
            att.id === attachment.id
              ? { ...att, type: 'error' as const, error: error.message }
              : att
          );
          
          onChange(errorAttachments);
        }
      }
    }
  }, [attachments, onChange, maxFiles, maxFileSize, acceptedFormats]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
    // Clear input
    e.target.value = '';
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  // Remove attachment
  const handleRemove = (id: string) => {
    const attachment = attachments.find(att => att.id === id);
    if (attachment && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    
    const filtered = attachments.filter(att => att.id !== id);
    onChange(filtered);
  };

  // Retry upload
  const handleRetry = async (id: string) => {
    const attachment = attachments.find(att => att.id === id);
    if (!attachment || !attachment.file) return;

    // Update to uploading state
    const updatedAttachments = attachments.map(att =>
      att.id === id ? { ...att, type: 'uploading' as const, error: undefined } : att
    );
    onChange(updatedAttachments);

    try {
      const uploadedUrl = await uploadFile(attachment.file);
      
      // Update to uploaded state
      const finalAttachments = updatedAttachments.map(att =>
        att.id === id ? { ...att, url: uploadedUrl, type: 'uploaded' as const } : att
      );
      
      onChange(finalAttachments);
    } catch (error: any) {
      // Update to error state
      const errorAttachments = updatedAttachments.map(att =>
        att.id === id ? { ...att, type: 'error' as const, error: error.message } : att
      );
      
      onChange(errorAttachments);
    }
  };

  const canAddMore = attachments.length < maxFiles && !disabled;

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <label className="label">
          Images ({attachments.length}/{maxFiles})
        </label>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Max {maxFileSize}MB per file
        </div>
      </div>

      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-primary-600 dark:text-primary-400">
              Click to upload
            </span>
            {' '}or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {acceptedFormats.map(format => format.split('/')[1]).join(', ').toUpperCase()} up to {maxFileSize}MB
          </p>
        </div>
      )}

      {/* Attachments Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Image Preview */}
              <div className="aspect-square relative">
                {attachment.type === 'uploading' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <div className="text-center">
                      <div className="spinner mx-auto mb-2" />
                      <div className="text-xs text-gray-500">Uploading...</div>
                    </div>
                  </div>
                ) : attachment.type === 'error' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                    <div className="text-center p-2">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Upload failed
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.svg';
                    }}
                  />
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {attachment.type === 'uploaded' && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(attachment.url)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {attachment.type === 'error' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(attachment.id)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                      title="Retry upload"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemove(attachment.id)}
                    className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white transition-colors"
                    title="Remove"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* File Info */}
              <div className="p-2">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {attachment.filename}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.size)}
                </div>
                {attachment.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {attachment.error}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add More Button */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors group"
            >
              <div className="text-center">
                <PlusIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-500 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Add more</div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setPreviewImage(null)} 
          />
        </div>
      )}
    </div>
  );
}