import { describe, it, expect } from 'vitest';
import { escapeCSVField, transactionsToCSV } from './csv';
import type { Transaction } from '@/types';

// Helper to build a minimal Transaction for testing.
// Uses `as unknown as Transaction` because Prisma Decimal fields
// don't accept plain numbers in strict TS, but toNumber() handles them at runtime.
function makeTx(
  overrides: Record<string, unknown> & { type: string; amount: number }
): Transaction {
  return {
    id: 'tx-1',
    userId: 'user-1',
    accountId: 'acc-1',
    destinationAccountId: null,
    categoryId: null,
    date: new Date('2025-03-15'),
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    account: { id: 'acc-1', name: 'HDFC Savings' },
    destinationAccount: null,
    ...overrides,
  } as unknown as Transaction;
}

describe('escapeCSVField', () => {
  it('should return plain fields unchanged', () => {
    expect(escapeCSVField('hello')).toBe('hello');
    expect(escapeCSVField('123')).toBe('123');
  });

  it('should wrap fields with commas in quotes', () => {
    expect(escapeCSVField('hello, world')).toBe('"hello, world"');
  });

  it('should double-quote fields with quotes', () => {
    expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""');
  });

  it('should wrap fields with newlines', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('transactionsToCSV', () => {
  it('should return only the header row for an empty array', () => {
    const csv = transactionsToCSV([]);
    expect(csv).toBe('Date,Type,Category,Account,To Account,Amount,Note');
  });

  it('should format income as positive amount', () => {
    const tx = makeTx({
      type: 'INCOME',
      amount: 5000,
      category: { id: 'c1', name: 'Salary', type: 'INCOME' },
    });

    const csv = transactionsToCSV([tx]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);

    const fields = lines[1].split(',');
    expect(fields[0]).toBe('2025-03-15'); // Date
    expect(fields[1]).toBe('Income'); // Type label
    expect(fields[2]).toBe('Salary'); // Category
    expect(fields[3]).toBe('HDFC Savings'); // Account
    expect(fields[4]).toBe(''); // To Account (not a transfer)
    expect(fields[5]).toBe('5000'); // Amount positive
  });

  it('should format expense as negative amount', () => {
    const tx = makeTx({
      type: 'EXPENSE',
      amount: 1200,
      category: { id: 'c2', name: 'Food', type: 'EXPENSE' },
    });

    const csv = transactionsToCSV([tx]);
    const fields = csv.split('\n')[1].split(',');
    expect(fields[5]).toBe('-1200');
  });

  it('should format transfer with negative amount and destination account', () => {
    const tx = makeTx({
      type: 'TRANSFER',
      amount: 3000,
      destinationAccountId: 'acc-2',
      destinationAccount: { id: 'acc-2', name: 'SBI Savings' },
    });

    const csv = transactionsToCSV([tx]);
    const fields = csv.split('\n')[1].split(',');
    expect(fields[1]).toBe('Transfer');
    expect(fields[4]).toBe('SBI Savings'); // To Account
    expect(fields[5]).toBe('-3000');
  });

  it('should handle notes with commas by escaping', () => {
    const tx = makeTx({
      type: 'EXPENSE',
      amount: 500,
      note: 'Groceries, fruits, and vegetables',
    });

    const csv = transactionsToCSV([tx]);
    const line = csv.split('\n')[1];
    // The note field should be quoted
    expect(line).toContain('"Groceries, fruits, and vegetables"');
  });

  it('should handle notes with quotes by escaping', () => {
    const tx = makeTx({
      type: 'EXPENSE',
      amount: 200,
      note: 'Bought "special" item',
    });

    const csv = transactionsToCSV([tx]);
    const line = csv.split('\n')[1];
    expect(line).toContain('"Bought ""special"" item"');
  });

  it('should handle mixed transaction types', () => {
    const transactions = [
      makeTx({ id: 'tx-1', type: 'INCOME', amount: 10000, date: new Date('2025-03-01') }),
      makeTx({ id: 'tx-2', type: 'EXPENSE', amount: 2500, date: new Date('2025-03-02') }),
      makeTx({
        id: 'tx-3',
        type: 'TRANSFER',
        amount: 1000,
        date: new Date('2025-03-03'),
        destinationAccountId: 'acc-2',
        destinationAccount: { id: 'acc-2', name: 'Cash' },
      }),
    ];

    const csv = transactionsToCSV(transactions);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // header + 3 rows
    expect(lines[1]).toContain('10000'); // positive income
    expect(lines[2]).toContain('-2500'); // negative expense
    expect(lines[3]).toContain('-1000'); // negative transfer
  });
});
