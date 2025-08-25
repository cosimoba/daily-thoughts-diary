import { CreateEntryDto, UpdateEntryDto, Mood, Privacy } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation rules configuration
export interface ValidationRules {
  title?: {
    maxLength?: number;
    minLength?: number;
  };
  content: {
    maxLength?: number;
    minLength?: number;
    required?: boolean;
  };
  tags?: {
    maxCount?: number;
    maxTagLength?: number;
    minTagLength?: number;
  };
  attachments?: {
    maxCount?: number;
    maxFileSize?: number; // in bytes
    allowedTypes?: string[];
  };
}

const DEFAULT_VALIDATION_RULES: ValidationRules = {
  title: {
    maxLength: 200,
    minLength: 1,
  },
  content: {
    maxLength: 50000, // 50k characters
    minLength: 1,
    required: true,
  },
  tags: {
    maxCount: 20,
    maxTagLength: 30,
    minTagLength: 2,
  },
  attachments: {
    maxCount: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

// Error messages
const ERROR_MESSAGES = {
  TITLE_TOO_LONG: 'Title cannot exceed {maxLength} characters',
  TITLE_TOO_SHORT: 'Title must be at least {minLength} character(s)',
  CONTENT_REQUIRED: 'Content is required',
  CONTENT_TOO_LONG: 'Content cannot exceed {maxLength} characters',
  CONTENT_TOO_SHORT: 'Content must be at least {minLength} character(s)',
  TOO_MANY_TAGS: 'Cannot have more than {maxCount} tags',
  TAG_TOO_LONG: 'Tag "{tagName}" cannot exceed {maxTagLength} characters',
  TAG_TOO_SHORT: 'Tag "{tagName}" must be at least {minTagLength} character(s)',
  TAG_EMPTY: 'Tags cannot be empty',
  TAG_DUPLICATE: 'Tag "{tagName}" is already added',
  TOO_MANY_ATTACHMENTS: 'Cannot have more than {maxCount} attachments',
  FILE_TOO_LARGE: 'File "{fileName}" exceeds the maximum size of {maxSizeMB}MB',
  FILE_TYPE_NOT_ALLOWED: 'File type "{fileType}" is not allowed. Supported types: {allowedTypes}',
  INVALID_MOOD: 'Invalid mood selection',
  INVALID_PRIVACY: 'Invalid privacy setting',
  LOCATION_TOO_LONG: 'Location cannot exceed 100 characters',
  WEATHER_TOO_LONG: 'Weather cannot exceed 50 characters',
};

// Helper function to format error messages
function formatErrorMessage(template: string, params: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// Get plain text from HTML content
function getPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Validate title
function validateTitle(title: string | undefined, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!title) return errors; // Title is optional
  
  const trimmedTitle = title.trim();
  
  if (rules.title?.minLength && trimmedTitle.length < rules.title.minLength) {
    errors.push({
      field: 'title',
      message: formatErrorMessage(ERROR_MESSAGES.TITLE_TOO_SHORT, {
        minLength: rules.title.minLength,
      }),
      code: 'TITLE_TOO_SHORT',
    });
  }
  
  if (rules.title?.maxLength && trimmedTitle.length > rules.title.maxLength) {
    errors.push({
      field: 'title',
      message: formatErrorMessage(ERROR_MESSAGES.TITLE_TOO_LONG, {
        maxLength: rules.title.maxLength,
      }),
      code: 'TITLE_TOO_LONG',
    });
  }
  
  return errors;
}

// Validate content
function validateContent(content: string, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = [];
  const plainText = getPlainText(content);
  
  if (rules.content.required && (!content || plainText.length === 0)) {
    errors.push({
      field: 'content',
      message: ERROR_MESSAGES.CONTENT_REQUIRED,
      code: 'CONTENT_REQUIRED',
    });
    return errors; // Don't check length if content is missing
  }
  
  if (rules.content.minLength && plainText.length < rules.content.minLength) {
    errors.push({
      field: 'content',
      message: formatErrorMessage(ERROR_MESSAGES.CONTENT_TOO_SHORT, {
        minLength: rules.content.minLength,
      }),
      code: 'CONTENT_TOO_SHORT',
    });
  }
  
  if (rules.content.maxLength && plainText.length > rules.content.maxLength) {
    errors.push({
      field: 'content',
      message: formatErrorMessage(ERROR_MESSAGES.CONTENT_TOO_LONG, {
        maxLength: rules.content.maxLength,
      }),
      code: 'CONTENT_TOO_LONG',
    });
  }
  
  return errors;
}

// Validate tags
function validateTags(tags: string[] | undefined, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!tags || tags.length === 0) return errors; // Tags are optional
  
  // Check max count
  if (rules.tags?.maxCount && tags.length > rules.tags.maxCount) {
    errors.push({
      field: 'tags',
      message: formatErrorMessage(ERROR_MESSAGES.TOO_MANY_TAGS, {
        maxCount: rules.tags.maxCount,
      }),
      code: 'TOO_MANY_TAGS',
    });
  }
  
  // Check each tag
  const seenTags = new Set<string>();
  
  for (const tag of tags) {
    const trimmedTag = tag.trim();
    
    // Check if tag is empty
    if (!trimmedTag) {
      errors.push({
        field: 'tags',
        message: ERROR_MESSAGES.TAG_EMPTY,
        code: 'TAG_EMPTY',
      });
      continue;
    }
    
    // Check for duplicates
    const lowerTag = trimmedTag.toLowerCase();
    if (seenTags.has(lowerTag)) {
      errors.push({
        field: 'tags',
        message: formatErrorMessage(ERROR_MESSAGES.TAG_DUPLICATE, {
          tagName: trimmedTag,
        }),
        code: 'TAG_DUPLICATE',
      });
      continue;
    }
    seenTags.add(lowerTag);
    
    // Check length
    if (rules.tags?.minTagLength && trimmedTag.length < rules.tags.minTagLength) {
      errors.push({
        field: 'tags',
        message: formatErrorMessage(ERROR_MESSAGES.TAG_TOO_SHORT, {
          tagName: trimmedTag,
          minTagLength: rules.tags.minTagLength,
        }),
        code: 'TAG_TOO_SHORT',
      });
    }
    
    if (rules.tags?.maxTagLength && trimmedTag.length > rules.tags.maxTagLength) {
      errors.push({
        field: 'tags',
        message: formatErrorMessage(ERROR_MESSAGES.TAG_TOO_LONG, {
          tagName: trimmedTag,
          maxTagLength: rules.tags.maxTagLength,
        }),
        code: 'TAG_TOO_LONG',
      });
    }
  }
  
  return errors;
}

// Validate attachments
function validateAttachments(attachments: File[] | undefined, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!attachments || attachments.length === 0) return errors; // Attachments are optional
  
  // Check max count
  if (rules.attachments?.maxCount && attachments.length > rules.attachments.maxCount) {
    errors.push({
      field: 'attachments',
      message: formatErrorMessage(ERROR_MESSAGES.TOO_MANY_ATTACHMENTS, {
        maxCount: rules.attachments.maxCount,
      }),
      code: 'TOO_MANY_ATTACHMENTS',
    });
  }
  
  // Check each file
  for (const file of attachments) {
    // Check file size
    if (rules.attachments?.maxFileSize && file.size > rules.attachments.maxFileSize) {
      errors.push({
        field: 'attachments',
        message: formatErrorMessage(ERROR_MESSAGES.FILE_TOO_LARGE, {
          fileName: file.name,
          maxSizeMB: Math.round(rules.attachments.maxFileSize / (1024 * 1024)),
        }),
        code: 'FILE_TOO_LARGE',
      });
    }
    
    // Check file type
    if (rules.attachments?.allowedTypes && !rules.attachments.allowedTypes.includes(file.type)) {
      errors.push({
        field: 'attachments',
        message: formatErrorMessage(ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED, {
          fileType: file.type,
          allowedTypes: rules.attachments.allowedTypes.join(', '),
        }),
        code: 'FILE_TYPE_NOT_ALLOWED',
      });
    }
  }
  
  return errors;
}

