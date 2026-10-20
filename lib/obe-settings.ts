'use client';

import { useState, useEffect, useCallback } from 'react';
import { siakadService } from '@/services/siakad.service';

export interface ObeSettings {
  tahun_akademik_id?: number | null;
  tahun_akademik_label?: string | null;
  semester?: string | null;
  kurikulum_id?: number | null;
  kurikulum_label?: string | null;
  updated_at?: string | null;
}

const STORAGE_KEY = 'ragi_obe_active_settings';

export function getStoredObeSettings(): ObeSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredObeSettings(settings: ObeSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('obe-settings-changed', { detail: settings }));
  } catch {
    // Abaikan kegagalan localStorage
  }
}

export function formatTahunAkademikLabel(ta: any): string {
  if (!ta) return '';
  if (ta.tahun_mulai && ta.tahun_selesai) {
    return `${ta.tahun_mulai}/${ta.tahun_selesai}`;
  }
  return ta.nama || ta.kode || '';
}

export function formatKurikulumLabel(k: any): string {
  if (!k) return '';
  const kode = k.kode || `K-${k.id}`;
  const nama = k.nama ? ` - ${k.nama}` : '';
  const tahun = k.tahun_berlaku ? ` (${k.tahun_berlaku})` : '';
  return `${kode}${nama}${tahun}`;
}

export async function fetchTahunAkademikOptions(keyword?: string) {
  try {
    const res = await siakadService.getTahunAkademiks({ search: keyword || undefined, per_page: 50 });
    const raw = res?.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
    return list.map((ta: any) => {
      const cleanLabel = formatTahunAkademikLabel(ta);
      return {
        value: String(ta.id),
        label: ta.nama && ta.nama !== cleanLabel ? `${cleanLabel} (${ta.nama})` : cleanLabel,
        cleanLabel,
        raw: ta,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchKurikulumOptions(keyword?: string) {
  try {
    const res = await siakadService.getKurikulums({ search: keyword || undefined, per_page: 50 });
    const raw = res?.data;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items || raw?.data || []);
    return list.map((k: any) => {
      const cleanLabel = formatKurikulumLabel(k);
      return {
        value: String(k.id),
        label: cleanLabel,
        cleanLabel,
        raw: k,
      };
    });
  } catch {
    return [];
  }
}

export function useObeSettings() {
  const [settings, setSettings] = useState<ObeSettings | null>(() => getStoredObeSettings());
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siakadService.getObeSettings();
      if (res?.data) {
        setSettings(res.data);
        saveStoredObeSettings(res.data);
      }
    } catch {
      // Jika gagal fetch ke server, gunakan yang tersimpan di localStorage
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleChanged = (e: any) => {
      if (e?.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener('obe-settings-changed', handleChanged);
    return () => {
      window.removeEventListener('obe-settings-changed', handleChanged);
    };
  }, [fetchSettings]);

  const updateSettings = async (newSettings: {
    tahun_akademik_id: number;
    semester: string;
    kurikulum_id: number;
  }) => {
    const res = await siakadService.updateObeSettings(newSettings);
    if (res?.data) {
      setSettings(res.data);
      saveStoredObeSettings(res.data);
    }
    return res;
  };

  return {
    settings,
    loading,
    reload: fetchSettings,
    updateSettings,
  };
}

export function useObeFilterContext() {
  const { settings, loading, updateSettings } = useObeSettings();
  const [taLabels, setTaLabels] = useState<Record<string, string>>({});
  const [kurikulumLabels, setKurikulumLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      if (settings.tahun_akademik_id && settings.tahun_akademik_label) {
        setTaLabels((prev) => ({ ...prev, [String(settings.tahun_akademik_id)]: settings.tahun_akademik_label! }));
      }
      if (settings.kurikulum_id && settings.kurikulum_label) {
        setKurikulumLabels((prev) => ({ ...prev, [String(settings.kurikulum_id)]: settings.kurikulum_label! }));
      }
    }
  }, [settings]);

  const recordLabelsFromItems = useCallback((items: any[]) => {
    if (!items || items.length === 0) return;
    const nextTa: Record<string, string> = {};
    const nextKur: Record<string, string> = {};

    items.forEach((item) => {
      if (item.tahun_akademik_id && item.tahun_akademik) {
        const lbl = formatTahunAkademikLabel(item.tahun_akademik);
        if (lbl) nextTa[String(item.tahun_akademik_id)] = lbl;
      }
      if (item.kurikulum_id && item.kurikulum) {
        const lbl = formatKurikulumLabel(item.kurikulum);
        if (lbl) nextKur[String(item.kurikulum_id)] = lbl;
      }
    });

    if (Object.keys(nextTa).length > 0) {
      setTaLabels((prev) => ({ ...prev, ...nextTa }));
    }
    if (Object.keys(nextKur).length > 0) {
      setKurikulumLabels((prev) => ({ ...prev, ...nextKur }));
    }
  }, []);

  const loadTahunAkademikOptions = useCallback(async (keyword: string) => {
    const opts = await fetchTahunAkademikOptions(keyword);
    if (opts.length > 0) {
      const nextTa: Record<string, string> = {};
      opts.forEach((o) => {
        if (o.cleanLabel) nextTa[o.value] = o.cleanLabel;
      });
      setTaLabels((prev) => ({ ...prev, ...nextTa }));
    }
    return opts;
  }, []);

  const loadKurikulumOptions = useCallback(async (keyword: string) => {
    const opts = await fetchKurikulumOptions(keyword);
    if (opts.length > 0) {
      const nextKur: Record<string, string> = {};
      opts.forEach((o) => {
        if (o.cleanLabel) nextKur[o.value] = o.cleanLabel;
      });
      setKurikulumLabels((prev) => ({ ...prev, ...nextKur }));
    }
    return opts;
  }, []);

  const getActiveTaLabel = useCallback(
    (taId?: string | number | null) => {
      if (!taId) return '';
      const strId = String(taId);
      if (taLabels[strId]) return taLabels[strId];
      if (String(settings?.tahun_akademik_id) === strId && settings?.tahun_akademik_label) {
        return settings.tahun_akademik_label;
      }
      return '';
    },
    [taLabels, settings]
  );

  const getActiveKurikulumLabel = useCallback(
    (kurId?: string | number | null) => {
      if (!kurId) return '';
      const strId = String(kurId);
      if (kurikulumLabels[strId]) return kurikulumLabels[strId];
      if (String(settings?.kurikulum_id) === strId && settings?.kurikulum_label) {
        return settings.kurikulum_label;
      }
      return '';
    },
    [kurikulumLabels, settings]
  );

  return {
    settings,
    loading,
    updateSettings,
    taLabels,
    kurikulumLabels,
    setTaLabels,
    setKurikulumLabels,
    loadTahunAkademikOptions,
    loadKurikulumOptions,
    recordLabelsFromItems,
    getActiveTaLabel,
    getActiveKurikulumLabel,
  };
}
