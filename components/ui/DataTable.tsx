'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
  renderExpandedRow?: (row: T, index: number) => React.ReactNode;
  defaultExpandedAll?: boolean;
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
  renderExpandedRow,
  defaultExpandedAll = false,
}: DataTableProps<T>) {
  const [expandedAll, setExpandedAll] = useState(defaultExpandedAll);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const rowKey = (row: T, index: number) =>
    String((row as { id?: number | string }).id ?? index);

  const isExpanded = (row: T, index: number) =>
    expandedAll || expandedKeys.has(rowKey(row, index));

  const toggleRow = (row: T, index: number) => {
    const key = rowKey(row, index);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Calculate which items are shown
  const from = meta?.from ?? 0;
  const to = meta?.to ?? 0;
  const total = meta?.total ?? 0;
  const expandable = typeof renderExpandedRow === 'function';
  const colCount = columns.length + (expandable ? 1 : 0);

  return (
    <div className="table-container bg-white shadow-xs">
      <div className="table-wrapper bg-white">
        <table className="table bg-white">
          <thead className="bg-white">
            <tr className="bg-white">
              {expandable && (
                <th className="bg-white" style={{ width: '36px', padding: '0.5rem' }}>
                  {data.length > 0 && !isLoading && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ padding: '2px' }}
                      title={expandedAll ? 'Tutup semua rincian' : 'Buka semua rincian'}
                      onClick={() => {
                        setExpandedAll((v) => !v);
                        setExpandedKeys(new Set());
                      }}
                    >
                      <ChevronDown
                        size={16}
                        style={{
                          transform: expandedAll ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.15s ease-in-out',
                        }}
                      />
                    </button>
                  )}
                </th>
              )}
              {columns.map((col, index) => (
                <th key={col.key || index} style={{ textAlign: col.align || 'left' }} className="bg-white">
                  {col.headerRender ? col.headerRender() : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              Array.from({ length: meta?.per_page || 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={colCount} />
              ))
            ) : data.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={colCount} style={{ textAlign: 'center', padding: '3rem 1rem' }} className="bg-white">
                  <div style={{ color: 'var(--text-muted)' }}>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <React.Fragment key={(row as { id?: number | string }).id || rowIndex}>
                  <tr
                    className={`bg-white hover:bg-slate-50 transition-colors ${rowClassName ? rowClassName(row, rowIndex) : ''}`}
                  >
                    {expandable && (
                      <td className="bg-white" style={{ width: '36px', padding: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ padding: '2px' }}
                          title={isExpanded(row, rowIndex) ? 'Sembunyikan rincian' : 'Tampilkan rincian debet/kredit'}
                          onClick={() => toggleRow(row, rowIndex)}
                        >
                          <ChevronDown
                            size={16}
                            style={{
                              transform: isExpanded(row, rowIndex) ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.15s ease-in-out',
                            }}
                          />
                        </button>
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td key={col.key || colIndex} style={{ textAlign: col.align || 'left' }} className="bg-white">
                        {col.render ? col.render(row, rowIndex) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded(row, rowIndex) && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={colCount} style={{ padding: '0.75rem 1rem 1rem 2.75rem' }} className="bg-slate-50/60">
                        {renderExpandedRow?.(row, rowIndex)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
          backgroundColor: '#ffffff'
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
