'use client';

import { useSyncExternalStore } from 'react';
import { resolveDomainContext, DomainContext } from '@/lib/domain';

// ============================================================
// useDomain — baca konteks tenant (subdomain -> modul) saat ini.
// Menggunakan useSyncExternalStore agar aman SSR (server snapshot
// = default) dan stabil di client tanpa hydration mismatch.
// ============================================================

const SERVER_DEFAULT: DomainContext = resolveDomainContext('');

let cached: DomainContext | null = null;

function getSnapshot(): DomainContext {
  if (cached) return cached;
  cached = resolveDomainContext(window.location.hostname);
  return cached;
}

function getServerSnapshot(): DomainContext {
  return SERVER_DEFAULT;
}

function subscribe(): () => void {
  // hostname tidak berubah selama sesi -> tidak ada event yang disubscribe.
  return () => {};
}

export function useDomain(): DomainContext {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
