import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

function readJsonFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function createLocalStudySyncMiddleware(rootDir: string) {
  const userDataDir = path.resolve(rootDir, 'user-data');
  const studyFile = path.join(userDataDir, 'study-state.json');
  const configFile = path.join(userDataDir, 'local-config.json');

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const urlPath = (req.url || '').split('?')[0];

    if (urlPath === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, diskSync: true });
      return;
    }

    if (urlPath === '/api/study-state') {
      if (req.method === 'GET') {
        const raw = readJsonFile(studyFile);
        if (!raw) {
          sendJson(res, 200, { exists: false, data: null });
          return;
        }
        try {
          sendJson(res, 200, { exists: true, data: JSON.parse(raw) });
        } catch {
          sendJson(res, 500, { error: 'Corrupt study-state.json on disk' });
        }
        return;
      }

      if (req.method === 'PUT') {
        try {
          const body = await readRequestBody(req);
          if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
          }
          JSON.parse(body);
          const tmp = `${studyFile}.${Date.now()}.tmp`;
          fs.writeFileSync(tmp, body, 'utf-8');
          fs.renameSync(tmp, studyFile);
          sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
        } catch (err) {
          sendJson(res, 400, {
            error: err instanceof Error ? err.message : 'Failed to save study state',
          });
        }
        return;
      }
    }

    if (urlPath === '/api/local-config') {
      if (req.method === 'GET') {
        const raw = readJsonFile(configFile);
        const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        const parsed = raw ? JSON.parse(raw) : {};
        sendJson(res, 200, {
          exists: Boolean(raw),
          data: {
            ...parsed,
            apiKey: parsed.apiKey || envKey,
          },
        });
        return;
      }

      if (req.method === 'PUT') {
        try {
          const body = await readRequestBody(req);
          if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
          }
          JSON.parse(body);
          const tmp = `${configFile}.${Date.now()}.tmp`;
          fs.writeFileSync(tmp, body, 'utf-8');
          fs.renameSync(tmp, configFile);
          sendJson(res, 200, { ok: true });
        } catch (err) {
          sendJson(res, 400, {
            error: err instanceof Error ? err.message : 'Failed to save local config',
          });
        }
        return;
      }
    }

    if (urlPath.startsWith('/api/chapter-pdf/') && req.method === 'GET') {
      const requestedName = decodeURIComponent(urlPath.replace('/api/chapter-pdf/', ''));
      const safeName = path.basename(requestedName);
      if (!safeName.toLowerCase().endsWith('.pdf')) {
        sendJson(res, 400, { error: 'Only PDF files are served from this endpoint' });
        return;
      }
      const pdfPath = path.resolve(rootDir, safeName);
      if (!pdfPath.startsWith(path.resolve(rootDir)) || !fs.existsSync(pdfPath)) {
        sendJson(res, 404, { error: 'PDF not found' });
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      fs.createReadStream(pdfPath).pipe(res);
      return;
    }

    next();
  };
}
