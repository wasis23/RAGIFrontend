'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger
    ? 'bg-rose-50 text-rose-600 border border-rose-100'
    : isWarning
    ? 'bg-amber-50 text-amber-600 border border-amber-100'
    : 'bg-primary-50 text-primary-600 border border-primary-100';

  const IconComponent = isDanger ? Trash2 : isWarning ? AlertTriangle : HelpCircle;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlay={!isLoading}
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}>
          <IconComponent size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">
          {title}
        </h3>
        <div className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
          {message}
        </div>
        <div className="flex items-center justify-end gap-3 w-full pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="md"
            className="flex-1 sm:flex-initial"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            size="md"
            className="flex-1 sm:flex-initial"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
