/**
 * Konfigurasi lebar sidebar yang dapat digeser user.
 *
 * Nilai dinyatakan dalam `rem`, bukan pixel, agar ikut menyesuaikan ukuran font
 * browser (zoom + setelan aksesibilitas). Lebar tersimpan dalam pixel karena
 * delta drag dari pointer memang diukur dalam pixel.
 */
export const SIDEBAR_WIDTH_DEFAULT_REM = 21; // 336px: rail 72px + panel ~264px (two-level, muat nama menu panjang)
export const SIDEBAR_WIDTH_MIN_REM = 18; // 288px — panel ~216px, tetap muat kebanyakan nama menu
export const SIDEBAR_WIDTH_MAX_REM = 26; // 416px — cukup untuk nama menu terpanjang
export const SIDEBAR_WIDTH_STEP_REM = 0.5; // increment panah keyboard

/** Ukuran font root saat ini, dipakai untuk mengonversi rem ke pixel. */
export function rootFontSize(): number {
  if (typeof window === 'undefined') return 16;
  const size = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 16;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Batasi lebar ke rentang yang aman. Nilai tidak valid (NaN, 0, atau data rusak
 * dari localStorage) dikembalikan ke lebar default.
 */
export function clampSidebarWidth(px: number): number {
  if (!Number.isFinite(px) || px <= 0) {
    return SIDEBAR_WIDTH_DEFAULT_REM * rootFontSize();
  }
  const root = rootFontSize();
  return Math.round(clamp(px, SIDEBAR_WIDTH_MIN_REM * root, SIDEBAR_WIDTH_MAX_REM * root));
}

/** Konversi konstanta rem ke pixel berdasarkan font root saat ini. */
export function sidebarWidthDefaultPx(): number {
  return SIDEBAR_WIDTH_DEFAULT_REM * rootFontSize();
}

export function sidebarWidthMinPx(): number {
  return SIDEBAR_WIDTH_MIN_REM * rootFontSize();
}

export function sidebarWidthMaxPx(): number {
  return SIDEBAR_WIDTH_MAX_REM * rootFontSize();
}

export function sidebarWidthStepPx(): number {
  return SIDEBAR_WIDTH_STEP_REM * rootFontSize();
}