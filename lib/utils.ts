import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// cn — Utility untuk menggabungkan class Tailwind
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// formatDate — Format timestamp menjadi tanggal yang mudah dibaca
// ============================================================
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(dateString));
}

// ============================================================
// formatDateTime — Format timestamp lengkap dengan jam
// ============================================================
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// ============================================================
// formatRelativeTime — "2 menit yang lalu"
// ============================================================
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
  const diff = (new Date(dateString).getTime() - Date.now()) / 1000;

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

// ============================================================
// formatCurrency — Format angka menjadi Rupiah (Rp)
// ============================================================
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// formatRupiah — Alias untuk formatCurrency (konsisten SIKEU/SIMPEG)
// ============================================================
export const formatRupiah = formatCurrency;

// ============================================================
// truncate — Potong teks dengan ellipsis
// ============================================================
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ============================================================
// parseUserAgent — Ekstrak info device dari user-agent string
// ============================================================
export function parseUserAgent(userAgent: string): { browser: string; os: string } {
  const ua = userAgent.toLowerCase();

  let browser = 'Browser Tidak Diketahui';
  if (ua.includes('chrome')) browser = 'Google Chrome';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Microsoft Edge';

  let os = 'OS Tidak Diketahui';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, os };
}

// ============================================================
// getInitials — Ambil inisial nama untuk avatar
// ============================================================
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ============================================================
// isTokenExpired — Cek apakah token sudah kadaluarsa
// ============================================================
export function isTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

// ============================================================
// buildQueryString — Bangun query string dari object
// ============================================================
export function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

// ============================================================
// angkaTerbilang — Konversi angka ke kata terbilang formal Indonesia
// ============================================================
export function angkaTerbilang(angka: number | null | undefined): string {
  if (angka === null || angka === undefined || isNaN(angka)) return '';
  const bilangan = Math.abs(Math.floor(angka));
  if (bilangan === 0) return 'Nol Rupiah';

  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(n: number): string {
    if (n < 12) {
      return huruf[n];
    } else if (n < 20) {
      return convert(n - 10) + ' Belas';
    } else if (n < 100) {
      return convert(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + convert(n % 10) : '');
    } else if (n < 200) {
      return 'Seratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    } else if (n < 1000) {
      return convert(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    } else if (n < 2000) {
      return 'Seribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    } else if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    } else if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    } else if (n < 1000000000000) {
      return convert(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    } else if (n < 1000000000000000) {
      return convert(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 !== 0 ? ' ' + convert(n % 1000000000000) : '');
    }
    return '';
  }

  const result = convert(bilangan).trim();
  return `${result} Rupiah`;
}
