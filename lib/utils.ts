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
  const cleanStr = String(dateString).trim();
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(cleanStr)
    ? new Date(`${cleanStr}T00:00:00`)
    : new Date(cleanStr);
  if (isNaN(parsedDate.getTime())) return cleanStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(parsedDate);
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
// formatGelombangLabel — Label dropdown gelombang SPMB
// (nama + jalur + tahun akademik + status)
// ============================================================
export function formatGelombangLabel(g: {
  nama: string;
  status?: string;
  jalur_masuk?: { nama?: string } | null;
  tahun_akademik?: { nama?: string } | null;
}): string {
  const jalur = g.jalur_masuk?.nama ? ` — ${g.jalur_masuk.nama}` : '';
  const ta = g.tahun_akademik?.nama ? ` / ${g.tahun_akademik.nama}` : '';
  const status = g.status ? ` (${g.status})` : '';
  return `${g.nama}${jalur}${ta}${status}`;
}

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

// ============================================================
// getStorageFileUrl — Mengembalikan URL file storage publik Backend
// ============================================================
export function getStorageFileUrl(path: string | null | undefined): string {
  if (!path) return '#';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.replace('http://localhost/storage', 'http://localhost:8000/storage')
               .replace('http://127.0.0.1/storage', 'http://127.0.0.1:8000/storage');
  }

  const backendOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api')
    .replace(/\/api\/?$/, '');

  const cleanPath = path.replace(/^\/?(storage\/)?/, '');
  return `${backendOrigin}/storage/${cleanPath}`;
}

// ============================================================
// getApiErrorMessage — Ekstrak pesan error spesifik dari response API
// ============================================================
export function getApiErrorMessage(err: any, fallbackMessage = 'Terjadi kesalahan pada server'): string {
  if (!err) return fallbackMessage;

  // Jika response memiliki errors object dari validasi Laravel (HTTP 422)
  const validationErrors = err.response?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const firstKey = Object.keys(validationErrors)[0];
    if (firstKey) {
      const messages = validationErrors[firstKey];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
      if (typeof messages === 'string') {
        return messages;
      }
    }
  }

  // Jika ada detail message (mis. dari microservice / exception handler)
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && detail.message) return detail.message;

  // Pesan utama
  const message = err.response?.data?.message;
  if (message && typeof message === 'string' && message.trim() !== '' && message !== 'Data yang diberikan tidak valid.') {
    return message;
  }

  return message || err.message || fallbackMessage;
}

