'use client';

import { useCallback } from 'react';
import { AsyncSelect } from '@/components/ui/AsyncSelect';
import { lmsService } from '@/services/lms.service';

export interface KelasSelectProps {
  value?: string | number | null;
  onChange?: (val: any) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  isDisabled?: boolean;
}

/**
 * Loader option kelas milik user (kelas yang diampu dosen atau diambil lewat KRS).
 *
 * Data diambil dari `GET /lms/kelas/my` dengan `search` server-side, jadi daftar
 * kelas TIDAK ditulis ulang di tiap halaman — filter Drawer maupun form pembuatan
 * data yang berlingkup kelas memakai sumber yang sama.
 */
export function useKelasOptions() {
  return useCallback(async (inputValue: string) => {
    try {
      const res = await lmsService.getMyKelas({
        search: inputValue || undefined,
        per_page: 20,
      });
      return (res.data || []).map((k) => ({
        value: String(k.id),
        label: `${k.kode_kelas} — ${k.mata_kuliah?.nama || k.nama_kelas}`,
      }));
    } catch {
      return [];
    }
  }, []);
}

/**
 * Field AsyncSelect untuk entitas kelas. Nilai yang dikirim ke API adalah
 * `kelas.id` (referensi ID), bukan nama/kode kelas.
 */
export default function KelasSelect({
  value,
  onChange,
  label = 'Kelas',
  placeholder = 'Semua kelas...',
  error,
  required,
  isDisabled,
}: KelasSelectProps) {
  const loadOptions = useKelasOptions();

  return (
    <AsyncSelect
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      error={error}
      required={required}
      isClearable
      isDisabled={isDisabled}
    />
  );
}