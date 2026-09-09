'use client';

import { useDomain } from '@/hooks/useDomain';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export function DemoBanner() {
  const { isDemo, hostname } = useDomain();

  if (!isDemo) return null;

  const prodUrl = typeof window !== 'undefined'
    ? window.location.href.replace('demo-', '')
    : '#';

  return (
    <div className="w-full bg-amber-500 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm z-50 border-b border-amber-600">
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <AlertTriangle size={16} className="text-slate-950 shrink-0" />
        <span>
          <strong>MODE DEMO / TESTING:</strong> Terhubung ke Database Demo ({hostname}). Data tidak mempengaruhi sistem produksi.
        </span>
      </div>
      <a
        href={prodUrl}
        className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-0.5 rounded text-xs font-semibold transition-colors"
      >
        <span>Beralih ke Produksi</span>
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
