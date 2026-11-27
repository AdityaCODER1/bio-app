import { useCallback, useEffect, useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUrl';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type PwaPlatformHint = 'android' | 'ios' | 'chromium' | 'other';

export interface OfflineMediaProgress {
  cached: number;
  total: number;
  failed: number;
}

const MEDIA_CACHE_NAME = 'biostudio-media-v1';

interface PwaSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  swReady: boolean;
}

let listenersAttached = false;
let snapshot: PwaSnapshot = {
  deferredPrompt: null,
  isStandalone: false,
  swReady: false,
};

const subscribers = new Set<() => void>();

function notify() {
  for (const fn of subscribers) fn();
}

export function detectStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const mqStandalone =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches);
  const iosStandalone = nav.standalone === true;
  const androidAppReferrer =
    typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  return mqStandalone || iosStandalone || androidAppReferrer;
}

export function detectPlatformHint(): PwaPlatformHint {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Chrome|Chromium|Edg\//i.test(ua)) return 'chromium';
  return 'other';
}

export function initPwaListeners(): void {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  snapshot = {
    ...snapshot,
    isStandalone: detectStandaloneMode(),
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    snapshot = {
      ...snapshot,
      deferredPrompt: event as BeforeInstallPromptEvent,
      isStandalone: detectStandaloneMode(),
    };
    notify();
  });

  window.addEventListener('appinstalled', () => {
    snapshot = {
      ...snapshot,
      deferredPrompt: null,
      isStandalone: true,
    };
    notify();
  });

  if (typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(display-mode: standalone)');
    const onDisplayChange = () => {
      snapshot = {
        ...snapshot,
        isStandalone: detectStandaloneMode(),
      };
      notify();
    };
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onDisplayChange);
    }
  }
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (import.meta.env.MODE === 'test') return;

  const register = () => {
    const swUrl = resolveAssetUrl('sw.js');
    const scope = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker
      .register(swUrl, { scope })
      .then(() => {
        snapshot = { ...snapshot, swReady: true };
        notify();
      })
      .catch(() => {
        // Ignore SW registration failure on unsupported/restricted origins
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

export function usePwaInstall() {
  initPwaListeners();

  const [, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((t) => t + 1);
    subscribers.add(onUpdate);
    return () => {
      subscribers.delete(onUpdate);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = snapshot.deferredPrompt;
    if (!promptEvent) return 'unavailable';
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      snapshot = {
        ...snapshot,
        deferredPrompt: null,
        isStandalone: choice.outcome === 'accepted' ? true : detectStandaloneMode(),
      };
      notify();
      return choice.outcome;
    } catch {
      snapshot = { ...snapshot, deferredPrompt: null };
      notify();
      return 'dismissed';
    }
  }, []);

  return {
    canInstall: Boolean(snapshot.deferredPrompt) && !snapshot.isStandalone,
    isStandalone: snapshot.isStandalone,
    swReady: snapshot.swReady,
    platformHint: detectPlatformHint(),
    promptInstall,
  };
}

export async function getOfflineMediaStatus(): Promise<{
  supported: boolean;
  cached: number;
  total: number;
}> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { supported: false, cached: 0, total: 0 };
  }

  try {
    const res = await fetch(resolveAssetUrl('offline-media.json'), { cache: 'no-cache' });
    if (!res.ok) return { supported: true, cached: 0, total: 0 };
    const data = (await res.json()) as { files?: string[] };
    const files = Array.isArray(data.files) ? data.files : [];
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const keys = await cache.keys();
    const cachedUrlSet = new Set(keys.map((req) => req.url));

    let cachedCount = 0;
    for (const rel of files) {
      const fullUrl = new URL(resolveAssetUrl(rel), window.location.origin).toString();
      if (cachedUrlSet.has(fullUrl)) cachedCount++;
    }
    return { supported: true, cached: cachedCount, total: files.length };
  } catch {
    return { supported: true, cached: 0, total: 0 };
  }
}

export async function downloadAllOfflineMedia(
  onProgress?: (progress: OfflineMediaProgress) => void,
): Promise<OfflineMediaProgress> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cached: 0, total: 0, failed: 0 };
  }

  const res = await fetch(resolveAssetUrl('offline-media.json'), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error('Offline media list unavailable.');
  }
  const data = (await res.json()) as { files?: string[] };
  const files = Array.isArray(data.files) ? data.files : [];
  const total = files.length;

  const cache = await caches.open(MEDIA_CACHE_NAME);
  const existingKeys = new Set((await cache.keys()).map((req) => req.url));

  let cached = 0;
  let failed = 0;
  const toFetch: string[] = [];

  for (const rel of files) {
    const fullUrl = new URL(resolveAssetUrl(rel), window.location.origin).toString();
    if (existingKeys.has(fullUrl)) {
      cached++;
    } else {
      toFetch.push(fullUrl);
    }
  }

  onProgress?.({ cached, total, failed });

  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < toFetch.length) {
      const idx = cursor++;
      const url = toFetch[idx];
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          await cache.put(url, resp);
          cached++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      onProgress?.({ cached, total, failed });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(1, toFetch.length)) }, () => worker()),
  );

  return { cached, total, failed };
}

/** @internal Used by unit tests to reset module-level PWA prompt state between cases */
export function _resetPwaStateForTests(): void {
  snapshot = {
    deferredPrompt: null,
    isStandalone: detectStandaloneMode(),
    swReady: false,
  };
  notify();
}
