'use client';

import { useState, useCallback } from 'react';
import { transactionsToCSV, downloadCSV } from '@/lib/csv';
import type { Transaction, TransactionType } from '@/types';

interface ExportFilters {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export function useExportTransactions() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportCSV = useCallback(async (filters: ExportFilters) => {
    setIsExporting(true);
    setExportError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.accountId) params.set('accountId', filters.accountId);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/transactions/export?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        setExportError(body.error || 'Failed to export transactions');
        return;
      }

      const { data } = (await res.json()) as { data: Transaction[] };
      const csv = transactionsToCSV(data);

      // Build filename
      let filename: string;
      if (filters.startDate && filters.endDate) {
        const start = filters.startDate.split('T')[0];
        const end = filters.endDate.split('T')[0];
        filename = `transactions_${start}_to_${end}.csv`;
      } else {
        const today = new Date().toISOString().split('T')[0];
        filename = `transactions_${today}.csv`;
      }

      downloadCSV(csv, filename);
    } catch {
      setExportError('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const clearExportError = useCallback(() => setExportError(null), []);

  return { exportCSV, isExporting, exportError, clearExportError };
}
