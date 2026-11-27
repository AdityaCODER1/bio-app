import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CommandPaletteModal } from '../components/modals/CommandPaletteModal';
import { LineReaderView } from '../components/reader/LineReaderView';
import { CHAPTERS } from '../data/chapters';
import { createEmptyStudyState, normalizeStudyState } from '../services/persistence';
import { StudyProvider, useStudy } from '../state/studyStore';
import {
  computeChapterStats,
  computeSectionHighlightSummary,
  getAllChapterLines,
  getResolvedVaultItems,
  isClozeActiveForLine,
} from '../utils/chapterMetrics';
import { parseInlineClozeSyntax, splitClozeSegments } from '../utils/cloze';

describe('Cloze active recall utilities', () => {
  it('masks exact verbatim cloze terms cleanly', () => {
    const segs = splitClozeSegments(
      'In human beings, the membrane of the erythrocyte has approximately 52 per cent protein and 40 per cent lipids.',
      ['52 per cent protein', '40 per cent lipids'],
    );
    const masked = segs.filter((s) => s.isCloze).map((s) => s.text);
    expect(masked).toEqual(['52 per cent protein', '40 per cent lipids']);
  });

  it('parses {{cloze}} syntax in custom user lines', () => {
    const res = parseInlineClozeSyntax(
      'Remember: {{Malonate}} competitively inhibits {{succinic dehydrogenase}}.',
    );
    expect(res.cleanText).toBe('Remember: Malonate competitively inhibits succinic dehydrogenase.');
    expect(res.clozeTerms).toEqual(['Malonate', 'succinic dehydrogenase']);
  });

  it('evaluates selective Cloze scope accurately for all, highlighted, and volatile_trap', () => {
    expect(isClozeActiveForLine(false, 'all', 'trap')).toBe(false);
    expect(isClozeActiveForLine(true, 'all', undefined)).toBe(true);

    expect(isClozeActiveForLine(true, 'highlighted', undefined)).toBe(false);
    expect(isClozeActiveForLine(true, 'highlighted', 'important')).toBe(true);
    expect(isClozeActiveForLine(true, 'highlighted', 'pyq')).toBe(true);

    expect(isClozeActiveForLine(true, 'volatile_trap', undefined)).toBe(false);
    expect(isClozeActiveForLine(true, 'volatile_trap', 'important')).toBe(false);
    expect(isClozeActiveForLine(true, 'volatile_trap', 'pyq')).toBe(false);
    expect(isClozeActiveForLine(true, 'volatile_trap', 'volatile')).toBe(true);
    expect(isClozeActiveForLine(true, 'volatile_trap', 'trap')).toBe(true);
  });
});

