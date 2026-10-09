'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useUiStore } from '@/store/uiStore';
import {
  clampSidebarWidth,
  sidebarWidthDefaultPx,
  sidebarWidthMinPx,
  sidebarWidthMaxPx,
  sidebarWidthStepPx,
} from '@/lib/sidebar';

/**
 * Handle geser untuk mengubah lebar sidebar.
 *
 * Mendukung tiga cara agar bisa dipakai semua perangkat:
 * - Drag pointer (mouse & sentuh): `pointerdown` lalu `pointermove`.
 * - Keyboard: panah kiri/kanan mengubah lebar, `Home`/`End` ke batas minimum
 *   atau maksimum, `Enter`/`Spasi` mengembalikan ke lebar default. Wajib untuk
 *   aksesibilitas, bukan sekadar tambahan.
 * - Double click: mengembalikan ke lebar default.
 *
 * Lebar disimpan di uiStore (zustand persist) sehingga pilihan user bertahan
 * setelah reload dan tidak perlu backend.
 */
export function SidebarResizer() {
  const width = useUiStore((s) => s.sidebar_width);
  const setWidth = useUiStore((s) => s.setSidebarWidth);
  const resetWidth = useUiStore((s) => s.resetSidebarWidth);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Hanya tombol mouse utama agar klik konteks tetap bisa dipakai.
    if (e.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add('sidebar-resizing');
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setWidth(clampSidebarWidth(startWidthRef.current + (e.clientX - startXRef.current)));
  };

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    document.body.classList.remove('sidebar-resizing');
  }, []);

  // Jaring pengaman: pointerup di luar elemen tetap harus membersihkan state,
  // sehingga kursor tidak tertahan `col-resize` dan user-select tidak terkunci.
  useEffect(() => {
    const stop = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.classList.remove('sidebar-resizing');
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
      document.body.classList.remove('sidebar-resizing');
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = sidebarWidthStepPx();

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setWidth(width - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setWidth(width + step);
        break;
      case 'Home':
        e.preventDefault();
        setWidth(sidebarWidthMinPx());
        break;
      case 'End':
        e.preventDefault();
        setWidth(sidebarWidthMaxPx());
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        resetWidth();
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ubah lebar sidebar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={Math.round(sidebarWidthMinPx())}
      aria-valuemax={Math.round(sidebarWidthMaxPx())}
      tabIndex={0}
      className="sidebar-resizer"
      title={`Geser untuk mengubah lebar sidebar, klik ganda untuk kembali ke lebar ${Math.round(sidebarWidthDefaultPx())}px`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={() => resetWidth()}
    />
  );
}