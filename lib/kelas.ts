/**
 * Aturan format KELAS mahasiswa: 2 digit belakang tahun angkatan + huruf kelas.
 * Contoh: angkatan 2025 kelas A → "25A"; angkatan 2024 kelas B → "24B".
 */

/** Pola valid: 2 digit + 1–3 huruf kapital (cth: 25A, 25AB). */
export const KELAS_PATTERN = /^[0-9]{2}[A-Z]{1,3}$/;

/** Ambil 2 digit belakang tahun angkatan (2025 → "25"). */
export const kelasPrefix = (angkatan: number | string): string =>
  String(angkatan ?? '').replace(/\D/g, '').slice(-2);

/**
 * Saran nilai kelas saat angkatan berubah:
 * - kosong / baru prefix → ganti prefix baru
 * - format valid (25A) → pertahankan huruf, ganti prefix (25A → 24A)
 * - format lain → jangan diutak-atik
 */
export function suggestKelas(prevKelas: string, angkatan: number | string): string {
  const prefix = kelasPrefix(angkatan);
  const cur = (prevKelas || '').toUpperCase();
  if (!cur || /^[0-9]{2}$/.test(cur)) return prefix;
  if (KELAS_PATTERN.test(cur)) return prefix + cur.slice(2);
  return cur;
}

/** True bila kosong (opsional) atau sesuai format. */
export const isKelasValid = (v: string): boolean => {
  const cur = (v || '').toUpperCase();
  return cur === '' || KELAS_PATTERN.test(cur);
};

/**
 * Konversi nilai dropdown periode menjadi id numerik untuk query API.
 * Mengembalikan undefined bila kosong / bukan angka valid — sehingga nilai
 * korup (cth "[object Object]") tidak pernah terkirim sebagai filter.
 */
export const toTahunAkademikId = (v: string | number | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
