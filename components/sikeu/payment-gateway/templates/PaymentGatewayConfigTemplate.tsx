'use client';

import React, { FormEvent } from 'react';

// Organisms
import { PageHeader } from '../organisms/PageHeader';
import { GatewayTabs } from '../organisms/GatewayTabs';
import { FinancialSummary } from '../organisms/FinancialSummary';
import { EnvironmentSection } from '../organisms/EnvironmentSection';
import { CredentialSection } from '../organisms/CredentialSection';
import { AutomationSection } from '../organisms/AutomationSection';
import { SecuritySection } from '../organisms/SecuritySection';
import { SaveConfigurationBar } from '../organisms/SaveConfigurationBar';
import { GatewayConfigData } from '../organisms/GatewayConfigFormPanel';

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
}: PaymentGatewayConfigTemplateProps) {
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-24 sm:pb-12 px-1 sm:px-4 py-2 animate-fade-in">
      {/* 1. Page Header */}
      <PageHeader onSyncBalance={onSyncBalance} loadingBalance={loadingBalance} />

      {/* 2. Gateway Tabs */}
      <GatewayTabs
        gateways={gateways}
        activeTab={activeTab}
        onTabChange={onTabChange}
        configs={configs}
      />

      {/* 3. Financial Summary */}
      <FinancialSummary
        gatewayName={activeTab}
        balanceData={balanceData}
        loading={loadingBalance}
      />

      {/* 4. Main Configuration Sections (Form Workspace) */}
      <form onSubmit={onSaveConfig} className="space-y-4">
        {/* Section 1: Environment & Limit */}
        <EnvironmentSection config={currentConfig} onChange={onFormChange} />

        {/* Section 2: Credentials & Webhook */}
        <CredentialSection gatewayName={activeTab} config={currentConfig} onChange={onFormChange} />

        {/* Section 3: Automation */}
        <AutomationSection config={currentConfig} onChange={onFormChange} />

        {/* Section 4: Gateway Priority Status */}
        <SecuritySection gatewayName={activeTab} config={currentConfig} onChange={onFormChange} />

        {/* Action Save Bar */}
        <SaveConfigurationBar activeTab={activeTab} saving={savingConfig} onSave={onSaveConfig} />
      </form>
    </div>
  );
}
