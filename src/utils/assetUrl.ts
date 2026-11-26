/**
 * Resolves a public/ asset path against Vite's configured BASE_URL
 * so assets work identically on localhost ('/') and GitHub Pages ('/bio-app/').
 */
export function resolveAssetUrl(assetPath: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = assetPath.replace(/^\/+/, '');
  return `${cleanBase}${cleanPath}`;
}

export function isLocalDevOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}
