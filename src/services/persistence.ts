import type { LocalAppConfig, StudyState } from '../types/study';
import { isLocalDevOrigin } from '../utils/assetUrl';

const IDB_NAME = 'ncert-biostudio-db';
const IDB_VERSION = 1;
const STORE_NAME = 'kv';
const STUDY_KEY = 'study-state';
const CONFIG_KEY = 'local-config';

let persistenceRequested = false;

async function ensurePersistentStorage(): Promise<void> {
  if (persistenceRequested) return;
  persistenceRequested = true;
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Ignore if browser does not support persistent storage API
  }
}

export function createEmptyStudyState(): StudyState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    lineMastery: {},
    lineHighlights: {},
    customLines: {},
    lineNotes: {},
    pinnedMcqs: {},
    diagramMastery: {},
    diagramExtraInfo: {},
    vaultMastery: {},
    customVaultItems: {},
    editedVaultItems: {},
    deletedVaultIds: [],
    aiThreads: {},
  };
}

export function normalizeStudyState(raw?: Partial<StudyState> | null): StudyState {
  const base = createEmptyStudyState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    lineMastery: raw.lineMastery && typeof raw.lineMastery === 'object' ? raw.lineMastery : {},
    lineHighlights:
      raw.lineHighlights && typeof raw.lineHighlights === 'object' ? raw.lineHighlights : {},
    customLines: raw.customLines && typeof raw.customLines === 'object' ? raw.customLines : {},
    lineNotes: raw.lineNotes && typeof raw.lineNotes === 'object' ? raw.lineNotes : {},
    pinnedMcqs: raw.pinnedMcqs && typeof raw.pinnedMcqs === 'object' ? raw.pinnedMcqs : {},
    diagramMastery:
      raw.diagramMastery && typeof raw.diagramMastery === 'object' ? raw.diagramMastery : {},
    diagramExtraInfo:
      raw.diagramExtraInfo && typeof raw.diagramExtraInfo === 'object' ? raw.diagramExtraInfo : {},
    vaultMastery:
      raw.vaultMastery && typeof raw.vaultMastery === 'object' ? raw.vaultMastery : {},
    customVaultItems:
      raw.customVaultItems && typeof raw.customVaultItems === 'object' ? raw.customVaultItems : {},
    editedVaultItems:
      raw.editedVaultItems && typeof raw.editedVaultItems === 'object' ? raw.editedVaultItems : {},
    deletedVaultIds: Array.isArray(raw.deletedVaultIds) ? raw.deletedVaultIds : [],
    aiThreads: raw.aiThreads && typeof raw.aiThreads === 'object' ? raw.aiThreads : {},
  };
}

export function createDefaultConfig(): LocalAppConfig {
  return {
    apiKey: '',
    selectedModel: 'gemini-3.5-flash',
    customModelId: '',
    useCustomModel: false,
    readerFont: 'serif',
    fontSize: 'comfortable',
    clozeMode: false,
    clozeScope: 'all',
    showOnlyUnmastered: false,
    showPdfDarkFilter: false,
  };
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export interface LoadStudyResult {
  state: StudyState;
  source: 'disk' | 'indexeddb' | 'fresh';
  diskSyncAvailable: boolean;
}

export async function loadStudyState(): Promise<LoadStudyResult> {
  void ensurePersistentStorage();

  let diskState: StudyState | null = null;
  let diskSyncAvailable = false;

  if (isLocalDevOrigin()) {
    try {
      const res = await fetch('/api/study-state', { cache: 'no-store' });
      if (res.ok) {
        diskSyncAvailable = true;
        const json = (await res.json()) as { exists?: boolean; data?: StudyState | null };
        if (json.exists && json.data) {
          diskState = json.data;
        }
      }
    } catch {
      diskSyncAvailable = false;
    }
  }

  const idbState = await idbGet<StudyState>(STUDY_KEY);

  if (diskState && idbState) {
    const diskTime = Date.parse(diskState.updatedAt || '') || 0;
    const idbTime = Date.parse(idbState.updatedAt || '') || 0;
    if (idbTime > diskTime) {
      return {
        state: normalizeStudyState(idbState),
        source: 'indexeddb',
        diskSyncAvailable,
      };
    }
    return {
      state: normalizeStudyState(diskState),
      source: 'disk',
      diskSyncAvailable,
    };
  }

  if (diskState) {
    return {
      state: normalizeStudyState(diskState),
      source: 'disk',
      diskSyncAvailable,
    };
  }

  if (idbState) {
    return {
      state: normalizeStudyState(idbState),
      source: 'indexeddb',
      diskSyncAvailable,
    };
  }

  return {
    state: createEmptyStudyState(),
    source: 'fresh',
    diskSyncAvailable,
  };
}

export async function persistStudyState(
  state: StudyState,
): Promise<{ diskSaved: boolean; savedAt: string }> {
  const stamped: StudyState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };

  await idbSet(STUDY_KEY, stamped);

  if (isLocalDevOrigin()) {
    try {
      const res = await fetch('/api/study-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stamped, null, 2),
      });
      if (res.ok) {
        return { diskSaved: true, savedAt: stamped.updatedAt };
      }
    } catch {
      // Fallback to IndexedDB only
    }
  }

  return { diskSaved: false, savedAt: stamped.updatedAt };
}

export async function loadLocalConfig(): Promise<LocalAppConfig> {
  const defaults = createDefaultConfig();
  let diskConfig: Partial<LocalAppConfig> | null = null;

  if (isLocalDevOrigin()) {
    try {
      const res = await fetch('/api/local-config', { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as { data?: Partial<LocalAppConfig> };
        if (json.data) {
          diskConfig = json.data;
        }
      }
    } catch {
      // ignore
    }
  }

  const idbConfig = await idbGet<Partial<LocalAppConfig>>(CONFIG_KEY);
  return {
    ...defaults,
    ...(idbConfig ?? {}),
    ...(diskConfig ?? {}),
    apiKey: diskConfig?.apiKey || idbConfig?.apiKey || defaults.apiKey,
  };
}

export async function persistLocalConfig(config: LocalAppConfig): Promise<void> {
  await idbSet(CONFIG_KEY, config);
  if (isLocalDevOrigin()) {
    try {
      await fetch('/api/local-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config, null, 2),
      });
    } catch {
      // IndexedDB already persisted
    }
  }
}

export function exportStudyStateJson(state: StudyState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `biostudio-backup-${dateStamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
