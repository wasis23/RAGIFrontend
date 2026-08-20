'use client';

import { useState, useEffect, FormEvent } from 'react';
import { sikeuService } from '@/services/sikeu.service';
import { PaymentGatewayConfigTemplate } from '@/components/sikeu/payment-gateway/templates/PaymentGatewayConfigTemplate';
import { GatewayConfigData } from '@/components/sikeu/payment-gateway/organisms/GatewayConfigFormPanel';

export default function PaymentGatewayConfigPage() {
  const [activeTab, setActiveTab] = useState('xendit');
  const [configs, setConfigs] = useState<Record<string, GatewayConfigData>>({});
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [gatewayBalance, setGatewayBalance] = useState({
    available_balance: 0,
    pending_settlement: 0,
    total_balance: 0,
    currency: 'IDR',
    last_updated: '-',
  });
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    handleRefreshBalance();
  }, [activeTab]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await sikeuService.getPaymentGateways();
      const configMap: Record<string, GatewayConfigData> = {};
      if (res.data) {
        res.data.forEach((c: any) => {
          configMap[c.gateway_name.toLowerCase()] = {
            environment: c.environment || 'sandbox',
            api_key: c.api_key_encrypted || '',
            public_key: c.public_key_encrypted || '',
            webhook_token: c.webhook_token_encrypted || '',
            auto_disbursement_enabled: !!c.auto_disbursement_enabled,
            account_validation_enabled: !!c.account_validation_enabled,
            max_disbursement_limit: Number(c.max_disbursement_limit || 50000000),
            is_active: !!c.is_active,
          };
        });
      }

      // Defaults if not exists in DB yet
      const defaultGateways = ['xendit', 'duitku'];
      defaultGateways.forEach((g) => {
        if (!configMap[g]) {
          configMap[g] = {
            environment: 'sandbox',
            api_key: '',
            public_key: '',
            webhook_token: '',
            auto_disbursement_enabled: false,
            account_validation_enabled: false,
            max_disbursement_limit: 50000000,
            is_active: g === 'xendit',
          };
        }
      });

      setConfigs(configMap);
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal mengambil konfigurasi: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setLoadingBalance(true);
    try {
      const res = await sikeuService.getPaymentGatewayBalance(activeTab);
      if (res.data) {
        setGatewayBalance(res.data);
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal sinkronisasi saldo: ' + error.message });
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload = configs[activeTab];
      await sikeuService.updatePaymentGateway(activeTab.toLowerCase(), payload);
      setFeedback({
        type: 'success',
        message: `Konfigurasi ${activeTab.toUpperCase()} berhasil disimpan.`,
      });
      fetchConfigs(); // Refresh to reflect active state single-source of truth
    } catch (error: any) {
      setFeedback({ type: 'error', message: 'Gagal menyimpan: ' + error.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleFormChange = (field: keyof GatewayConfigData, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const defaultConfig: GatewayConfigData = {
    environment: 'sandbox',
    api_key: '',
    public_key: '',
    webhook_token: '',
    auto_disbursement_enabled: false,
    account_validation_enabled: false,
    max_disbursement_limit: 50000000,
    is_active: false,
  };

  const currentConfig = configs[activeTab] || defaultConfig;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
          Memuat Konfigurasi Payment Gateway...
        </p>
      </div>
    );
  }

  return (
    <PaymentGatewayConfigTemplate
      activeTab={activeTab}
      onTabChange={setActiveTab}
      gateways={['xendit', 'duitku']}
      configs={configs}
      currentConfig={currentConfig}
      balanceData={gatewayBalance}
      loadingBalance={loadingBalance}
      onSyncBalance={handleRefreshBalance}
      onFormChange={handleFormChange}
      onSaveConfig={handleSaveConfig}
      savingConfig={savingConfig}
      feedback={feedback}
    />
  );
}
