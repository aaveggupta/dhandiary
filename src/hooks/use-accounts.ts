'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Account, CreateAccountInput, UpdateAccountInput, ApiResponse } from '@/types';

const ACCOUNTS_KEY = ['accounts'];

async function fetchAccounts(): Promise<Account[]> {
  const response = await fetch('/api/accounts');
  const data: ApiResponse<Account[]> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch accounts');
  }

  return data.data || [];
}

async function fetchAccount(id: string): Promise<Account> {
  const response = await fetch(`/api/accounts/${id}`);
  const data: ApiResponse<Account> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch account');
  }

  return data.data!;
}

async function createAccount(input: CreateAccountInput): Promise<Account> {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Account> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create account');
  }

  return data.data!;
}

async function updateAccount({
  id,
  ...input
}: UpdateAccountInput & { id: string }): Promise<Account> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Account> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update account');
  }

  return data.data!;
}

async function deleteAccount(id: string): Promise<void> {
  const response = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE',
  });

  const data: ApiResponse<void> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to delete account');
  }
}

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: fetchAccounts,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, id],
    queryFn: () => fetchAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_KEY, data.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
