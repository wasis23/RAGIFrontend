import { referensiService, type MasterReferensiItem } from '@/services/referensi.service';
import type { BadgeVariant } from '@/components/ui/Badge';

/**
 * Master referensi (tabel `spmb_master_referensi`, modul=siakad) yang menjadi
 * sumber tunggal nilai domain fitur Bimbingan PA. Dilarang menyalin nilai-nilai
 * ini menjadi array literal statis di komponen — semuanya WAJIB dibaca dari API.
 */
export const PA_REFERENSI_TIPE = {
  jadwalMode: 'pa_jadwal_mode',
  jadwalStatus: 'pa_jadwal_status',
  bookingStatus: 'pa_booking_status',
  pklJenis: 'pa_pkl_jenis',
  pklStatus: 'pa_pkl_status',
  insidenJenis: 'pa_insiden_jenis',
  insidenStatus: 'pa_insiden_status',
  eskalasiTujuan: 'pa_eskalasi_tujuan',
  catatanKategori: 'pa_catatan_kategori',
  tindakLanjutStatus: 'pa_tindak_lanjut_status',
} as const;

export type PaReferensiTipe = (typeof PA_REFERENSI_TIPE)[keyof typeof PA_REFERENSI_TIPE];

export const PA_MODUL = 'siakad';

export interface SelectOptionItem {
  value: string;
  label: string;
}

/** Peta kode -> nama referensi untuk satu tipe. */
export type ReferensiMap = Record<string, string>;

/** Kumpulan peta referensi per tipe PA. */
export type PaReferensiState = Record<PaReferensiTipe, ReferensiMap>;

export const EMPTY_PA_REFERENSI: PaReferensiState = {
  [PA_REFERENSI_TIPE.jadwalMode]: {},
  [PA_REFERENSI_TIPE.jadwalStatus]: {},
  [PA_REFERENSI_TIPE.bookingStatus]: {},
  [PA_REFERENSI_TIPE.pklJenis]: {},
  [PA_REFERENSI_TIPE.pklStatus]: {},
  [PA_REFERENSI_TIPE.insidenJenis]: {},
  [PA_REFERENSI_TIPE.insidenStatus]: {},
  [PA_REFERENSI_TIPE.eskalasiTujuan]: {},
  [PA_REFERENSI_TIPE.catatanKategori]: {},
  [PA_REFERENSI_TIPE.tindakLanjutStatus]: {},
};

function toMap(items: MasterReferensiItem[]): ReferensiMap {
  const map: ReferensiMap = {};
  for (const item of items) {
    const kode = item.kode ?? String(item.id);
    map[kode] = item.nama;
  }
  return map;
}

/** Ambil seluruh peta referensi PA sekaligus (satu kali per tipe). */
export async function fetchPaReferensi(): Promise<PaReferensiState> {
  const tipeList = Object.values(PA_REFERENSI_TIPE);
  const results = await Promise.all(
    tipeList.map((tipe) =>
      referensiService
        .getAll({ modul: PA_MODUL, tipe })
        .then((items) => toMap(items || []))
        .catch(() => ({} as ReferensiMap))
    )
  );

  const state: PaReferensiState = { ...EMPTY_PA_REFERENSI };
  tipeList.forEach((tipe, idx) => {
    state[tipe] = results[idx];
  });
  return state;
}

/** Ubah peta referensi menjadi opsi <Select> (value=kode, label=nama). */
export function referensiOptions(map: ReferensiMap): SelectOptionItem[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

/** Label tampilan untuk sebuah kode; fallback ke kode mentah bila belum termuat. */
export function referensiLabel(map: ReferensiMap, kode?: string | null): string {
  if (!kode) return '-';
  return map[kode] ?? kode;
}

/**
 * Nilai tetap (closed-set) yang TIDAK memiliki tabel master: keputusan visual
 * (warna badge) dan band risiko hasil kalkulasi backend. Dipusatkan di sini dan
 * TIDAK diduplikasi di komponen.
 */
export const RISIKO_BAND_VARIANT: Record<string, BadgeVariant> = {
  tinggi: 'danger',
  sedang: 'warning',
  rendah: 'success',
};

/** Label tampilan band risiko (hasil kalkulasi backend, bukan entitas master). */
export const RISIKO_BAND_LABEL: Record<string, string> = {
  tinggi: 'Tinggi',
  sedang: 'Sedang',
  rendah: 'Rendah',
};

export const JADWAL_STATUS_VARIANT: Record<string, BadgeVariant> = {
  dibuka: 'green',
  ditutup: 'gray',
};

export const BOOKING_STATUS_VARIANT: Record<string, BadgeVariant> = {
  diajukan: 'amber',
  disetujui: 'green',
  ditolak: 'red',
  selesai: 'gray',
  batal: 'gray',
};

export const PKL_STATUS_VARIANT: Record<string, BadgeVariant> = {
  rencana: 'gray',
  berjalan: 'amber',
  selesai: 'green',
  batal: 'gray',
};

export const INSIDEN_STATUS_VARIANT: Record<string, BadgeVariant> = {
  dilaporkan: 'amber',
  diverifikasi: 'blue',
  ditangani: 'amber',
  selesai: 'green',
  ditolak: 'gray',
};

export function variantFor(map: Record<string, BadgeVariant>, kode?: string | null): BadgeVariant {
  if (!kode) return 'gray';
  return map[kode] ?? 'gray';
}

/** Format tanggal lokal (yyyy-MM-dd) tanpa pergeseran zona waktu (hindari toISOString). */
export function toLocalDateInput(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const PA_SINYAL_KEHADIRAN_KRITIS = 'kehadiran_kritis' as const;

/** Format bulan lokal (yyyy-MM) untuk input periode laporan. */
export function toLocalMonthInput(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
