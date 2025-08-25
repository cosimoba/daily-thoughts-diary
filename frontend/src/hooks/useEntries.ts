import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Entry, CreateEntryDto, UpdateEntryDto, EntryFilters, SortOptions, PaginatedResponse, ApiResponse } from '../types';

// Query keys for React Query
export const QUERY_KEYS = {
  entries: (filters?: EntryFilters, sort?: SortOptions, page?: number, pageSize?: number) => 
    ['entries', filters, sort, page, pageSize] as const,
  entry: (id: string) => ['entry', id] as const,
  stats: () => ['stats'] as const,
  entriesByDate: (dateFrom?: string, dateTo?: string) => ['entriesByDate', dateFrom, dateTo] as const,
};

// Fetch entries with pagination and filtering
export function useEntries(
  filters?: EntryFilters,
  sort: SortOptions = { field: 'createdAt', order: 'desc' },
  page: number = 1,
  pageSize: number = 10
) {
  return useQuery({
    queryKey: QUERY_KEYS.entries(filters, sort, page, pageSize),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      // Add sorting
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.order);
      
      // Add filters
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.mood) params.append('mood', filters.mood);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.privacy) params.append('privacy', filters.privacy);
      if (filters?.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
      
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Entry>>>(
        `/entries?${params.toString()}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch entries grouped by date for dashboard
export function useEntriesByDate(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.entriesByDate(dateFrom, dateTo),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('groupBy', 'date');
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'desc');
      
      const response = await apiClient.get<ApiResponse<Record<string, Entry[]>>>(
        `/entries/grouped?${params.toString()}`
      );
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch single entry by ID
export function useEntry(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.entry(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Entry>>(`/entries/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create new entry mutation
export function useCreateEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEntryDto) => {
      const response = await apiClient.post<ApiResponse<Entry>>('/entries', data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch entries queries
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Update entry mutation
export function useUpdateEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEntryDto }) => {
      const response = await apiClient.patch<ApiResponse<Entry>>(`/entries/${id}`, data);
      return response.data.data;
    },
    onSuccess: (updatedEntry) => {
      // Update the specific entry in cache
      queryClient.setQueryData(QUERY_KEYS.entry(updatedEntry.id), updatedEntry);
      
      // Invalidate entries queries
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Delete entry mutation
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/entries/${id}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch entries queries
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Toggle favorite mutation
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await apiClient.patch<ApiResponse<Entry>>(`/entries/${id}`, { isFavorite });
      return response.data.data;
    },
    onSuccess: (updatedEntry) => {
      // Update the specific entry in cache
      queryClient.setQueryData(QUERY_KEYS.entry(updatedEntry.id), updatedEntry);
      
      // Invalidate entries queries to reflect changes
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entriesByDate'] });
    },
  });
}