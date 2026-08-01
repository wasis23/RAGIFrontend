'use client';

import React from 'react';
import type { StatusProposal, StatusReviewer, RekomendasiReviewer, StatusPencairan, StatusVerifikasiLuaran } from '@/types/sippm.types';

interface SippmBadgeProps {
  status: StatusProposal | StatusReviewer | RekomendasiReviewer | StatusPencairan | StatusVerifikasiLuaran | string;
  type?: 'proposal' | 'reviewer' | 'rekomendasi' | 'pencairan' | 'luaran';
  showDot?: boolean;
}

export function SippmBadge({ status, type = 'proposal', showDot = true }: SippmBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      // Proposal Statuses
      case 'draft':
        return { label: 'Draft', className: 'badge badge-gray' };
      case 'submitted':
        return { label: 'Diajukan', className: 'badge badge-blue' };
      case 'under_review':
        return { label: 'Dalam Review', className: 'badge badge-indigo' };
      case 'revision':
        return { label: 'Perlu Revisi', className: 'badge badge-orange' };
      case 'approved':
        return { label: 'Disetujui', className: 'badge badge-sippm' };
      case 'rejected':
        return { label: 'Ditolak', className: 'badge badge-red' };
      case 'contracted':
        return { label: 'Kontrak Hibah', className: 'badge badge-sippm-gold' };
      case 'completed':
        return { label: 'Selesai', className: 'badge badge-green' };

      // Reviewer Statuses
      case 'assigned':
        return { label: 'Penugasan', className: 'badge badge-blue' };
      case 'in_review':
        return { label: 'Sedang Penilaian', className: 'badge badge-indigo' };
      
      // Rekomendasi Reviewer
      case 'terima':
        return { label: 'Rekomendasi Terima', className: 'badge badge-green' };
      case 'revisi':
        return { label: 'Rekomendasi Revisi', className: 'badge badge-yellow' };
      case 'tolak':
        return { label: 'Rekomendasi Tolak', className: 'badge badge-red' };

      // Pencairan Statuses
      case 'pending':
        return { label: 'Menunggu', className: 'badge badge-yellow' };
      case 'verified':
        return { label: 'Terverifikasi', className: 'badge badge-cyan' };
      case 'disbursed':
        return { label: 'Cair / Transfer', className: 'badge badge-sippm-gold' };

      // Luaran Statuses
      case 'verified':
        return { label: 'Terverifikasi', className: 'badge badge-sippm-purple' };

      default:
        return { label: status, className: 'badge badge-gray' };
    }
  };

  const { label, className } = getBadgeStyle();

  return (
    <span className={`${className} ${showDot ? 'badge-dot' : ''}`}>
      {label}
    </span>
  );
}
