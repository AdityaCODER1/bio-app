import { useEffect, useMemo, useRef, useState } from 'react';
import { CHAPTERS, getChapterById } from './data/chapters';
import { DiagramsGalleryView } from './components/diagrams/DiagramsGalleryView';
import { RightInspector } from './components/inspector/RightInspector';
import { TopToolbar } from './components/layout/TopToolbar';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LineReaderView } from './components/reader/LineReaderView';
import { RevisionQueueView } from './components/revision/RevisionQueueView';
import { ChapterSidebar } from './components/sidebar/ChapterSidebar';
import { ChapterVaultView } from './components/vault/ChapterVaultView';
import { StudyProvider, useStudy } from './state/studyStore';
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
    sidebarOpen,
    setSidebarOpen,
    inspectorOpen,
    jumpRequest,
  } = useStudy();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const centerPaneRef = useRef<HTMLElement | null>(null);

  const chapter = useMemo(() => getChapterById(activeChapterId), [activeChapterId]);
  const allLines = useMemo(() => getAllChapterLines(chapter), [chapter]);
  const stats = useMemo(() => computeChapterStats(chapter, state), [chapter, state]);

  // Reset center scroll to top when switching chapters or tabs
  useEffect(() => {
    if (centerPaneRef.current) {
      centerPaneRef.current.scrollTop = 0;
    }
  }, [activeChapterId, activeMode]);

  // Ensure a valid default line is selected whenever switching chapters
  useEffect(() => {
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

      if (isTyping || settingsOpen || searchOpen) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        updateConfig({ clozeMode: !config.clozeMode });
        return;
      }

      if (activeMode !== 'read' || allLines.length === 0) return;

      const currentIdx =
        activeSelection?.type === 'line'
          ? allLines.findIndex((item) => item.line.id === activeSelection.id)
          : 0;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = allLines[Math.min(allLines.length - 1, Math.max(0, currentIdx) + 1)];
        if (next) {
          selectLine(chapter.id, next.line.id);
          document
            .getElementById(`line-${next.line.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = allLines[Math.max(0, currentIdx - 1)];
        if (prev) {
          selectLine(chapter.id, prev.line.id);
          document
            .getElementById(`line-${prev.line.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (activeSelection?.type === 'line') {
        const lineId = activeSelection.id;
        const currentStatus = state.lineMastery[lineId] ?? 'unread';
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setLineMastery(lineId, currentStatus === 'mastered' ? 'unread' : 'mastered');
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setLineMastery(lineId, currentStatus === 'review' ? 'unread' : 'review');
        } else if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          selectLine(chapter.id, lineId, 'mcq');
        } else if (e.key.toLowerCase() === 'p') {
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
    searchOpen,
    selectLine,
    setLineMastery,
    setSidebarOpen,
    settingsOpen,
    state.lineMastery,
    updateConfig,
  ]);

  return (
    <div className="app-window">
      <TopToolbar
        revisionQueueCount={stats.revisionQueueCount}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="workspace-body">
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
