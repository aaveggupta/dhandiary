import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Bank {
  id: string;
  name: string;
  country: string;
  isSystem: boolean;
}

interface BanksResponse {
  data: Bank[];
}

interface BankResponse {
  data: Bank;
}

// Fetch all banks
async function fetchBanks(country?: string, search?: string): Promise<Bank[]> {
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  if (search) params.set('search', search);

  const url = `/api/banks${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Failed to fetch banks');
  }

  const json: BanksResponse = await res.json();
  return json.data;
}

// Create a new bank
async function createBank(data: { name: string; country?: string }): Promise<Bank> {
  const res = await fetch('/api/banks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create bank');
  }

  const json: BankResponse = await res.json();
  return json.data;
}

// Hook to fetch banks
export function useBanks(country?: string, search?: string) {
  return useQuery({
    queryKey: ['banks', country, search],
    queryFn: () => fetchBanks(country, search),
    staleTime: 1000 * 60 * 5, // 5 minutes - banks don't change often
  });
}

// Hook to create a new bank
export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      // Invalidate banks query to refetch with new bank
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });
}
