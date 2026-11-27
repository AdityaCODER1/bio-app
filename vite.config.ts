import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createLocalStudySyncMiddleware } from './server/localStudySync';

function localStudySyncPlugin(): Plugin {
  const middleware = createLocalStudySyncMiddleware(__dirname);
  return {
    name: 'local-study-sync',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

function walkRelativeFiles(rootDir: string, prefix = ''): string[] {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkRelativeFiles(full, rel));
    } else if (entry.isFile()) {
      results.push(rel);
    }
  }
  return results.sort();
}

function pwaBuildPlugin(): Plugin {
  let outDir = path.resolve(__dirname, 'dist');
  let baseUrl = '/';

  return {
    name: 'biostudio-pwa-manifest',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      baseUrl = config.base.endsWith('/') ? config.base : `${config.base}/`;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqPath = (req.url || '').split('?')[0];
        if (reqPath === `${baseUrl}offline-media.json` || reqPath === '/offline-media.json') {
          const publicDir = path.resolve(__dirname, 'public');
          const files = [
            ...walkRelativeFiles(path.join(publicDir, 'diagrams'), 'diagrams'),
            ...walkRelativeFiles(path.join(publicDir, 'pdf-pages'), 'pdf-pages'),
          ];
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files }));
          return;
        }
        next();
      });
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;

      const allFiles = walkRelativeFiles(outDir);
      const mediaFiles: string[] = [];
      const shellFiles: string[] = ['./'];

      for (const rel of allFiles) {
        if (rel === 'sw.js' || rel === 'offline-media.json') continue;
        if (rel.startsWith('diagrams/') || rel.startsWith('pdf-pages/')) {
          mediaFiles.push(rel);
        } else if (rel.endsWith('.woff') || rel.endsWith('.ttf')) {
          // Modern browsers use .woff2 (precached); legacy font formats are runtime-cached on demand
          continue;
        } else {
          shellFiles.push(`./${rel}`);
        }
      }

      // Deterministic cache version hash based on shell file names & contents
      const hash = crypto.createHash('sha256');
      for (const rel of allFiles) {
        if (rel === 'sw.js' || rel === 'offline-media.json') continue;
        if (rel.startsWith('diagrams/') || rel.startsWith('pdf-pages/')) continue;
        hash.update(rel);
        hash.update(fs.readFileSync(path.join(outDir, rel)));
      }
      const cacheVersion = hash.digest('hex').slice(0, 12);

      // Write offline media list for optional full-media offline download in Settings
      fs.writeFileSync(
        path.join(outDir, 'offline-media.json'),
        JSON.stringify({ version: cacheVersion, files: mediaFiles }, null, 2),
        'utf-8',
      );
      shellFiles.push('./offline-media.json');

      const swTemplate = fs.readFileSync(swPath, 'utf-8');
      const swFinal = swTemplate
        .replace("'__PWA_CACHE_VERSION__'", JSON.stringify(cacheVersion))
        .replace('/*__PWA_PRECACHE_URLS__*/ []', JSON.stringify(shellFiles));

      fs.writeFileSync(swPath, swFinal, 'utf-8');
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/bio-app/' : '/'),
  plugins: [react(), localStudySyncPlugin(), pwaBuildPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
