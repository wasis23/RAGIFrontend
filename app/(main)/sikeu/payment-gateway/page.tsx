'use client';

import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { sikeuService } from '@/services/sikeu.service';
import { PaymentGatewayConfigTemplate } from '@/components/sikeu/payment-gateway/templates/PaymentGatewayConfigTemplate';
import { GatewayConfigData } from '@/components/sikeu/payment-gateway/organisms/GatewayConfigFormPanel';

export default function PaymentGatewayConfigPage() {
  const [activeTab, setActiveTab] = useState('xendit');
  const [configs, setConfigs] = useState<Record<string, GatewayConfigData>>({});
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

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
      toast.error('Gagal mengambil konfigurasi: ' + (error.message || 'Error API'));
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
    } catch {
      // Quiet fallback for balance sync
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
      toast.success(`Konfigurasi ${activeTab.toUpperCase()} berhasil disimpan!`);
    } catch (error: any) {
      toast.error('Gagal menyimpan konfigurasi: ' + (error.message || 'Error API'));
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

  const currentConfig: GatewayConfigData = configs[activeTab] || {
    environment: 'sandbox',
    api_key: '',
    public_key: '',
    webhook_token: '',
    auto_disbursement_enabled: false,
    account_validation_enabled: false,
    max_disbursement_limit: 50000000,
    is_active: false,
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Memuat konfigurasi Payment Gateway...
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
      feedback={null}
    />
  );
}
