import { MetricCard } from '../molecules/MetricCard';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

interface BalanceData {
  available_balance: number;
  pending_settlement: number;
  total_balance: number;
  currency?: string;
  last_updated?: string;
}

interface FinancialSummaryPanelProps {
  gatewayName: string;
  balanceData: BalanceData;
  loading: boolean;
  onSync: () => void;
}

export function FinancialSummaryPanel({
  gatewayName,
  balanceData,
  loading,
  onSync,
}: FinancialSummaryPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Ringkasan Keuangan ({gatewayName.toUpperCase()})
          </h2>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSync}
          isLoading={loading}
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs min-h-[38px]"
        >
          {loading ? 'Sinkronisasi...' : 'Sync Saldo'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title={`Saldo Tersedia (${gatewayName.toUpperCase()})`}
          value={balanceData.available_balance || 0}
          lastUpdated={balanceData.last_updated || '-'}
          isPrimary
          variant="primary"
          loading={loading}
        />
        <MetricCard
          title="Pending Settlement"
          value={balanceData.pending_settlement || 0}
          variant="amber"
          loading={loading}
        />
        <MetricCard
          title="Total Akumulasi"
          value={balanceData.total_balance || 0}
          variant="indigo"
          loading={loading}
        />
      </div>
    </div>
  );
}
