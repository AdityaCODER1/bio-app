import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { TopToolbar } from '../components/layout/TopToolbar';
import { SettingsModal } from '../components/modals/SettingsModal';
import { ChapterSidebar } from '../components/sidebar/ChapterSidebar';
import { CHAPTERS } from '../data/chapters';
import { _resetPwaStateForTests, initPwaListeners } from '../services/pwa';
import { StudyProvider, useStudy } from '../state/studyStore';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function mockMatchMedia(standalone = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: standalone && query.includes('standalone'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('Responsive desktop preservation vs phone-first drawer behavior', () => {
  beforeEach(() => {
    setViewportWidth(1280);
    mockMatchMedia(false);
    _resetPwaStateForTests();
  });

  afterEach(() => {
    cleanup();
    setViewportWidth(1024);
    mockMatchMedia(false);
    _resetPwaStateForTests();
  });

  it('preserves default open sidebar + inspector on desktop (>960px)', async () => {
    setViewportWidth(1280);

    function Harness() {
      const { sidebarOpen, inspectorOpen, setSidebarOpen, setInspectorOpen, syncStatus } = useStudy();
      return (
        <div>
          <div data-testid="sync">{syncStatus}</div>
          <div data-testid="sidebar">{String(sidebarOpen)}</div>
          <div data-testid="inspector">{String(inspectorOpen)}</div>
          <button type="button" onClick={() => setSidebarOpen(true)}>open-sidebar</button>
          <button type="button" onClick={() => setInspectorOpen(true)}>open-inspector</button>
        </div>
      );
    }

    render(
      <StudyProvider initialChapterId={CHAPTERS[0].id}>
        <Harness />
      </StudyProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('sync').textContent).not.toBe('loading'));

    expect(screen.getByTestId('sidebar').textContent).toBe('true');
    expect(screen.getByTestId('inspector').textContent).toBe('true');

    // Both remain open simultaneously on desktop
    fireEvent.click(screen.getByText('open-sidebar'));
    fireEvent.click(screen.getByText('open-inspector'));
    expect(screen.getByTestId('sidebar').textContent).toBe('true');
    expect(screen.getByTestId('inspector').textContent).toBe('true');
  });

  it('starts uncluttered on phones (<=960px), enforces mutual drawer exclusion, auto-closes on chapter pick, and switches tabs via MobileBottomNav', async () => {
    setViewportWidth(390);

    function Harness() {
      const {
        sidebarOpen,
        inspectorOpen,
        setSidebarOpen,
        setInspectorOpen,
        activeMode,
        activeChapterId,
        syncStatus,
      } = useStudy();
      const activeChapter = CHAPTERS.find((c) => c.id === activeChapterId) ?? CHAPTERS[0];
      return (
        <div>
          <div data-testid="sync">{syncStatus}</div>
          <div data-testid="sidebar">{String(sidebarOpen)}</div>
          <div data-testid="inspector">{String(inspectorOpen)}</div>
          <div data-testid="mode">{activeMode}</div>
          <div data-testid="chapter">{activeChapterId}</div>
          <button type="button" onClick={() => setSidebarOpen(true)}>open-sidebar</button>
          <button type="button" onClick={() => setInspectorOpen(true)}>open-inspector</button>
          {sidebarOpen && <ChapterSidebar activeChapter={activeChapter} />}
          <MobileBottomNav revisionQueueCount={3} />
        </div>
      );
    }

    render(
      <StudyProvider initialChapterId={CHAPTERS[0].id}>
        <Harness />
      </StudyProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('sync').textContent).not.toBe('loading'));

    // Both side panes default closed on phone
    expect(screen.getByTestId('sidebar').textContent).toBe('false');
    expect(screen.getByTestId('inspector').textContent).toBe('false');

    // Opening sidebar then opening inspector closes sidebar (mutual exclusion)
    fireEvent.click(screen.getByText('open-sidebar'));
    expect(screen.getByTestId('sidebar').textContent).toBe('true');
    expect(screen.getByTestId('inspector').textContent).toBe('false');

    fireEvent.click(screen.getByText('open-inspector'));
    expect(screen.getByTestId('inspector').textContent).toBe('true');
    expect(screen.getByTestId('sidebar').textContent).toBe('false');

    // Selecting a different chapter in ChapterSidebar auto-closes the drawer on phone
    fireEvent.click(screen.getByText('open-sidebar'));
    expect(screen.getByTestId('sidebar').textContent).toBe('true');
    fireEvent.click(screen.getByText(CHAPTERS[1].title));
    expect(screen.getByTestId('chapter').textContent).toBe(CHAPTERS[1].id);
    expect(screen.getByTestId('sidebar').textContent).toBe('false');

    // MobileBottomNav switches workspace modes & closes open drawers
    fireEvent.click(screen.getByText('open-inspector'));
    expect(screen.getByTestId('inspector').textContent).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Diagrams/i }));
    expect(screen.getByTestId('mode').textContent).toBe('diagrams');
    expect(screen.getByTestId('inspector').textContent).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: /Revise/i }));
    expect(screen.getByTestId('mode').textContent).toBe('revise');
    expect(screen.getByLabelText('3 pending')).toBeInTheDocument();
  });

  it(
    'closes open mobile drawer cleanly when Android Back gesture triggers popstate',
    async () => {
      setViewportWidth(390);

      const { container } = render(<App />);

      // Open Chapters drawer via toolbar button
      const sidebarBtn = container.querySelector('button[aria-label="Toggle Chapters Sidebar"]')!;
      expect(sidebarBtn).toBeInTheDocument();
      fireEvent.click(sidebarBtn);
      expect(
        container.querySelector('aside[aria-label="Chapter and Section Navigator"]'),
      ).toBeInTheDocument();

      // Simulate Android system Back gesture (popstate)
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      await waitFor(() => {
        expect(
          container.querySelector('aside[aria-label="Chapter and Section Navigator"]'),
        ).not.toBeInTheDocument();
      });

      // Opening Inspector drawer and closing via mobile X button works cleanly
      const inspectorBtn = container.querySelector(
        'button[aria-label="Toggle AI and PDF Inspector"]',
      )!;
      fireEvent.click(inspectorBtn);
      expect(
        container.querySelector('aside[aria-label="Line AI, MCQ Lab, and PDF Page Inspector"]'),
      ).toBeInTheDocument();

      const closeInspectorBtn = container.querySelector('button[aria-label="Close inspector"]')!;
      fireEvent.click(closeInspectorBtn);
      expect(
        container.querySelector('aside[aria-label="Line AI, MCQ Lab, and PDF Page Inspector"]'),
      ).not.toBeInTheDocument();
    },
    15000,
  );
});

