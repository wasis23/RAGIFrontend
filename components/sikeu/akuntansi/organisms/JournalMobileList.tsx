'use client';

import React from 'react';
import { JournalMobileCard } from '../molecules/JournalMobileCard';
import { JournalItemData } from '../molecules/JournalRow';
import { FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface JournalMobileListProps {
  data: JournalItemData[];
  loading: boolean;
  onSelect: (item: JournalItemData) => void;
  onResetSearch?: () => void;
}

export const JournalMobileList: React.FC<JournalMobileListProps> = ({
  data,
  loading,
  onSelect,
  onResetSearch,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl animate-pulse space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
              <div className="h-4 w-12 bg-slate-100 rounded"></div>
            </div>
            <div className="h-4 w-40 bg-slate-200 rounded"></div>
            <div className="h-3 w-24 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <FileText size={20} />
        </div>
        <div>
          <p className="font-extrabold text-slate-900 text-sm">Belum Ada Transaksi</p>
          <p className="text-2xs text-slate-500 mt-0.5">
            Belum ada transaksi pada periode ini.
          </p>
        </div>
        {onResetSearch && (
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw size={14} />}
            onClick={onResetSearch}
            className="font-bold mx-auto text-xs"
          >
            Reset Filter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map((item) => (
        <JournalMobileCard key={item.id} data={item} onSelect={onSelect} />
      ))}
    </div>
  );
};