// Validate mood
function validateMood(mood: Mood | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (mood && !Object.values(Mood).includes(mood)) {
    errors.push({
      field: 'mood',
      message: ERROR_MESSAGES.INVALID_MOOD,
      code: 'INVALID_MOOD',
    });
  }
  
  return errors;
}

// Validate privacy
function validatePrivacy(privacy: Privacy | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (privacy && !Object.values(Privacy).includes(privacy)) {
    errors.push({
      field: 'privacy',
      message: ERROR_MESSAGES.INVALID_PRIVACY,
      code: 'INVALID_PRIVACY',
    });
  }
  
  return errors;
}

// Validate location
function validateLocation(location: string | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (location && location.trim().length > 100) {
    errors.push({
      field: 'location',
      message: ERROR_MESSAGES.LOCATION_TOO_LONG,
      code: 'LOCATION_TOO_LONG',
    });
  }
  
  return errors;
}

// Validate weather
function validateWeather(weather: string | undefined): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (weather && weather.trim().length > 50) {
    errors.push({
      field: 'weather',
      message: ERROR_MESSAGES.WEATHER_TOO_LONG,
      code: 'WEATHER_TOO_LONG',
    });
  }
  
  return errors;
}

// Main validation function
export function validateEntryData(
  data: CreateEntryDto | UpdateEntryDto,
  customRules?: Partial<ValidationRules>
): ValidationResult {
  const rules = { ...DEFAULT_VALIDATION_RULES, ...customRules };
  const errors: ValidationError[] = [];
  
  // Validate all fields
  errors.push(...validateTitle(data.title, rules));
  errors.push(...validateContent(data.content, rules));
  errors.push(...validateTags(data.tags, rules));
  errors.push(...validateAttachments(data.attachments, rules));
  errors.push(...validateMood(data.mood));
  errors.push(...validatePrivacy(data.privacy));
  errors.push(...validateLocation(data.location));
  errors.push(...validateWeather(data.weather));
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Utility to get errors for a specific field
export function getFieldErrors(errors: ValidationError[], field: string): ValidationError[] {
  return errors.filter(error => error.field === field);
}

// Utility to check if a specific field has errors
export function hasFieldErrors(errors: ValidationError[], field: string): boolean {
  return errors.some(error => error.field === field);
}

// Utility to get all error messages
export function getErrorMessages(errors: ValidationError[]): string[] {
  return errors.map(error => error.message);
}

// Utility to get error messages for a specific field
export function getFieldErrorMessages(errors: ValidationError[], field: string): string[] {
  return getFieldErrors(errors, field).map(error => error.message);
}

// Real-time validation hooks
export function useRealTimeValidation(
  data: CreateEntryDto | UpdateEntryDto,
  rules?: Partial<ValidationRules>
) {
  const validationResult = validateEntryData(data, rules);
  
  return {
    ...validationResult,
    getFieldErrors: (field: string) => getFieldErrors(validationResult.errors, field),
    hasFieldErrors: (field: string) => hasFieldErrors(validationResult.errors, field),
    getFieldErrorMessages: (field: string) => getFieldErrorMessages(validationResult.errors, field),
  };
}

export default {
  validateEntryData,
  getFieldErrors,
  hasFieldErrors,
  getErrorMessages,
  getFieldErrorMessages,
  useRealTimeValidation,
  DEFAULT_VALIDATION_RULES,
  ERROR_MESSAGES,
};