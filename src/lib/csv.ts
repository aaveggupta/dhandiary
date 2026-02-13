import { toNumber } from './finance';
import { TRANSACTION_TYPE_CONFIG } from './constants';
import type { Transaction, TransactionType } from '@/types';

/**
 * Escape a field for CSV output.
 * Wraps in double quotes if the field contains commas, quotes, or newlines.
 * Doubles any existing quotes per RFC 4180.
 */
export function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

const CSV_HEADERS = ['Date', 'Type', 'Category', 'Account', 'To Account', 'Amount', 'Note'];

/**
 * Convert an array of transactions to a CSV string.
 *
 * - Date in YYYY-MM-DD format (sorts well in spreadsheets)
 * - Amount: positive for income, negative for expense/transfer (plain number, no currency symbol)
 * - Category: blank for uncategorized or transfers
 * - To Account: only populated for transfers
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  const rows: string[] = [CSV_HEADERS.map(escapeCSVField).join(',')];

  for (const t of transactions) {
    const date = new Date(t.date).toISOString().split('T')[0];
    const typeLabel = TRANSACTION_TYPE_CONFIG[t.type as TransactionType]?.label ?? t.type;
    const category = t.category?.name ?? '';
    const account = t.account?.name ?? '';
    const toAccount = t.destinationAccount?.name ?? '';

    const rawAmount = toNumber(t.amount);
    const amount = t.type === 'INCOME' ? rawAmount : -rawAmount;

    const note = t.note ?? '';

    const fields = [date, typeLabel, category, account, toAccount, String(amount), note];
    rows.push(fields.map(escapeCSVField).join(','));
  }

  return rows.join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 * Prepends a UTF-8 BOM so Excel opens the file with correct encoding.
 */
export function downloadCSV(csvString: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
