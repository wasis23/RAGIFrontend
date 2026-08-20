'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SaveConfigurationBarProps {
  activeTab: string;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
}

export const SaveConfigurationBar: React.FC<SaveConfigurationBarProps> = ({
  activeTab,
  saving,
  onSave,
}) => {
  return (
    <>
      {/* Desktop Bottom Action */}
      <div className="hidden sm:flex items-center justify-end pt-4">
        <Button
          type="button"
          variant="primary"
          onClick={onSave as any}
          disabled={saving}
          icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          className="font-bold shadow-md min-h-[44px] px-6 text-xs"
        >
          {saving ? 'Memproses...' : `Simpan Konfigurasi ${activeTab.toUpperCase()}`}
        </Button>
      </div>

      {/* Mobile Sticky Bottom Action Bar (320px - 639px) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between gap-3 shadow-lg">
        <div className="text-2xs">
          <span className="text-slate-400 block font-semibold">Gateway:</span>
          <span className="font-extrabold text-slate-900 uppercase font-mono">{activeTab}</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={saving}
          onClick={onSave as any}
          icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          className="font-bold min-h-[42px] px-5 shadow-sm text-xs"
        >
          {saving ? 'Simpan...' : 'Simpan Konfigurasi'}
        </Button>
      </div>
    </>
  );
};
