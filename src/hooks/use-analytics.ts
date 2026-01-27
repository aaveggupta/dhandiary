'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardAnalytics, ApiResponse } from '@/types';

const ANALYTICS_KEY = ['analytics'];

async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await fetch('/api/analytics/dashboard');
  const data: ApiResponse<DashboardAnalytics> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch analytics');
  }

  return data.data!;
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: [...ANALYTICS_KEY, 'dashboard'],
    queryFn: fetchDashboardAnalytics,
    refetchInterval: 60000, // Refetch every minute
  });
}
