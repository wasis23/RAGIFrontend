import { useState, useEffect } from 'react';
import { siakadService } from '@/services/siakad.service';

/**
 * Opsi dropdown master akademik — SUMBER TUNGGAL: database.
 *
 * Diambil dari tabel master referensi (modul siakad) via
 * `GET /v1/siakad/akademik/referensi-options?tipe=...`.
 * Jika database kosong, dropdown tampil kosong (empty state);
 * tidak ada literal cadangan di kode.
 */
export interface SiakadOption {
  value: string;
  label: string;
}

export const SIAKAD_OPTION_TYPES = {
  JENJANG: 'jenjang_prodi',
  AKREDITASI: 'akreditasi_prodi',
  TIPE_MK: 'tipe_mk',
  TIPE_PRASYARAT: 'tipe_prasyarat_mk',
  MODE_PENILAIAN: 'mode_penilaian',
  KATEGORI_CPL: 'kategori_cpl',
  TEKNIK_PENILAIAN: 'teknik_penilaian',
  HARI_KULIAH: 'hari_kuliah',
  STATUS_ABSENSI: 'status_absensi',
  PREDIKAT_KELULUSAN: 'predikat_kelulusan',
} as const;

const cache = new Map<string, SiakadOption[]>();

export async function fetchSiakadOptions(tipe: string): Promise<SiakadOption[]> {
  if (cache.has(tipe)) return cache.get(tipe)!;
  try {
    const res = await siakadService.getReferensiOptions(tipe);
    const list: any[] = res.data || [];
    const options = list.map((r) => ({ value: String(r.kode), label: String(r.nama) }));
    cache.set(tipe, options);
    return options;
  } catch {
    return [];
  }
}

/** Hook: opsi dropdown dari database (empty saat DB kosong). */
export function useSiakadOptions(tipe: string): SiakadOption[] {
  const [options, setOptions] = useState<SiakadOption[]>(() => cache.get(tipe) || []);
  useEffect(() => {
    let mounted = true;
    fetchSiakadOptions(tipe).then((opts) => {
      if (mounted) setOptions(opts);
    });
    return () => {
      mounted = false;
    };
  }, [tipe]);
  return options;
}
