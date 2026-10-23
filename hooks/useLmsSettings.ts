'use client';

import { useEffect, useState } from 'react';
import { lmsService } from '@/services/lms.service';
import type { LmsPublicSettings } from '@/types/lms.types';

/**
 * Hook pengaturan publik LMS (`GET /lms/public/settings`, cache 24 jam).
 *
 * Dipakai untuk knowledge non-sensitif di UI (batas upload, feature flag).
 * Kegagalan fetch bersifat fail-safe: UI tetap berjalan dengan default lokal.
 */
export function useLmsSettings() {
  const [settings, setSettings] = useState<LmsPublicSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    lmsService
      .getPublicSettings()
      .then((res) => {
        if (active) setSettings(res.data ?? null);
      })
      .catch(() => {
        if (active) setSettings(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    settings,
    isLoading,
    /**
     * Default `true` bila pengaturan belum termuat (sama dengan default backend):
     * fitur presensi dianggap aktif sampai server menyatakan sebaliknya.
     */
    fiturPresensi: settings?.lms_fitur_presensi !== false,
    maxSoalImport: Number(settings?.lms_max_soal_import ?? 500),
    uploadMaxSizeMb: Number(settings?.lms_upload_max_size_mb ?? 100),
    videoMaxSizeMb: Number(settings?.lms_video_max_size_mb ?? 500),
  };
}
