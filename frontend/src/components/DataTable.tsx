import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  page,
  totalPages,
  onPageChange,
  emptyMessage = 'No records found',
}: Props<T>) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {columns.map((c) => (
                <th
                  key={c.header}
                  className={`px-5 py-3.5 ${
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                  } ${c.className ?? ''}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ${
                    onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gray-50/50'
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.header}
                      className={`px-5 py-3.5 text-sm text-gray-700 ${
                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/40 text-xs font-medium text-gray-600">
          <div>
            Page <span className="font-bold text-gray-900">{page}</span> of{' '}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => onPageChange?.((page ?? 1) - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              ← Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => onPageChange?.((page ?? 1) + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
