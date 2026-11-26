import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../data/chapters';
import { createEmptyStudyState } from '../services/persistence';
import {
  computeChapterStats,
  getAllChapterLines,
  getResolvedVaultItems,
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
});

describe('Chapter metrics, revision queue, and editable vault', () => {
  it('computes mastery and Revise Until Mastered counts accurately', () => {
    const ch09 = CHAPTERS.find((c) => c.id === 'ch09')!;
    const lines = getAllChapterLines(ch09);
    expect(lines.length).toBeGreaterThan(250);

    const state = createEmptyStudyState();
    state.lineMastery[lines[0].line.id] = 'mastered';
    state.lineMastery[lines[1].line.id] = 'review';
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
    expect(stats.customLineCount).toBe(1);
    expect(stats.noteCount).toBe(1);
    expect(stats.revisionQueueCount).toBe(3);

    // Graduate custom line & note -> revision queue drops to 1
    state.customLines[lines[1].line.id][0].status = 'mastered';
    state.lineNotes[lines[1].line.id][0].status = 'mastered';
    const updated = computeChapterStats(ch09, state);
    expect(updated.revisionQueueCount).toBe(1);
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
