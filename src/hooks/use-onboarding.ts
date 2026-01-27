'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AccountType } from '@/types';

interface AccountInput {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bankName?: string;
  lastFourDigits?: string;
  description?: string;
  creditLimit?: number;
}

interface CompleteOnboardingInput {
  accounts: AccountInput[];
  currency: string;
  monthlyIncome?: number;
}

interface OnboardingResponse {
  data?: {
    accounts: unknown[];
    settings: unknown;
  };
  message?: string;
  error?: string;
  field?: string;
  details?: unknown[];
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteOnboardingInput): Promise<OnboardingResponse> => {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries after onboarding completes
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
