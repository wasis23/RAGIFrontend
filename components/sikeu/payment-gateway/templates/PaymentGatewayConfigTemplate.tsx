import { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GatewayTabItem } from '../molecules/GatewayTabItem';
import { FinancialSummaryPanel } from '../organisms/FinancialSummaryPanel';
import { GatewayConfigFormPanel, GatewayConfigData } from '../organisms/GatewayConfigFormPanel';
import { StatusBadge } from '../atoms/StatusBadge';
import { Button } from '@/components/ui/Button';

interface PaymentGatewayConfigTemplateProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  gateways: string[];
  configs: Record<string, GatewayConfigData>;
  currentConfig: GatewayConfigData;
  balanceData: any;
  loadingBalance: boolean;
  onSyncBalance: () => void;
  onFormChange: (field: keyof GatewayConfigData, value: any) => void;
  onSaveConfig: (e: FormEvent) => void;
  savingConfig: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export function PaymentGatewayConfigTemplate({
  activeTab,
  onTabChange,
  gateways,
  configs,
  currentConfig,
  balanceData,
  loadingBalance,
  onSyncBalance,
  onFormChange,
  onSaveConfig,
  savingConfig,
  feedback,
}: PaymentGatewayConfigTemplateProps) {
  const activeGateway = Object.keys(configs).find((k) => configs[k]?.is_active) || activeTab;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 sm:pb-12 px-4 sm:px-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-5 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/sikeu"
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Kembali ke SIKEU"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge badge-indigo text-[10px] font-extrabold uppercase tracking-wider">
                Super Admin SSO
              </span>
              <StatusBadge
                status="active"
                text={`${activeGateway.toUpperCase()} Active`}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Konfigurasi Payment Gateway
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kredensial API, pantau saldo Real-Time, &amp; atur otomatisasi gateway pembayaran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSyncBalance}
            isLoading={loadingBalance}
            icon={<RefreshCw size={14} className={loadingBalance ? 'animate-spin' : ''} />}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs min-h-[44px]"
          >
            {loadingBalance ? 'Sinkronisasi...' : 'Sync Saldo'}
          </Button>
        </div>
      </div>

      {/* ── Toast Feedback Banner ──────────────────────────────────── */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-bold animate-fade-in shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Gateway Tabs (Horizontal Scroll on Mobile) ─────────────── */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex gap-2">
        {gateways.map((g) => (
          <GatewayTabItem
            key={g}
            id={g}
            name={g.toUpperCase()}
            isActiveTab={activeTab === g}
            isGatewayActive={!!configs[g]?.is_active}
            onClick={() => onTabChange(g)}
          />
        ))}
      </div>

      {/* ── Financial Summary Panel ───────────────────────────────── */}
      <FinancialSummaryPanel
        gatewayName={activeTab}
        balanceData={balanceData}
        loading={loadingBalance}
        onSync={onSyncBalance}
      />

      {/* ── Gateway Configuration Form Panel ───────────────────────── */}
      <GatewayConfigFormPanel
        gatewayName={activeTab}
        config={currentConfig}
        onChange={onFormChange}
        onSave={onSaveConfig}
        saving={savingConfig}
      />

      {/* ── Mobile Sticky Action Bar (375px - 430px) ───────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between gap-3 shadow-lg">
        <div className="text-xs">
          <span className="text-slate-500 block text-[10px]">Gateway Aktif:</span>
          <span className="font-extrabold text-slate-800 uppercase">{activeTab}</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          isLoading={savingConfig}
          onClick={onSaveConfig as any}
          icon={<Save size={16} />}
          className="font-bold min-h-[44px] px-5 shadow-sm"
        >
          Simpan Konfigurasi
        </Button>
      </div>
    </div>
  );
}
