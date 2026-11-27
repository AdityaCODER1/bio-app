import { useEffect, useMemo, useRef, useState } from 'react';
import { CHAPTERS, getChapterById } from './data/chapters';
import { DiagramsGalleryView } from './components/diagrams/DiagramsGalleryView';
import { RightInspector } from './components/inspector/RightInspector';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { TopToolbar } from './components/layout/TopToolbar';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LineReaderView } from './components/reader/LineReaderView';
import { RevisionQueueView } from './components/revision/RevisionQueueView';
import { ChapterSidebar } from './components/sidebar/ChapterSidebar';
import { ChapterVaultView } from './components/vault/ChapterVaultView';
import { isCompactViewport, StudyProvider, useStudy } from './state/studyStore';
import { LINE_HIGHLIGHT_ORDER } from './types/study';
import { computeChapterStats, getAllChapterLines } from './utils/chapterMetrics';

function StudyWorkspace() {
  const {
    state,
    config,
    updateConfig,
    activeChapterId,
    activeMode,
    activeSelection,
    selectLine,
    setLineMastery,
    setLineHighlight,
    toggleLineHighlight,
    cycleLineHighlight,
    sidebarOpen,
    setSidebarOpen,
    inspectorOpen,
    setInspectorOpen,
    jumpRequest,
  } = useStudy();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const centerPaneRef = useRef<HTMLElement | null>(null);
  const pushedOverlayRef = useRef(false);
  const closingFromPopstateRef = useRef(false);

  const chapter = useMemo(() => getChapterById(activeChapterId), [activeChapterId]);
  const allLines = useMemo(() => getAllChapterLines(chapter), [chapter]);
  const stats = useMemo(() => computeChapterStats(chapter, state), [chapter, state]);

  // Reset center scroll to top when switching chapters or tabs
  useEffect(() => {
    if (centerPaneRef.current) {
      centerPaneRef.current.scrollTop = 0;
    }
  }, [activeChapterId, activeMode]);

  // Ensure a valid default line is selected on desktop whenever switching chapters
  // (Skipped on compact phone viewports so chapters open cleanly with zero inline action clutter)
  useEffect(() => {
    if (isCompactViewport()) return;
    if (
      (!activeSelection || activeSelection.chapterId !== chapter.id) &&
      allLines.length > 0
    ) {
      selectLine(chapter.id, allLines[0].line.id);
    }
  }, [activeSelection, allLines, chapter.id, selectLine]);

  // Smooth scroll when jumping to a specific NCERT line from Search, Vault, or Revision Queue
  useEffect(() => {
    if (!jumpRequest) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`line-${jumpRequest.lineId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [jumpRequest]);

  // Coordinate Android Back button / gesture so pressing Back closes mobile drawers & modals cleanly
  const hasMobileOverlay =
    isCompactViewport() && (settingsOpen || searchOpen || sidebarOpen || inspectorOpen);

  useEffect(() => {
    if (hasMobileOverlay && !pushedOverlayRef.current) {
      closingFromPopstateRef.current = false;
      window.history.pushState({ biostudioOverlay: true }, '');
      pushedOverlayRef.current = true;
    } else if (!hasMobileOverlay && pushedOverlayRef.current) {
      pushedOverlayRef.current = false;
      const wasPopstate = closingFromPopstateRef.current;
      closingFromPopstateRef.current = false;
      if (
        !wasPopstate &&
        (window.history.state as { biostudioOverlay?: boolean } | null)?.biostudioOverlay
      ) {
        window.history.back();
      }
    }
  }, [hasMobileOverlay]);

  useEffect(() => {
    const onPopState = () => {
      if (!pushedOverlayRef.current) return;
      pushedOverlayRef.current = false;
      closingFromPopstateRef.current = true;
      if (settingsOpen) {
        setSettingsOpen(false);
      } else if (searchOpen) {
        setSearchOpen(false);
      } else if (inspectorOpen) {
        setInspectorOpen(false);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [inspectorOpen, searchOpen, setInspectorOpen, setSidebarOpen, settingsOpen, sidebarOpen]);

  // Global desktop keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setSearchOpen(false);
        return;
      }

      if (isTyping || settingsOpen || searchOpen || e.metaKey || e.ctrlKey || e.altKey) return;

      const keyLower = e.key.toLowerCase();

      if (keyLower === 'c') {
        e.preventDefault();
        updateConfig({ clozeMode: !config.clozeMode });
        return;
      }

      if (activeMode !== 'read' || allLines.length === 0) return;

      const visibleLineIds = Array.from(
        centerPaneRef.current?.querySelectorAll<HTMLElement>('[data-line-id]') ?? [],
      )
        .map((el) => el.dataset.lineId)
        .filter((id): id is string => Boolean(id));

      const navLineIds =
        visibleLineIds.length > 0 ? visibleLineIds : allLines.map((item) => item.line.id);

      const currentIdx =
        activeSelection?.type === 'line' ? navLineIds.indexOf(activeSelection.id) : -1;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx =
          currentIdx === -1 ? 0 : Math.min(navLineIds.length - 1, currentIdx + 1);
        const nextId = navLineIds[nextIdx];
        if (nextId) {
          selectLine(chapter.id, nextId);
          document
            .getElementById(`line-${nextId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = currentIdx === -1 ? 0 : Math.max(0, currentIdx - 1);
        const prevId = navLineIds[prevIdx];
        if (prevId) {
          selectLine(chapter.id, prevId);
          document
            .getElementById(`line-${prevId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (activeSelection?.type === 'line') {
        const lineId = activeSelection.id;
        const currentStatus = state.lineMastery[lineId] ?? 'unread';
        if (keyLower === 'm') {
          e.preventDefault();
          setLineMastery(lineId, currentStatus === 'mastered' ? 'unread' : 'mastered');
        } else if (keyLower === 'r') {
          e.preventDefault();
          setLineMastery(lineId, currentStatus === 'review' ? 'unread' : 'review');
        } else if (keyLower === 'h') {
          e.preventDefault();
          cycleLineHighlight(lineId);
        } else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
          e.preventDefault();
          const tier = LINE_HIGHLIGHT_ORDER[Number(e.key) - 1];
          if (tier) toggleLineHighlight(lineId, tier);
        } else if (e.key === '0') {
          e.preventDefault();
          setLineHighlight(lineId, null);
        } else if (keyLower === 'q') {
          e.preventDefault();
          selectLine(chapter.id, lineId, 'mcq');
        } else if (keyLower === 'p') {
          e.preventDefault();
          selectLine(chapter.id, lineId, 'pdf');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeMode,
    activeSelection,
    allLines,
    chapter.id,
    config.clozeMode,
    cycleLineHighlight,
    searchOpen,
    selectLine,
    setLineHighlight,
    setLineMastery,
    setSidebarOpen,
    settingsOpen,
    state.lineMastery,
    toggleLineHighlight,
    updateConfig,
  ]);

  return (
    <div className="app-window">
      <TopToolbar
        revisionQueueCount={stats.revisionQueueCount}
        chapterNumber={chapter.chapterNumber}
        chapterTitle={chapter.title}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="workspace-body">
        {(sidebarOpen || inspectorOpen) && (
          <div
            className="mobile-pane-backdrop"
            aria-hidden="true"
            onClick={() => {
              setSidebarOpen(false);
              setInspectorOpen(false);
            }}
          />
        )}

        {sidebarOpen && <ChapterSidebar activeChapter={chapter} />}

        <main ref={centerPaneRef} className="center-pane">
          {activeMode === 'read' && <LineReaderView chapter={chapter} />}
          {activeMode === 'diagrams' && <DiagramsGalleryView chapter={chapter} />}
          {activeMode === 'vault' && <ChapterVaultView chapter={chapter} />}
          {activeMode === 'revise' && <RevisionQueueView chapter={chapter} />}
        </main>

        {inspectorOpen && (
          <RightInspector
            chapter={chapter}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
      </div>

      <MobileBottomNav revisionQueueCount={stats.revisionQueueCount} />

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {searchOpen && <CommandPaletteModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <StudyProvider initialChapterId={CHAPTERS[0].id}>
      <StudyWorkspace />
    </StudyProvider>
  );
}
