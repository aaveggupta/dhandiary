'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  SharedCreditLimitWithStats,
  CreateSharedCreditLimitInput,
  UpdateSharedCreditLimitInput,
  ApiResponse,
  Account,
} from '@/types';

const SHARED_CREDIT_LIMITS_KEY = ['shared-credit-limits'];
const ACCOUNTS_KEY = ['accounts'];

async function fetchSharedCreditLimits(): Promise<SharedCreditLimitWithStats[]> {
  const response = await fetch('/api/shared-credit-limits');
  const data: ApiResponse<SharedCreditLimitWithStats[]> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch shared credit limits');
  }

  return data.data || [];
}

async function fetchSharedCreditLimit(id: string): Promise<SharedCreditLimitWithStats> {
  const response = await fetch(`/api/shared-credit-limits/${id}`);
  const data: ApiResponse<SharedCreditLimitWithStats> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch shared credit limit');
  }

  return data.data!;
}

async function createSharedCreditLimit(
  input: CreateSharedCreditLimitInput
): Promise<SharedCreditLimitWithStats> {
  const response = await fetch('/api/shared-credit-limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<SharedCreditLimitWithStats> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create shared credit limit');
  }

  return data.data!;
}

async function updateSharedCreditLimit({
  id,
  ...input
}: UpdateSharedCreditLimitInput & { id: string }): Promise<SharedCreditLimitWithStats> {
  const response = await fetch(`/api/shared-credit-limits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<SharedCreditLimitWithStats> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update shared credit limit');
  }

  return data.data!;
}

async function deleteSharedCreditLimit(id: string): Promise<void> {
  const response = await fetch(`/api/shared-credit-limits/${id}`, {
    method: 'DELETE',
  });

  const data: ApiResponse<void> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to delete shared credit limit');
  }
}

async function linkAccountToSharedLimit({
  sharedLimitId,
  accountId,
}: {
  sharedLimitId: string;
  accountId: string;
}): Promise<Account> {
  const response = await fetch(`/api/shared-credit-limits/${sharedLimitId}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });

  const data: ApiResponse<Account> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to link account to shared credit limit');
  }

  return data.data!;
}

async function unlinkAccountFromSharedLimit({
  sharedLimitId,
  accountId,
}: {
  sharedLimitId: string;
  accountId: string;
}): Promise<Account> {
  const response = await fetch(`/api/shared-credit-limits/${sharedLimitId}/accounts`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });

  const data: ApiResponse<Account> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to unlink account from shared credit limit');
  }

  return data.data!;
}

export function useSharedCreditLimits() {
  return useQuery({
    queryKey: SHARED_CREDIT_LIMITS_KEY,
    queryFn: fetchSharedCreditLimits,
  });
}

export function useSharedCreditLimit(id: string) {
  return useQuery({
    queryKey: [...SHARED_CREDIT_LIMITS_KEY, id],
    queryFn: () => fetchSharedCreditLimit(id),
    enabled: !!id,
  });
}

export function useCreateSharedCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSharedCreditLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARED_CREDIT_LIMITS_KEY });
    },
  });
}

export function useUpdateSharedCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSharedCreditLimit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SHARED_CREDIT_LIMITS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SHARED_CREDIT_LIMITS_KEY, data.id] });
    },
  });
}

export function useDeleteSharedCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSharedCreditLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARED_CREDIT_LIMITS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useLinkAccountToSharedLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkAccountToSharedLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARED_CREDIT_LIMITS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUnlinkAccountFromSharedLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkAccountFromSharedLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARED_CREDIT_LIMITS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
