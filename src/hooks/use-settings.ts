'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserSettings, UpdateSettingsInput, ApiResponse } from '@/types';

const SETTINGS_KEY = ['settings'];

async function fetchSettings(): Promise<UserSettings> {
  const response = await fetch('/api/settings');
  const data: ApiResponse<UserSettings> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch settings');
  }

  return data.data!;
}

async function updateSettings(input: UpdateSettingsInput): Promise<UserSettings> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<UserSettings> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update settings');
  }

  return data.data!;
}

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data);
    },
  });
}
