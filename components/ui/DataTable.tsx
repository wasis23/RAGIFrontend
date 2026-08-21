'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableRowSkeleton } from './Skeleton';
import { Select } from './Select';
import type { PaginationMeta } from '@/types/api.types';

export interface ColumnDef<T> {
  key: string;
  label: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  emptyMessage?: React.ReactNode;
  rowClassName?: (row: T, index: number) => string;
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  meta,
  onPageChange,
  onLimitChange,
  emptyMessage = 'Data tidak ditemukan.',
  rowClassName,
}: DataTableProps<T>) {
  
  // Calculate which items are shown
  const from = meta?.from ?? 0;
  const to = meta?.to ?? 0;
  const total = meta?.total ?? 0;

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={col.key || index} style={{ textAlign: col.align || 'left' }}>
                  {col.headerRender ? col.headerRender() : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: meta?.per_page || 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={(row as { id?: number | string }).id || rowIndex}
                  className={rowClassName ? rowClassName(row, rowIndex) : undefined}
                >
                  {columns.map((col, colIndex) => (
                    <td key={col.key || colIndex} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {meta && (
        <div style={{ 
          padding: '1rem 1.25rem', 
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: 'var(--bg-card)'
        }}>
          {/* Limit / Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Tampilkan:</span>
              <div style={{ width: '80px' }}>
                <Select 
                  value={(meta.per_page ?? 10).toString()}
                  onChange={(val) => onLimitChange?.(Number(val))}
                  options={[
                    { value: '10', label: '10' },
                    { value: '15', label: '15' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                />
              </div>
            </div>
            
            <span>
              Menampilkan {from} - {to} dari {total} data
            </span>
          </div>

          {/* Page Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => onPageChange?.(meta.current_page - 1)}
              style={{ padding: '4px' }}
            >
              <ChevronLeft size={16} />
            </button>
            
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', padding: '0 0.5rem' }}>
              Halaman {meta.current_page} / {meta.last_page || 1}
            </div>

            <button
              className="btn btn-ghost btn-sm btn-icon"
              disabled={meta.current_page >= meta.last_page || isLoading}
              onClick={() => onPageChange?.(meta.current_page + 1)}
              style={{ padding: '4px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
