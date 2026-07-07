'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
}

function renderHeader<T>(column: { columnDef: ColumnDef<T, unknown> }) {
  const header = column.columnDef.header;
  if (typeof header === 'string') return header;
  if (header === undefined || header === null) return '';
  return flexRender(header, { column, header: column, table: null! } as never);
}

export function DataTable<T>({ columns, data, searchKey, searchPlaceholder }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {searchKey && (
        <input
          type="text"
          placeholder={searchPlaceholder || 'Search...'}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-sm"
        />
      )}

      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            No records found
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {row.getVisibleCells().map((cell) => {
                const label = renderHeader(cell.column);
                if (!label && cell.column.id === 'actions') {
                  return (
                    <div key={cell.id} className="mt-3 border-t border-slate-100 pt-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                }
                if (!label) return null;
                return (
                  <div
                    key={cell.id}
                    className="flex items-start justify-between gap-3 border-b border-slate-50 py-2.5 last:border-b-0"
                  >
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </span>
                    <div className="min-w-0 text-right text-sm text-slate-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-slate-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-center sm:text-left">{table.getFilteredRowModel().rows.length} records</span>
        <div className="flex justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="min-h-[40px] flex-1 rounded-md border border-slate-200 px-4 py-2 disabled:opacity-40 sm:flex-none sm:min-h-0 sm:py-1"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="min-h-[40px] flex-1 rounded-md border border-slate-200 px-4 py-2 disabled:opacity-40 sm:flex-none sm:min-h-0 sm:py-1"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
