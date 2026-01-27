'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  ApiResponse,
} from '@/types';

const TRANSACTIONS_KEY = ['transactions'];

interface TransactionsResponse {
  data: Transaction[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

async function fetchTransactions(filters?: TransactionFilters): Promise<TransactionsResponse> {
  const params = new URLSearchParams();

  if (filters?.type) params.set('type', filters.type);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.accountId) params.set('accountId', filters.accountId);
  if (filters?.startDate) params.set('startDate', filters.startDate.toISOString());
  if (filters?.endDate) params.set('endDate', filters.endDate.toISOString());
  if (filters?.search) params.set('search', filters.search);

  const response = await fetch(`/api/transactions?${params.toString()}`);
  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch transactions');
  }

  return result;
}

async function fetchTransaction(id: string): Promise<Transaction> {
  const response = await fetch(`/api/transactions/${id}`);
  const data: ApiResponse<Transaction> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch transaction');
  }

  return data.data!;
}

async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Transaction> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create transaction');
  }

  return data.data!;
}

async function updateTransaction({
  id,
  ...input
}: UpdateTransactionInput & { id: string }): Promise<Transaction> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Transaction> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to update transaction');
  }

  return data.data!;
}

async function deleteTransaction(id: string): Promise<void> {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });

  const data: ApiResponse<void> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to delete transaction');
  }
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, filters],
    queryFn: () => fetchTransactions(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...TRANSACTIONS_KEY, data.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
