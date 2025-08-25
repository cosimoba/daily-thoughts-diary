// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  defaultPrivacy: Privacy;
  emailNotifications: boolean;
  dailyReminder: boolean;
  reminderTime?: string;
  language: string;
  timezone: string;
}

// Entry types
export interface Entry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood?: Mood;
  privacy: Privacy;
  location?: string;
  weather?: string;
  wordCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  attachments: Attachment[];
}

export interface CreateEntryDto {
  title?: string;
  content: string;
  mood?: Mood;
  privacy?: Privacy;
  location?: string;
  weather?: string;
  tags?: string[];
  attachments?: File[];
}

export interface UpdateEntryDto extends Partial<CreateEntryDto> {
  isFavorite?: boolean;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: string;
  entryCount?: number;
}

// Attachment types
export interface Attachment {
  id: string;
  entryId: string;
  type: AttachmentType;
  url: string;
  filename: string;
  size: number;
  mimeType?: string;
  createdAt: string;
}

// Enums
export enum Mood {
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  EXCITED = 'EXCITED',
  ANXIOUS = 'ANXIOUS',
  CALM = 'CALM',
  ANGRY = 'ANGRY',
  GRATEFUL = 'GRATEFUL',
  CONFUSED = 'CONFUSED',
  HOPEFUL = 'HOPEFUL',
  TIRED = 'TIRED',
  ENERGETIC = 'ENERGETIC',
  NEUTRAL = 'NEUTRAL',
}

export enum Privacy {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
}

export enum AttachmentType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// Statistics types
export interface Stats {
  totalEntries: number;
  totalWords: number;
  currentStreak: number;
  longestStreak: number;
  averageWordsPerEntry: number;
  moodDistribution: MoodStats[];
  tagDistribution: TagStats[];
  entriesByMonth: MonthlyStats[];
}

export interface MoodStats {
  mood: Mood;
  count: number;
  percentage: number;
}

export interface TagStats {
  tag: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  count: number;
}

// Filter and sort types
export interface EntryFilters {
  search?: string;
  tags?: string[];
  mood?: Mood;
  dateFrom?: string;
  dateTo?: string;
  privacy?: Privacy;
  isFavorite?: boolean;
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'wordCount' | 'title';
  order: 'asc' | 'desc';
}

// UI State types
export interface ModalState {
  isOpen: boolean;
  type?: 'delete' | 'edit' | 'share' | 'export';
  data?: any;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}