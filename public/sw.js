/* BioStudio PWA Service Worker — App Shell Precache + Runtime Media Cache */

const CACHE_VERSION = '__PWA_CACHE_VERSION__';
const PRECACHE_URLS = /*__PWA_PRECACHE_URLS__*/ [];

const SHELL_CACHE = `biostudio-shell-${CACHE_VERSION}`;
const MEDIA_CACHE = 'biostudio-media-v1';

const IS_PRODUCTION_BUILD = Array.isArray(PRECACHE_URLS) && PRECACHE_URLS.length > 0;

function toScopedUrl(relativePath) {
  return new URL(relativePath, self.registration.scope).toString();
}

self.addEventListener('install', (event) => {
  if (!IS_PRODUCTION_BUILD) {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (cache) => {
        const urls = PRECACHE_URLS.map(toScopedUrl);
        try {
          await cache.addAll(urls);
        } catch {
          await Promise.allSettled(urls.map((u) => cache.add(u)));
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('biostudio-shell-') && k !== SHELL_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (!IS_PRODUCTION_BUILD) return;

  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept local dev sync API or live Gemini API requests
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname === 'generativelanguage.googleapis.com'
  ) {
    return;
  }

  // SPA navigation: network-first with cached index.html fallback for full offline launch
  if (request.mode === 'navigate') {
    const indexUrl = toScopedUrl('./index.html');
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(indexUrl, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(indexUrl);
          if (cached) return cached;
          return (await caches.match(toScopedUrl('./'))) || Response.error();
        }),
    );
    return;
  }

  // Google Fonts: cache-first in MEDIA_CACHE
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response && (response.ok || response.type === 'opaque')) {
                const copy = response.clone();
                caches.open(MEDIA_CACHE).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => Response.error()),
      ),
    );
    return;
  }

  // Same-origin static assets & diagrams / PDF pages: cache-first with runtime population
  if (url.origin === self.location.origin && url.href.startsWith(self.registration.scope)) {
    const relPath = url.href.slice(self.registration.scope.length);
    const isMediaAsset = relPath.startsWith('diagrams/') || relPath.startsWith('pdf-pages/');
    const targetCacheName = isMediaAsset ? MEDIA_CACHE : SHELL_CACHE;

    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              const copy = response.clone();
              caches.open(targetCacheName).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => Response.error());
      }),
    );
  }
});
