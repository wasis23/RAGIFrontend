'use client';

import React from 'react';

interface DateTextProps {
  dateString?: string | null;
  format?: 'short' | 'long';
  className?: string;
}

export const formatDate = (rawDate?: string | null, format: 'short' | 'long' = 'short'): string => {
  if (!rawDate) return '-';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return rawDate; // Fallback string if invalid date object

    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsLong = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const day = d.getDate();
    const monthIndex = d.getMonth();
    const year = d.getFullYear();

    if (format === 'short') {
      return `${day} ${monthsShort[monthIndex]} ${year}`;
    }
    return `${day} ${monthsLong[monthIndex]} ${year}`;
  } catch {
    return rawDate || '-';
  }
};

export const DateText: React.FC<DateTextProps> = ({ dateString, format = 'short', className = '' }) => {
  const formatted = formatDate(dateString, format);
  return <span className={`text-slate-600 font-medium ${className}`}>{formatted}</span>;
};
