'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { FilterChip } from '../atoms/FilterChip';

interface JournalFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTipe: string;
  onTipeChange: (tipe: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  onOpenFilterSheet: () => void;
  activeFilterCount: number;
  onClearFilters: () => void;
}

export const JournalFilterBar: React.FC<JournalFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterTipe,
  onTipeChange,
  filterStatus,
  onStatusChange,
  onOpenFilterSheet,
  activeFilterCount,
  onClearFilters,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor jurnal, transaksi, atau akun..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Desktop Quick Select Filters */}
        <div className="hidden md:flex items-center gap-2">
          <select
            value={filterTipe}
            onChange={(e) => onTipeChange(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-500 shadow-2xs cursor-pointer"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="masuk">Uang Masuk (+)</option>
            <option value="keluar">Uang Keluar (-)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-primary-500 shadow-2xs cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="posted">Lunas / Posted</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="void">Void</option>
          </select>
        </div>

        {/* Mobile Filter Button */}
        <button
          type="button"
          onClick={onOpenFilterSheet}
          className="md:hidden flex items-center justify-center gap-1.5 py-2 px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs active:bg-slate-50"
        >
          <Filter size={14} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary-600 text-white text-2xs font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Chips */}
      {(activeFilterCount > 0 || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {searchQuery && (
            <FilterChip label="Cari" value={searchQuery} onRemove={() => onSearchChange('')} />
          )}
          {filterTipe !== 'all' && (
            <FilterChip
              label="Jenis"
              value={filterTipe === 'masuk' ? 'Uang Masuk' : 'Uang Keluar'}
              onRemove={() => onTipeChange('all')}
            />
          )}
          {filterStatus !== 'all' && (
            <FilterChip label="Status" value={filterStatus} onRemove={() => onStatusChange('all')} />
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-2xs font-bold text-rose-600 hover:underline px-1 py-0.5"
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
};
