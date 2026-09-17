import React from 'react';

/**
 * Normalizes hex color string to 6-character format without hash.
 */
function normalizeHex(hex: string): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return cleanHex.slice(0, 6);
}

/**
 * Converts a hex color to RGB tuple.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = normalizeHex(hex);
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 37, g: 99, b: 235 }; // Default fallback: #2563eb
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts a hex color to RGBA CSS string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darkens a hex color by a percentage (0.0 to 1.0).
 */
export function darkenHex(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - Math.max(0, Math.min(1, percent));
  const newR = Math.max(0, Math.min(255, Math.round(r * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b * factor)));

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

/**
 * Lightens a hex color by a percentage (0.0 to 1.0).
 */
export function lightenHex(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.max(0, Math.min(1, percent));
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

/**
 * Calculates accessible text contrast color (WCAG 2.0 relative luminance).
 * Returns '#ffffff' for dark backgrounds and '#0f172a' (slate-900) for bright backgrounds.
 */
export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  // Perceived relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0f172a' : '#ffffff';
}

/**
 * Generates dynamic CSS variables style object for the current active module.
 */
export function generateModuleThemeStyles(primaryHex?: string | null): React.CSSProperties {
  const primary = primaryHex && /^#[0-9A-Fa-f]{3,8}$/.test(primaryHex) ? primaryHex : '#2563eb';
  const hover = darkenHex(primary, 0.12);
  const active = darkenHex(primary, 0.2);
  const light = lightenHex(primary, 0.35);
  const textColor = getContrastTextColor(primary);
  const subtle = hexToRgba(primary, 0.14);
  const subtle50 = hexToRgba(primary, 0.08);
  const subtle100 = hexToRgba(primary, 0.15);
  const subtle200 = hexToRgba(primary, 0.25);
  const shadow = hexToRgba(primary, 0.25);

  return {
    '--module-primary': primary,
    '--module-primary-hover': hover,
    '--module-primary-active': active,
    '--module-primary-light': light,
    '--module-primary-subtle': subtle,
    '--module-primary-shadow': shadow,
    '--module-primary-text': textColor,
    '--btn-primary-bg': primary,
    '--btn-primary-hover': hover,
    '--btn-primary-shadow': shadow,
    '--primary-50': subtle50,
    '--primary-100': subtle100,
    '--primary-200': subtle200,
    '--primary-300': light,
    '--primary-400': lightenHex(primary, 0.2),
    '--primary-500': primary,
    '--primary-600': primary,
    '--primary-700': hover,
    '--primary-800': active,
    '--color-primary-50': subtle50,
    '--color-primary-100': subtle100,
    '--color-primary-200': subtle200,
    '--color-primary-300': light,
    '--color-primary-400': lightenHex(primary, 0.2),
    '--color-primary-500': primary,
    '--color-primary-600': primary,
    '--color-primary-700': hover,
  } as React.CSSProperties;
}
