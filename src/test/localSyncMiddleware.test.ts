// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createLocalStudySyncMiddleware } from '../../server/localStudySync';

function makeMockRequest(method: string, url: string, body?: string): IncomingMessage {
  const emitter = new EventEmitter() as IncomingMessage;
  emitter.method = method;
  emitter.url = url;
  if (body !== undefined) {
    queueMicrotask(() => {
      emitter.emit('data', Buffer.from(body, 'utf-8'));
      emitter.emit('end');
    });
  }
  return emitter;
}

function makeMockResponse() {
  let rawBody = '';
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = value;
    },
    end(chunk?: string) {
      if (chunk) rawBody += chunk;
    },
  } as unknown as ServerResponse;

  return {
    res,
    getJson: () => JSON.parse(rawBody),
    getStatus: () => res.statusCode,
  };
}

describe('localStudySyncMiddleware', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('persists and reads study-state.json atomically on disk', async () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'biostudio-test-'));
    tempDirs.push(tmpRoot);
    const middleware = createLocalStudySyncMiddleware(tmpRoot);

    // 1. Initially empty
    const r1 = makeMockResponse();
    await middleware(makeMockRequest('GET', '/api/study-state'), r1.res, () => {});
    expect(r1.getStatus()).toBe(200);
    expect(r1.getJson()).toEqual({ exists: false, data: null });

    // 2. PUT study state
    const payload = { version: 1, lineMastery: { 'ch08-8-1-p1-l1': 'mastered' } };
    const r2 = makeMockResponse();
    await middleware(
      makeMockRequest('PUT', '/api/study-state', JSON.stringify(payload)),
      r2.res,
      () => {},
    );
    expect(r2.getStatus()).toBe(200);
    expect(r2.getJson().ok).toBe(true);

    // 3. GET back persisted state
    const r3 = makeMockResponse();
    await middleware(makeMockRequest('GET', '/api/study-state'), r3.res, () => {});
    expect(r3.getStatus()).toBe(200);
    expect(r3.getJson()).toEqual({ exists: true, data: payload });
  });
});
