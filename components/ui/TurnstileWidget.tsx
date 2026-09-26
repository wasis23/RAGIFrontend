'use client';

import Script from 'next/script';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

// ============================================================
// TURNSTILE WIDGET — Cloudflare Turnstile (explicit render)
//
// - Hanya render bila NEXT_PUBLIC_TURNSTILE_SITE_KEY di-set.
//   Jika tidak di-set (mis. dev tanpa kunci), komponen tidak
//   menampilkan apa pun dan tidak memblokir form.
// - Token dikirim ke backend lewat payload `captcha_token`;
//   verifikasi dilakukan di server (siteverify).
// ============================================================

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: 'light' | 'dark' | 'auto';
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  action: string;
  onVerify: (token: string) => void;
  className?: string;
}

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ action, onVerify, className }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(() => {
      if (!siteKey || !containerRef.current || widgetIdRef.current !== null) return;
      if (!window.turnstile) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (token: string) => onVerify(token),
        'error-callback': () => onVerify(''),
        'expired-callback': () => onVerify(''),
      });
    }, [siteKey, action, onVerify]);

    // Jika script sudah dimuat sebelumnya (navigasi client), render langsung.
    useEffect(() => {
      renderWidget();
    }, [renderWidget]);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          onVerify('');
          if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
      }),
      [onVerify],
    );

    if (!siteKey) return null;

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderWidget}
        />
        <div ref={containerRef} className={className} />
      </>
    );
  },
);
