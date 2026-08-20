'use client';

import React from 'react';
import { FinancialMetricCard } from '@/components/sikeu/akuntansi/molecules/FinancialMetricCard';

interface BalanceData {
  available_balance: number;
  pending_settlement: number;
  total_balance: number;
  currency?: string;
  last_updated?: string;
}

interface FinancialSummaryProps {
  gatewayName: string;
  balanceData: BalanceData;
  loading: boolean;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  gatewayName,
  balanceData,
  loading,
}) => {
  const gName = gatewayName.toUpperCase();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">
          Ringkasan Keuangan ({gName})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <FinancialMetricCard
          title={`SALDO TERSEDIA (${gName})`}
          amount={balanceData.available_balance || 0}
          type="inflow"
          countInfo={balanceData.last_updated ? `Terakhir disinkronkan: ${balanceData.last_updated}` : 'Saldo aktif real-time'}
          loading={loading}
        />

        <FinancialMetricCard
          title="PENDING SETTLEMENT"
          amount={balanceData.pending_settlement || 0}
          type="outflow"
          countInfo="Dalam proses kliring bank"
          loading={loading}
        />

        <FinancialMetricCard
          title="TOTAL AKUMULASI"
          amount={balanceData.total_balance || 0}
          type="balance"
          countInfo="Total saldo kas gateway"
          loading={loading}
        />
      </div>
    </div>
  );
};
