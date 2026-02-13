'use client';

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type OnChangeFn,
  type TableMeta,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui';

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  isLoading?: boolean;
  footer?: React.ReactNode;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  meta?: TableMeta<TData>;
}

export function DataTable<TData>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  isLoading,
  footer,
  emptyMessage = 'No results found',
  emptyAction,
  meta,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    meta,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-surface/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none transition-colors hover:text-text'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-muted/50">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Spinner className="h-8 w-8" />
                    <span className="text-sm text-muted">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <p className="text-sm text-muted">{emptyMessage}</p>
                  {emptyAction && <div className="mt-4">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {(footer || pageCount > 1) && (
        <div className="flex flex-col gap-3 border-t border-white/10 bg-surface/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {footer && <div className="text-sm text-muted">{footer}</div>}
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-muted"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-muted">
                Page <span className="font-semibold text-text">{pagination.pageIndex + 1}</span> of{' '}
                <span className="font-semibold text-text">{pageCount}</span>
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-text disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-muted"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
