'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category, CreateCategoryInput, ApiResponse, TransactionType } from '@/types';

const CATEGORIES_KEY = ['categories'];

async function fetchCategories(type?: TransactionType): Promise<Category[]> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);

  const response = await fetch(`/api/categories?${params.toString()}`);
  const data: ApiResponse<Category[]> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to fetch categories');
  }

  return data.data || [];
}

async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<Category> = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create category');
  }

  return data.data!;
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, type],
    queryFn: () => fetchCategories(type),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}
