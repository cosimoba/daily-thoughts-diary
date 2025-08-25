import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Stats, ApiResponse } from '../types';
import { QUERY_KEYS } from './useEntries';

export function useStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Stats>>('/stats');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useWritingStreak() {
  return useQuery({
    queryKey: ['writing-streak'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ 
        currentStreak: number;
        longestStreak: number;
        lastEntryDate: string;
      }>>('/stats/streak');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDailyGoal() {
  return useQuery({
    queryKey: ['daily-goal'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get<ApiResponse<{
        todayWordCount: number;
        goalWordCount: number;
        isGoalMet: boolean;
        percentage: number;
      }>>(`/stats/daily-goal?date=${today}`);
      return response.data.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}