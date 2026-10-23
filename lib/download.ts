/**
 * Utilitas unduh berkas (Blob) dari response API.
 *
 * Backend endpoint export LMS memakai `Content-Disposition: attachment;
 * filename=<nama>`, sehingga nama berkas final dibaca dari header tersebut
 * (bukan ditebak di frontend).
 */

/**
 * Ambil nama berkas dari header `Content-Disposition`.
 *
 * Menangani dua varian: `filename="x.csv"` dan `filename*=UTF-8''x.csv`.
 */
export function parseContentDispositionFilename(header?: string | null): string | null {
  if (!header) return null;

  const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encoded) {
    const value = decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''));
    if (value) return value;
  }

  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  if (plain) {
    const value = plain[1].trim();
    if (value) return value;
  }

  return null;
}

/**
 * Jalankan unduhan blob di browser.
 */
export function downloadBlobFile(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

/**
 * Ambil pesan error dari body JSON API yang disimpan sebagai Blob.
 *
 * Saat request `responseType: 'blob'` ditolak backend, axios tetap
 * mengembalikan Blob berisi JSON — bukan objek biasa — sehingga pesan
 * error harus dibaca manual.
 */
export async function readApiErrorFromBlob(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    if (parsed?.errors && typeof parsed.errors === 'object') {
      const first = Object.values(parsed.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length) return String(first[0]);
    }
    if (parsed?.message) return String(parsed.message);
    return null;
  } catch {
    return null;
  }
}

/**
 * Bangun objek export dari response blob + header `Content-Disposition`.
 *
 * Melempar error dengan pesan API bila backend membalas JSON (mis. 403/422).
 */
export async function buildExportFile(
  blob: Blob,
  contentDisposition: string | undefined,
  fallbackFilename: string
): Promise<{ blob: Blob; filename: string }> {
  const contentType = (blob?.type || '').toLowerCase();

  if (contentType.includes('application/json')) {
    const message = await readApiErrorFromBlob(blob);
    throw new Error(message || 'Gagal mengunduh laporan.');
  }

  const filename = parseContentDispositionFilename(contentDisposition) || fallbackFilename;

  return { blob, filename };
}