describe('Browser PWA install prompt & Settings install card', () => {
  beforeEach(() => {
    setViewportWidth(390);
    mockMatchMedia(false);
    initPwaListeners();
    _resetPwaStateForTests();
  });

  afterEach(() => {
    cleanup();
    setViewportWidth(1024);
    mockMatchMedia(false);
    _resetPwaStateForTests();
  });

  it('shows subtle toolbar Install button only when beforeinstallprompt is available and hides after install', async () => {
    const promptSpy = vi.fn().mockResolvedValue(undefined);
    const installEvent = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      platforms: ['web'],
      prompt: promptSpy,
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    });

    render(
      <StudyProvider initialChapterId={CHAPTERS[0].id}>
        <TopToolbar
          revisionQueueCount={0}
          chapterNumber={8}
          chapterTitle="Cell: The Unit of Life"
          onOpenSettings={() => {}}
          onOpenSearch={() => {}}
        />
        <SettingsModal onClose={() => {}} />
      </StudyProvider>,
    );

    // Hidden before browser fires beforeinstallprompt
    expect(screen.queryByRole('button', { name: /Install BioStudio App/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Install App$/i })).not.toBeInTheDocument();

    // Browser fires beforeinstallprompt -> subtle toolbar icon + Settings Install button appear
    act(() => {
      window.dispatchEvent(installEvent);
    });

    const toolbarInstallBtn = await screen.findByRole('button', { name: /Install BioStudio App/i });
    expect(toolbarInstallBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Install App$/i })).toBeInTheDocument();

    // Clicking triggers native prompt and hides button once accepted
    fireEvent.click(toolbarInstallBtn);

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: /Install BioStudio App/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Installed as Standalone App/i)).toBeInTheDocument();
    });
  });
});
