'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filterTipe: string;
  onTipeChange: (val: string) => void;
  filterStatus: string;
  onStatusChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filterTipe,
  onTipeChange,
  filterStatus,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onApply,
  onReset,
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Jurnal Keuangan"
      width="420px"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="font-bold text-slate-600 min-h-[42px] px-4"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onApply}
            className="font-bold min-h-[42px] px-5 shadow-md"
          >
            Terapkan Filter
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Periode Tanggal
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Dari Tanggal"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
            <Input
              type="date"
              label="Sampai Tanggal"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>

        <Select
          label="Jenis Transaksi Keuangan"
          value={filterTipe}
          onChange={(val) => onTipeChange(val as string)}
          options={[
            { value: 'all', label: 'Semua Transaksi' },
            { value: 'masuk', label: '🟢 Uang Masuk (+)' },
            { value: 'keluar', label: '🔴 Uang Keluar (-)' },
          ]}
        />

        <Select
          label="Status Posting Jurnal"
          value={filterStatus}
          onChange={(val) => onStatusChange(val as string)}
          options={[
            { value: 'all', label: 'Semua Status' },
            { value: 'posted', label: 'Posted / Lunas' },
            { value: 'pending', label: 'Pending' },
            { value: 'draft', label: 'Draft' },
            { value: 'void', label: 'Void / Dibatalkan' },
          ]}
        />
      </div>
    </Drawer>
  );
};
