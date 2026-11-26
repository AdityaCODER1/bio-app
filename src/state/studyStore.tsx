import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createDefaultConfig,
  createEmptyStudyState,
  exportStudyStateJson,
  loadLocalConfig,
  loadStudyState,
  persistLocalConfig,
  persistStudyState,
} from '../services/persistence';
import type {
  ActiveSelection,
  ActiveWorkspaceMode,
  ChatMessage,
  CustomUserLine,
  DiagramInfoPoint,
  GeneratedMcqDraft,
  GeminiModelId,
  InspectorTab,
  LocalAppConfig,
  MasteryStatus,
  NoteTag,
  SavedMcq,
  StudyState,
  UserNote,
  VaultCategoryKey,
  VaultItem,
} from '../types/study';

type SyncStatus = 'loading' | 'idle' | 'saving' | 'saved-disk' | 'saved-browser' | 'error';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface StudyContextValue {
  state: StudyState;
  config: LocalAppConfig;
  effectiveModelId: GeminiModelId;
  syncStatus: SyncStatus;
  diskSyncAvailable: boolean;
  lastSavedAt: string | null;

  activeChapterId: string;
  setActiveChapterId: (chapterId: string) => void;
  activeMode: ActiveWorkspaceMode;
  setActiveMode: (mode: ActiveWorkspaceMode) => void;
  activeSelection: ActiveSelection | null;
  selectLine: (chapterId: string, lineId: string, openInspectorTab?: InspectorTab) => void;
  selectDiagram: (chapterId: string, diagramId: string, openInspectorTab?: InspectorTab) => void;

  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
  inspectorOpen: boolean;
  setInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  jumpRequest: { lineId: string; nonce: number } | null;
  jumpToLine: (chapterId: string, lineId: string) => void;

  updateConfig: (patch: Partial<LocalAppConfig>) => void;

  setLineMastery: (lineId: string, status: MasteryStatus) => void;
  cycleLineMastery: (lineId: string) => void;
  markLinesMastery: (lineIds: string[], status: MasteryStatus) => void;

  addCustomLine: (params: {
    chapterId: string;
    parentLineId: string;
    text: string;
    tags: NoteTag[];
    clozeTerms: string[];
  }) => void;
  updateCustomLine: (
    parentLineId: string,
    customLineId: string,
    patch: Partial<Pick<CustomUserLine, 'text' | 'tags' | 'clozeTerms' | 'status'>>,
  ) => void;
  deleteCustomLine: (parentLineId: string, customLineId: string) => void;

  addNote: (params: {
    chapterId: string;
    targetId: string;
    targetType: 'line' | 'diagram';
    content: string;
    tags: NoteTag[];
    source: 'user' | 'gemini';
    modelUsed?: string;
  }) => void;
  updateNote: (
    targetId: string,
    noteId: string,
    patch: Partial<Pick<UserNote, 'content' | 'tags' | 'status'>>,
  ) => void;
  deleteNote: (targetId: string, noteId: string) => void;

  pinMcq: (params: {
    chapterId: string;
    targetId: string;
    targetType: 'line' | 'diagram';
    draft: GeneratedMcqDraft;
    modelUsed?: string;
  }) => void;
  updatePinnedMcq: (
    targetId: string,
    mcqId: string,
    patch: Partial<Pick<SavedMcq, 'question' | 'explanation' | 'status'>>,
  ) => void;
  recordMcqAttempt: (targetId: string, mcqId: string, correct: boolean) => void;
  deletePinnedMcq: (targetId: string, mcqId: string) => void;

  setDiagramMastery: (diagramId: string, status: MasteryStatus) => void;
  addDiagramInfoPoint: (diagramId: string, point: Omit<DiagramInfoPoint, 'id' | 'isCustom'>) => void;
  deleteDiagramInfoPoint: (diagramId: string, pointId: string) => void;

  setVaultMastery: (vaultId: string, status: MasteryStatus) => void;
  addCustomVaultItem: (
    chapterId: string,
    item: { category: VaultCategoryKey; prompt: string; detail: string; ncertPage?: number },
  ) => void;
  editVaultItem: (
    chapterId: string,
    vaultId: string,
    isCustom: boolean,
    patch: Partial<Pick<VaultItem, 'category' | 'prompt' | 'detail'>>,
  ) => void;
  deleteVaultItem: (chapterId: string, vaultId: string, isCustom: boolean) => void;

  appendChatMessage: (targetId: string, msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearChatThread: (targetId: string) => void;

  exportBackup: () => void;
  importBackupJson: (raw: string) => { ok: boolean; error?: string };
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({
  initialChapterId,
  children,
}: {
  initialChapterId: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<StudyState>(() => createEmptyStudyState());
  const [config, setConfig] = useState<LocalAppConfig>(() => createDefaultConfig());
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [diskSyncAvailable, setDiskSyncAvailable] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [activeChapterId, setActiveChapterId] = useState(initialChapterId);
  const [activeMode, setActiveMode] = useState<ActiveWorkspaceMode>('read');
  const [activeSelection, setActiveSelection] = useState<ActiveSelection | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('ask');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jumpRequest, setJumpRequest] = useState<{ lineId: string; nonce: number } | null>(null);

  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [studyRes, loadedConfig] = await Promise.all([
        loadStudyState(),
        loadLocalConfig(),
      ]);
      if (cancelled) return;
      setState(studyRes.state);
      setConfig(loadedConfig);
      setDiskSyncAvailable(studyRes.diskSyncAvailable);
      setSyncStatus(studyRes.diskSyncAvailable ? 'saved-disk' : 'saved-browser');
      setLastSavedAt(studyRes.state.updatedAt);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced auto-save whenever study state changes after hydration
  const mutateState = useCallback((updater: (prev: StudyState) => StudyState) => {
    setState((prev) => ({
      ...updater(prev),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSyncStatus('saving');
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await persistStudyState(state);
        setDiskSyncAvailable(res.diskSaved);
        setLastSavedAt(res.savedAt);
        setSyncStatus(res.diskSaved ? 'saved-disk' : 'saved-browser');
      } catch {
        setSyncStatus('error');
      }
    }, 350);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [state, hydrated]);

  const updateConfig = useCallback((patch: Partial<LocalAppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      void persistLocalConfig(next);
      return next;
    });
  }, []);

  const effectiveModelId: GeminiModelId = useMemo(() => {
    if (config.useCustomModel && config.customModelId.trim()) {
      return config.customModelId.trim();
    }
    return config.selectedModel;
  }, [config.useCustomModel, config.customModelId, config.selectedModel]);

  const selectLine = useCallback(
    (chapterId: string, lineId: string, openTab?: InspectorTab) => {
      setActiveSelection({ type: 'line', chapterId, id: lineId });
      if (openTab) {
        setInspectorTab(openTab);
        setInspectorOpen(true);
      }
    },
    [],
  );

  const selectDiagram = useCallback(
    (chapterId: string, diagramId: string, openTab?: InspectorTab) => {
      setActiveSelection({ type: 'diagram', chapterId, id: diagramId });
      if (openTab) {
        setInspectorTab(openTab);
        setInspectorOpen(true);
      }
    },
    [],
  );

  const jumpToLine = useCallback((chapterId: string, lineId: string) => {
    setActiveChapterId(chapterId);
    setActiveMode('read');
    setActiveSelection({ type: 'line', chapterId, id: lineId });
    setJumpRequest({ lineId, nonce: Date.now() });
  }, []);

  const setLineMastery = useCallback(
    (lineId: string, status: MasteryStatus) => {
      mutateState((prev) => ({
        ...prev,
        lineMastery: { ...prev.lineMastery, [lineId]: status },
      }));
    },
    [mutateState],
  );

  const cycleLineMastery = useCallback(
    (lineId: string) => {
      mutateState((prev) => {
        const current = prev.lineMastery[lineId] ?? 'unread';
        const next: MasteryStatus =
          current === 'unread' ? 'review' : current === 'review' ? 'mastered' : 'unread';
        return {
          ...prev,
          lineMastery: { ...prev.lineMastery, [lineId]: next },
        };
      });
    },
    [mutateState],
  );

  const markLinesMastery = useCallback(
    (lineIds: string[], status: MasteryStatus) => {
      mutateState((prev) => {
        const nextMap = { ...prev.lineMastery };
        for (const id of lineIds) nextMap[id] = status;
        return { ...prev, lineMastery: nextMap };
      });
    },
    [mutateState],
  );

  const addCustomLine: StudyContextValue['addCustomLine'] = useCallback(
    ({ chapterId, parentLineId, text, tags, clozeTerms }) => {
      const now = new Date().toISOString();
      const entry: CustomUserLine = {
        id: makeId('cline'),
        chapterId,
        parentLineId,
        text: text.trim(),
        tags,
        clozeTerms,
        status: 'review',
        createdAt: now,
        updatedAt: now,
      };
      mutateState((prev) => ({
        ...prev,
        customLines: {
          ...prev.customLines,
          [parentLineId]: [...(prev.customLines[parentLineId] ?? []), entry],
        },
      }));
    },
    [mutateState],
  );

  const updateCustomLine: StudyContextValue['updateCustomLine'] = useCallback(
    (parentLineId, customLineId, patch) => {
      const now = new Date().toISOString();
      mutateState((prev) => ({
        ...prev,
        customLines: {
          ...prev.customLines,
          [parentLineId]: (prev.customLines[parentLineId] ?? []).map((item) =>
            item.id === customLineId ? { ...item, ...patch, updatedAt: now } : item,
          ),
        },
      }));
    },
    [mutateState],
  );

  const deleteCustomLine = useCallback(
    (parentLineId: string, customLineId: string) => {
      mutateState((prev) => ({
        ...prev,
        customLines: {
          ...prev.customLines,
          [parentLineId]: (prev.customLines[parentLineId] ?? []).filter(
            (item) => item.id !== customLineId,
          ),
        },
      }));
    },
    [mutateState],
  );

  const addNote: StudyContextValue['addNote'] = useCallback(
    ({ chapterId, targetId, targetType, content, tags, source, modelUsed }) => {
      const now = new Date().toISOString();
      const note: UserNote = {
        id: makeId('note'),
        chapterId,
        targetId,
        targetType,
        content: content.trim(),
        tags,
        source,
        modelUsed,
        status: 'review',
        createdAt: now,
        updatedAt: now,
      };
      mutateState((prev) => ({
        ...prev,
        lineNotes: {
          ...prev.lineNotes,
          [targetId]: [...(prev.lineNotes[targetId] ?? []), note],
        },
      }));
    },
    [mutateState],
  );

  const updateNote: StudyContextValue['updateNote'] = useCallback(
    (targetId, noteId, patch) => {
      const now = new Date().toISOString();
      mutateState((prev) => ({
        ...prev,
        lineNotes: {
          ...prev.lineNotes,
          [targetId]: (prev.lineNotes[targetId] ?? []).map((n) =>
            n.id === noteId ? { ...n, ...patch, updatedAt: now } : n,
          ),
        },
      }));
    },
    [mutateState],
  );

  const deleteNote = useCallback(
    (targetId: string, noteId: string) => {
      mutateState((prev) => ({
        ...prev,
        lineNotes: {
          ...prev.lineNotes,
          [targetId]: (prev.lineNotes[targetId] ?? []).filter((n) => n.id !== noteId),
        },
      }));
    },
    [mutateState],
  );

  const pinMcq: StudyContextValue['pinMcq'] = useCallback(
    ({ chapterId, targetId, targetType, draft, modelUsed }) => {
      const now = new Date().toISOString();
      const saved: SavedMcq = {
        ...draft,
        id: makeId('mcq'),
        chapterId,
        targetId,
        targetType,
        modelUsed,
        status: 'review',
        attempts: 0,
        correctAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      mutateState((prev) => ({
        ...prev,
        pinnedMcqs: {
          ...prev.pinnedMcqs,
          [targetId]: [saved, ...(prev.pinnedMcqs[targetId] ?? [])],
        },
      }));
    },
    [mutateState],
  );

  const updatePinnedMcq: StudyContextValue['updatePinnedMcq'] = useCallback(
    (targetId, mcqId, patch) => {
      const now = new Date().toISOString();
      mutateState((prev) => ({
        ...prev,
        pinnedMcqs: {
          ...prev.pinnedMcqs,
          [targetId]: (prev.pinnedMcqs[targetId] ?? []).map((m) =>
            m.id === mcqId ? { ...m, ...patch, updatedAt: now } : m,
          ),
        },
      }));
    },
    [mutateState],
  );

  const recordMcqAttempt = useCallback(
    (targetId: string, mcqId: string, correct: boolean) => {
      const now = new Date().toISOString();
      mutateState((prev) => ({
        ...prev,
        pinnedMcqs: {
          ...prev.pinnedMcqs,
          [targetId]: (prev.pinnedMcqs[targetId] ?? []).map((m) =>
            m.id === mcqId
              ? {
                  ...m,
                  attempts: m.attempts + 1,
                  correctAttempts: m.correctAttempts + (correct ? 1 : 0),
                  updatedAt: now,
                }
              : m,
          ),
        },
      }));
    },
    [mutateState],
  );

  const deletePinnedMcq = useCallback(
    (targetId: string, mcqId: string) => {
      mutateState((prev) => ({
        ...prev,
        pinnedMcqs: {
          ...prev.pinnedMcqs,
          [targetId]: (prev.pinnedMcqs[targetId] ?? []).filter((m) => m.id !== mcqId),
        },
      }));
    },
    [mutateState],
  );

  const setDiagramMastery = useCallback(
    (diagramId: string, status: MasteryStatus) => {
      mutateState((prev) => ({
        ...prev,
        diagramMastery: { ...prev.diagramMastery, [diagramId]: status },
      }));
    },
    [mutateState],
  );

  const addDiagramInfoPoint: StudyContextValue['addDiagramInfoPoint'] = useCallback(
    (diagramId, point) => {
      const item: DiagramInfoPoint = {
        ...point,
        id: makeId('dinfo'),
        isCustom: true,
      };
      mutateState((prev) => ({
        ...prev,
        diagramExtraInfo: {
          ...prev.diagramExtraInfo,
          [diagramId]: [...(prev.diagramExtraInfo[diagramId] ?? []), item],
        },
      }));
    },
    [mutateState],
  );

  const deleteDiagramInfoPoint = useCallback(
    (diagramId: string, pointId: string) => {
      mutateState((prev) => ({
        ...prev,
        diagramExtraInfo: {
          ...prev.diagramExtraInfo,
          [diagramId]: (prev.diagramExtraInfo[diagramId] ?? []).filter((p) => p.id !== pointId),
        },
      }));
    },
    [mutateState],
  );

  const setVaultMastery = useCallback(
    (vaultId: string, status: MasteryStatus) => {
      mutateState((prev) => ({
        ...prev,
        vaultMastery: { ...prev.vaultMastery, [vaultId]: status },
      }));
    },
    [mutateState],
  );

  const addCustomVaultItem: StudyContextValue['addCustomVaultItem'] = useCallback(
    (chapterId, item) => {
      const entry: VaultItem = {
        id: makeId('vault'),
        category: item.category,
        prompt: item.prompt.trim(),
        detail: item.detail.trim(),
        ncertPage: item.ncertPage,
        isCustom: true,
      };
      mutateState((prev) => ({
        ...prev,
        customVaultItems: {
          ...prev.customVaultItems,
          [chapterId]: [...(prev.customVaultItems[chapterId] ?? []), entry],
        },
      }));
    },
    [mutateState],
  );

  const editVaultItem: StudyContextValue['editVaultItem'] = useCallback(
    (chapterId, vaultId, isCustom, patch) => {
      mutateState((prev) => {
        if (isCustom) {
          return {
            ...prev,
            customVaultItems: {
              ...prev.customVaultItems,
              [chapterId]: (prev.customVaultItems[chapterId] ?? []).map((v) =>
                v.id === vaultId ? { ...v, ...patch } : v,
              ),
            },
          };
        }
        return {
          ...prev,
          editedVaultItems: {
            ...prev.editedVaultItems,
            [vaultId]: { ...(prev.editedVaultItems[vaultId] ?? {}), ...patch },
          },
        };
      });
    },
    [mutateState],
  );

  const deleteVaultItem = useCallback(
    (chapterId: string, vaultId: string, isCustom: boolean) => {
      mutateState((prev) => {
        if (isCustom) {
          return {
            ...prev,
            customVaultItems: {
              ...prev.customVaultItems,
              [chapterId]: (prev.customVaultItems[chapterId] ?? []).filter(
                (v) => v.id !== vaultId,
              ),
            },
          };
        }
        if (prev.deletedVaultIds.includes(vaultId)) return prev;
        return {
          ...prev,
          deletedVaultIds: [...prev.deletedVaultIds, vaultId],
        };
      });
    },
    [mutateState],
  );

  const appendChatMessage = useCallback(
    (targetId: string, msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
      const full: ChatMessage = {
        ...msg,
        id: makeId('msg'),
        createdAt: new Date().toISOString(),
      };
      mutateState((prev) => ({
        ...prev,
        aiThreads: {
          ...prev.aiThreads,
          [targetId]: [...(prev.aiThreads[targetId] ?? []), full],
        },
      }));
    },
    [mutateState],
  );

  const clearChatThread = useCallback(
    (targetId: string) => {
      mutateState((prev) => {
        const next = { ...prev.aiThreads };
        delete next[targetId];
        return { ...prev, aiThreads: next };
      });
    },
    [mutateState],
  );

  const exportBackup = useCallback(() => {
    exportStudyStateJson(state);
  }, [state]);

  const importBackupJson = useCallback(
    (raw: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(raw) as Partial<StudyState>;
        if (!parsed || typeof parsed !== 'object' || typeof parsed.lineMastery !== 'object') {
          return { ok: false, error: 'Invalid BioStudio backup JSON format.' };
        }
        mutateState(() => ({
          ...createEmptyStudyState(),
          ...parsed,
        }));
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to parse backup JSON.',
        };
      }
    },
    [mutateState],
  );

  const value: StudyContextValue = {
    state,
    config,
    effectiveModelId,
    syncStatus,
    diskSyncAvailable,
    lastSavedAt,
    activeChapterId,
    setActiveChapterId,
    activeMode,
    setActiveMode,
    activeSelection,
    selectLine,
    selectDiagram,
    inspectorTab,
    setInspectorTab,
    inspectorOpen,
    setInspectorOpen,
    sidebarOpen,
    setSidebarOpen,
    jumpRequest,
    jumpToLine,
    updateConfig,
    setLineMastery,
    cycleLineMastery,
    markLinesMastery,
    addCustomLine,
    updateCustomLine,
    deleteCustomLine,
    addNote,
    updateNote,
    deleteNote,
    pinMcq,
    updatePinnedMcq,
    recordMcqAttempt,
    deletePinnedMcq,
    setDiagramMastery,
    addDiagramInfoPoint,
    deleteDiagramInfoPoint,
    setVaultMastery,
    addCustomVaultItem,
    editVaultItem,
    deleteVaultItem,
    appendChatMessage,
    clearChatThread,
    exportBackup,
    importBackupJson,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
