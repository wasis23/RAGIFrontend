'use client';

/**
 * Helper terpusat untuk tab-tab Kelola Tryout.
 */

export type JendelaKey = 'terbuka' | 'belum' | 'berlangsung' | 'berakhir';

export function getJendelaStatus(
  dibukaAt?: string | null,
  ditutupAt?: string | null,
  now: number = Date.now()
): { key: JendelaKey; label: string } {
  if (!dibukaAt && !ditutupAt) return { key: 'terbuka', label: 'Terbuka' };
  const open = dibukaAt ? new Date(dibukaAt).getTime() : NaN;
  const close = ditutupAt ? new Date(ditutupAt).getTime() : NaN;
  if (!Number.isNaN(open) && now < open) return { key: 'belum', label: 'Belum mulai' };
  if (!Number.isNaN(close) && now > close) return { key: 'berakhir', label: 'Berakhir' };
  return { key: 'berlangsung', label: 'Berlangsung' };
}

/** Apakah jendela pengerjaan sedang terbuka (null = tanpa batas). */
export function isJendelaTerbuka(
  dibukaAt?: string | null,
  ditutupAt?: string | null,
  now: number = Date.now()
): boolean {
  const s = getJendelaStatus(dibukaAt, ditutupAt, now);
  return s.key === 'berlangsung' || s.key === 'terbuka';
}

/** Pesan alasan tombol Mulai/Kerjakan dinonaktifkan di luar jendela. */
export function jendelaTertutupPesan(dibukaAt?: string | null, ditutupAt?: string | null): string {
  const now = Date.now();
  const open = dibukaAt ? new Date(dibukaAt).getTime() : NaN;
  if (!Number.isNaN(open) && now < open) {
    return `Tryout dibuka pada ${formatJadwal(dibukaAt)}.`;
  }
  if (ditutupAt) {
    return `Jendela pengerjaan berakhir pada ${formatJadwal(ditutupAt)}.`;
  }
  return 'Tryout belum dapat dikerjakan saat ini.';
}

/** "2026-05-24 10:15:00" / ISO → "24 Mei 2026, 10.15". */
export function formatJadwal(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(typeof value === 'string' && value.includes(' ') && !value.includes('T')
    ? value.replace(' ', 'T')
    : value);
  if (Number.isNaN(d.getTime())) return String(value);
  return (
    d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
  );
}

/** "2026-05-24 10:15:00" / ISO → "2026-05-24T10:15" untuk input datetime-local. */
export function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';
  const normalized = typeof value === 'string' && value.includes(' ') && !value.includes('T')
    ? value.replace(' ', 'T')
    : String(value);
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-05-24T10:15" → "2026-05-24 10:15:00" untuk payload backend. */
export function fromDateTimeLocalValue(value?: string | null): string | null {
  if (!value) return null;
  const withSpace = value.replace('T', ' ');
  return withSpace.length === 16 ? `${withSpace}:00` : withSpace;
}

/** Ambil nilai string dari Select/AsyncSelect (objek {value} atau primitif). */
export function extractOptionValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object' && val !== null && 'value' in (val as Record<string, unknown>)) {
    const v = (val as { value: unknown }).value;
    return v === null || v === undefined ? '' : String(v);
  }
  return String(val);
}