describe('Chapter metrics, revision queue, highlights, and editable vault', () => {
  it('computes mastery, highlight counts, section summaries, and Revise Until Mastered counts accurately', () => {
    const ch09 = CHAPTERS.find((c) => c.id === 'ch09')!;
    const lines = getAllChapterLines(ch09);
    expect(lines.length).toBeGreaterThan(250);

    const state = createEmptyStudyState();
    state.lineMastery[lines[0].line.id] = 'mastered';
    state.lineMastery[lines[1].line.id] = 'review';
    state.lineHighlights[lines[0].line.id] = 'important';
    state.lineHighlights[lines[1].line.id] = 'trap';
    state.lineHighlights[lines[2].line.id] = 'volatile';
    state.lineHighlights[lines[3].line.id] = 'pyq';
    state.customLines[lines[1].line.id] = [
      {
        id: 'cl-1',
        chapterId: 'ch09',
        parentLineId: lines[1].line.id,
        text: 'Custom PYQ reminder',
        tags: ['PYQ'],
        clozeTerms: [],
        status: 'review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    state.lineNotes[lines[1].line.id] = [
      {
        id: 'n-1',
        chapterId: 'ch09',
        targetId: lines[1].line.id,
        targetType: 'line',
        content: 'Pinned Gemini tip',
        tags: ['Trap'],
        source: 'gemini',
        status: 'review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const stats = computeChapterStats(ch09, state);
    expect(stats.masteredLines).toBe(1);
    expect(stats.reviewLines).toBe(1);
    expect(stats.highlightedLines).toBe(4);
    expect(stats.highlightCountsByTier).toEqual({
      important: 1,
      volatile: 1,
      trap: 1,
      pyq: 1,
    });
    expect(stats.customLineCount).toBe(1);
    expect(stats.noteCount).toBe(1);
    // Highlights remain strictly independent of revisionQueueCount
    expect(stats.revisionQueueCount).toBe(3);

    const firstSectionSummary = computeSectionHighlightSummary(ch09.sections[0], state);
    expect(firstSectionSummary.total).toBeGreaterThan(0);

    // Graduate custom line & note -> revision queue drops to 1
    state.customLines[lines[1].line.id][0].status = 'mastered';
    state.lineNotes[lines[1].line.id][0].status = 'mastered';
    const updated = computeChapterStats(ch09, state);
    expect(updated.revisionQueueCount).toBe(1);
  });

  it('normalizes legacy study-state snapshots missing lineHighlights', () => {
    const legacy = {
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      lineMastery: { 'ch08-l001': 'mastered' as const },
    };
    const normalized = normalizeStudyState(legacy);
    expect(normalized.lineMastery['ch08-l001']).toBe('mastered');
    expect(normalized.lineHighlights).toEqual({});
  });

  it('supports adding, editing, and deleting End-of-Chapter Vault facts', () => {
    const ch10 = CHAPTERS.find((c) => c.id === 'ch10')!;
    const state = createEmptyStudyState();
    const initialCount = ch10.vault.length;

    const firstId = ch10.vault[0].id;
    state.deletedVaultIds.push(firstId);
    state.editedVaultItems[ch10.vault[1].id] = { prompt: 'Updated Prompt' };
    state.customVaultItems.ch10 = [
      {
        id: 'vault-custom-1',
        category: 'word_traps',
        prompt: 'My Custom Trap',
        detail: 'Always verify DNA C-value after S phase.',
        isCustom: true,
      },
    ];

    const resolved = getResolvedVaultItems(ch10, state);
    expect(resolved.length).toBe(initialCount); // -1 deleted + 1 custom
    expect(resolved.some((v) => v.id === firstId)).toBe(false);
    expect(resolved.find((v) => v.id === ch10.vault[1].id)?.prompt).toBe('Updated Prompt');
    expect(resolved.some((v) => v.id === 'vault-custom-1')).toBe(true);
  });
});

describe('Interactive 4-tier highlighting, permanent High-Yield badges, and ⌘K highlight browser', () => {
  it('supports setting, cycling, toggling, clearing highlights, reader filtering, and ⌘K browsing while keeping High-Yield badges permanent', async () => {
    const ch08 = CHAPTERS[0];
    const realLines = getAllChapterLines(ch08);
    const highYieldLine = realLines.find((l) => l.line.isHighYield)!.line;
    const secondLine = realLines.find((l) => l.line.id !== highYieldLine.id)!.line;

    // Build a compact 2-line slice of Ch 8 for fast deterministic DOM rendering
    const miniChapter = {
      ...ch08,
      diagrams: [],
      vault: [],
      sections: [
        {
          id: 'sec-test-1',
          number: '8.1',
          title: 'Test Section',
          level: 1 as const,
          blocks: [
            {
              type: 'paragraph' as const,
              id: 'p-test-1',
              lines: [highYieldLine, secondLine],
            },
          ],
        },
      ],
    };

    function Harness() {
      const study = useStudy();
      return (
        <div>
          <div data-testid="sync-status">{study.syncStatus}</div>
          <button type="button" onClick={() => study.cycleLineHighlight(highYieldLine.id)}>
            cycle-hl
          </button>
          <button
            type="button"
            onClick={() => study.toggleLineHighlight(highYieldLine.id, 'trap')}
          >
            toggle-trap
          </button>
          <button
            type="button"
            onClick={() => study.setLineHighlight(highYieldLine.id, null)}
          >
            clear-hl
          </button>
          <div data-testid="hl-value">{study.state.lineHighlights[highYieldLine.id] ?? 'none'}</div>
          <LineReaderView chapter={miniChapter} />
          <CommandPaletteModal onClose={() => {}} />
        </div>
      );
    }

    render(
      <StudyProvider initialChapterId={ch08.id}>
        <Harness />
      </StudyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).not.toBe('loading');
    });

    expect(screen.getByTestId('hl-value').textContent).toBe('none');

    // Preset High-Yield badge is rendered permanently with no dismiss button
    const lineEl = document.getElementById(`line-${highYieldLine.id}`)!;
    const hyBadge = lineEl.querySelector('.micro-badge.high-yield');
    expect(hyBadge).toBeInTheDocument();
    expect(hyBadge?.querySelector('button')).toBeNull();

    // Cycle: none -> important -> volatile -> trap -> pyq -> none
    fireEvent.click(screen.getByText('cycle-hl'));
    expect(screen.getByTestId('hl-value').textContent).toBe('important');
    fireEvent.click(screen.getByText('cycle-hl'));
    expect(screen.getByTestId('hl-value').textContent).toBe('volatile');
    fireEvent.click(screen.getByText('cycle-hl'));
    expect(screen.getByTestId('hl-value').textContent).toBe('trap');
    fireEvent.click(screen.getByText('cycle-hl'));
    expect(screen.getByTestId('hl-value').textContent).toBe('pyq');
    fireEvent.click(screen.getByText('cycle-hl'));
    expect(screen.getByTestId('hl-value').textContent).toBe('none');

    // Toggle Trap on -> LineRow reflects highlight class and marker
    fireEvent.click(screen.getByText('toggle-trap'));
    expect(screen.getByTestId('hl-value').textContent).toBe('trap');
    expect(lineEl).toHaveClass('has-highlight', 'highlight-trap');

    // Reader filter by Highlighted hides unhighlighted secondLine
    fireEvent.click(screen.getByRole('button', { name: /^Highlighted \(1\)$/i }));
    expect(document.getElementById(`line-${highYieldLine.id}`)).toBeInTheDocument();
    expect(document.getElementById(`line-${secondLine.id}`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /All Lines/i }));
    expect(document.getElementById(`line-${secondLine.id}`)).toBeInTheDocument();

    // Command Palette cross-chapter highlight browser lists the highlighted line
    const allHlChip = screen.getByRole('button', { name: /All Highlighted \(1\)/i });
    fireEvent.click(allHlChip);
    expect(screen.getByText(new RegExp(`Line #${highYieldLine.lineNumber}`))).toBeInTheDocument();

    // Toggle Trap again -> removes highlight while High-Yield badge stays intact
    fireEvent.click(screen.getByText('toggle-trap'));
    expect(screen.getByTestId('hl-value').textContent).toBe('none');
    expect(document.getElementById(`line-${highYieldLine.id}`)).not.toHaveClass('has-highlight');
    expect(
      document.getElementById(`line-${highYieldLine.id}`)?.querySelector('.micro-badge.high-yield'),
    ).toBeInTheDocument();
  });
});
