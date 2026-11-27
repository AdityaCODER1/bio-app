import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownMath } from '../components/common/MarkdownMath';
import { RightInspector } from '../components/inspector/RightInspector';
import { LineRow } from '../components/reader/LineRow';
import { CHAPTERS } from '../data/chapters';
import { StudyProvider, useStudy } from '../state/studyStore';
import { getAllChapterLines } from '../utils/chapterMetrics';
import { formatQaPairForCopy } from '../utils/clipboard';
import { parseInlineClozeSyntax, splitClozeSegments } from '../utils/cloze';
import { isLikelyLongAnnotation, normalizeLatexDelimiters } from '../utils/markdownMath';

describe('LaTeX delimiter normalization and long-annotation heuristics', () => {
  it('normalizes inline \\(...\\), display \\[...\\], and whitespace-padded $ \\rightarrow $ without touching code spans', () => {
    const input = [
      'Pathway: Glucose $ \\rightarrow $ Pyruvate and \\(\\text{ATP} \\rightarrow \\text{ADP}\\).',
      '\\[\\text{CO}_2 + \\text{H}_2\\text{O} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6\\]',
      'Inline code `\\(\\rightarrow\\)` and `$ \\rightarrow $` stay literal.',
      '```txt',
      '$ \\rightarrow $ inside fenced block',
      '```',
    ].join('\n');

    const normalized = normalizeLatexDelimiters(input);
    expect(normalized).toContain('$\\rightarrow$');
    expect(normalized).toContain('$\\text{ATP} \\rightarrow \\text{ADP}$');
    expect(normalized).toContain(
      '$$\n\\text{CO}_2 + \\text{H}_2\\text{O} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6\n$$',
    );
    expect(normalized).toContain('`\\(\\rightarrow\\)`');
    expect(normalized).toContain('`$ \\rightarrow $`');
    expect(normalized).toContain('$ \\rightarrow $ inside fenced block');
  });

  it('distinguishes short annotations (<=3 lines) from long annotations (>3 lines)', () => {
    expect(isLikelyLongAnnotation('Short single-line note')).toBe(false);
    expect(isLikelyLongAnnotation('Line 1\nLine 2\nLine 3')).toBe(false);
    expect(isLikelyLongAnnotation('Line 1\nLine 2\nLine 3\nLine 4')).toBe(true);
    expect(isLikelyLongAnnotation('A'.repeat(260))).toBe(true);
  });

  it('parses {{cloze}} around braced LaTeX and keeps math spans atomic during cloze splitting', () => {
    const parsed = parseInlineClozeSyntax(
      'Remember: {{RuBisCO}} catalyzes {{$\\text{CO}_2$}} fixation ($\\text{RuBP} \\rightarrow \\text{3-PGA}$).',
    );
    expect(parsed.clozeTerms).toEqual(['RuBisCO', '$\\text{CO}_2$']);
    expect(parsed.cleanText).toBe(
      'Remember: RuBisCO catalyzes $\\text{CO}_2$ fixation ($\\text{RuBP} \\rightarrow \\text{3-PGA}$).',
    );

    const segments = splitClozeSegments(
      'ATP yields $\\text{ATP} \\rightarrow \\text{ADP}$ in cytosol.',
      ['ATP'],
    );
    expect(segments.filter((s) => s.isCloze).map((s) => s.text)).toEqual(['ATP']);
    expect(segments.some((s) => !s.isCloze && s.text === '$\\text{ATP} \\rightarrow \\text{ADP}$')).toBe(
      true,
    );
  });
});

describe('MarkdownMath rendering with KaTeX and Cloze Mode', () => {
  it('renders Markdown formatting, GFM tables, and LaTeX $\\rightarrow$ via KaTeX', () => {
    const md = [
      '### Verbatim NCERT Fact',
      '**Light reaction**: $\\text{H}_2\\text{O} \\rightarrow 2\\text{H}^+ + [O] + 2e^-$',
      '',
      '- **Step 1**: Photolysis $ \\rightarrow $ releases $\\text{O}_2$',
      '- **Step 2**: \\(\\text{ADP} + \\text{P}_i \\rightarrow \\text{ATP}\\)',
      '',
      '$$\\text{6CO}_2 + \\text{12H}_2\\text{O} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6$$',
      '',
      '| Stage | Site |',
      '| --- | --- |',
      '| Light | Thylakoid |',
    ].join('\n');

    const { container } = render(<MarkdownMath content={md} />);

    expect(container.querySelector('h3')?.textContent).toBe('Verbatim NCERT Fact');
    expect(container.querySelector('strong')?.textContent).toBe('Light reaction');
    expect(container.querySelectorAll('ul li').length).toBe(2);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('.katex-display')).toBeInTheDocument();

    const katexNodes = container.querySelectorAll('.katex');
    expect(katexNodes.length).toBeGreaterThanOrEqual(5);
    const katexHtmlText = Array.from(container.querySelectorAll('.katex-html'))
      .map((el) => el.textContent ?? '')
      .join(' ');
    expect(katexHtmlText).toContain('→');
    expect(container.textContent).not.toContain('$\\rightarrow$');
    expect(katexHtmlText).not.toContain('\\rightarrow');
  });

  it('masks plain-text and inline-math cloze terms cleanly while preserving Markdown lists and non-cloze math', () => {
    const text = [
      '- **Malonate** competitively inhibits succinic dehydrogenase',
      '- Reaction: $\\text{Succinate} \\rightarrow \\text{Fumarate}$ produces $\\text{FADH}_2$',
    ].join('\n');

    const { container } = render(
      <MarkdownMath
        content={text}
        clozeTerms={['Malonate', '$\\text{FADH}_2$']}
        clozeEnabled
      />,
    );

    expect(container.querySelectorAll('ul li').length).toBe(2);
    const blanks = container.querySelectorAll('.cloze-blank');
    expect(blanks.length).toBe(2);
    expect(blanks[0].textContent).toBe('Malonate');
    expect(blanks[1].querySelector('.katex')).toBeInTheDocument();

    // Non-cloze reaction arrow remains outside cloze blanks and rendered via KaTeX
    expect(container.querySelectorAll('.katex').length).toBe(2);

    // Clicking a blank reveals it
    expect(blanks[0]).not.toHaveClass('revealed');
    fireEvent.click(blanks[0]);
    expect(blanks[0]).toHaveClass('revealed');
  });
});

describe('Collapsible custom line tags and pinned Gemini notes in LineRow', () => {
  it('auto-collapses long (>3 lines) custom lines & notes while keeping short ones uncollapsed', async () => {
    const ch08 = CHAPTERS[0];
    const line = getAllChapterLines(ch08)[0].line;

    function Harness() {
      const study = useStudy();
      return (
        <div>
          <div data-testid="sync-status">{study.syncStatus}</div>
          <button
            type="button"
            onClick={() => {
              study.addCustomLine({
                chapterId: ch08.id,
                parentLineId: line.id,
                text: 'Short custom tip: $\\text{A} \\rightarrow \\text{B}$',
                tags: ['Trap'],
                clozeTerms: [],
              });
              study.addCustomLine({
                chapterId: ch08.id,
                parentLineId: line.id,
                text: [
                  '**Long Pathway Breakdown**',
                  '- Step 1: Glucose $\\rightarrow$ Glucose-6-P',
                  '- Step 2: Fructose-6-P $\\rightarrow$ Fructose-1,6-BP',
                  '- Step 3: Pyruvate $\\rightarrow$ Acetyl CoA',
                  '- Step 4: Krebs cycle in mitochondrial matrix',
                ].join('\n'),
                tags: ['Concept'],
                clozeTerms: ['Pyruvate'],
              });
              study.addNote({
                chapterId: ch08.id,
                targetId: line.id,
                targetType: 'line',
                content: [
                  '### Gemini Breakdown',
                  '1. First detail $\\rightarrow$ ATP',
                  '2. Second detail',
                  '3. Third detail',
                  '4. Fourth detail',
                ].join('\n'),
                tags: ['Concept'],
                source: 'gemini',
                modelUsed: 'gemini-3.5-flash',
              });
            }}
          >
            seed-annotations
          </button>
          <LineRow chapterId={ch08.id} line={line} />
        </div>
      );
    }

    const { container } = render(
      <StudyProvider initialChapterId={ch08.id}>
        <Harness />
      </StudyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).not.toBe('loading');
    });

    fireEvent.click(screen.getByText('seed-annotations'));

    // 2 long items (long custom line + long Gemini note) get "Show more"; short custom line does NOT
    const toggles = screen.getAllByRole('button', { name: /Show more/i });
    expect(toggles).toHaveLength(2);
    expect(container.querySelectorAll('.annotation-collapsible-body.is-collapsed')).toHaveLength(2);
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');

    // Expand first long card -> removes is-collapsed and flips to "Show less"
    fireEvent.click(toggles[0]);
    expect(container.querySelectorAll('.annotation-collapsible-body.is-collapsed')).toHaveLength(1);
    const showLessBtn = screen.getByRole('button', { name: /Show less/i });
    expect(showLessBtn).toHaveAttribute('aria-expanded', 'true');

    // Collapse back
    fireEvent.click(showLessBtn);
    expect(container.querySelectorAll('.annotation-collapsible-body.is-collapsed')).toHaveLength(2);

    // KaTeX rendered inside annotations
    expect(container.querySelectorAll('.inline-annotations .katex').length).toBeGreaterThanOrEqual(4);
  });
});

describe('Ask Gemini chat tab Markdown/LaTeX rendering and copy actions', () => {
  const writeTextMock = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    writeTextMock.mockReset();
    writeTextMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  it('renders Gemini markdown + $\\rightarrow$ and copies user query, Gemini output, Q&A pair, and full thread', async () => {
    const ch08 = CHAPTERS[0];
    const firstLine = getAllChapterLines(ch08)[0].line;
    const userQuery = 'Explain the membrane transport arrow $\\text{High} \\rightarrow \\text{Low}$';
    const geminiReply = [
      '**Verbatim NCERT Fact**',
      '- Passive transport moves solutes: $\\text{High} \\rightarrow \\text{Low}$ concentration.',
      '- Active transport requires **ATP** ($\\text{ATP} \\rightarrow \\text{ADP} + \\text{P}_i$).',
    ].join('\n');

    function Harness() {
      const study = useStudy();
      return (
        <div>
          <div data-testid="sync-status">{study.syncStatus}</div>
          <button
            type="button"
            onClick={() => {
              study.selectLine(ch08.id, firstLine.id, 'ask');
              study.appendChatMessage(firstLine.id, { role: 'user', content: userQuery });
              study.appendChatMessage(firstLine.id, {
                role: 'assistant',
                content: geminiReply,
                modelUsed: 'gemini-3.5-flash',
              });
            }}
          >
            seed-chat
          </button>
          <RightInspector chapter={ch08} onOpenSettings={() => {}} />
        </div>
      );
    }

    const { container } = render(
      <StudyProvider initialChapterId={ch08.id}>
        <Harness />
      </StudyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).not.toBe('loading');
    });

    fireEvent.click(screen.getByText('seed-chat'));

    // Assistant bubble renders structured Markdown + KaTeX
    const assistantBubble = container.querySelector('.chat-bubble.assistant')!;
    expect(assistantBubble).toBeInTheDocument();
    expect(assistantBubble.querySelector('strong')?.textContent).toBe('Verbatim NCERT Fact');
    expect(assistantBubble.querySelectorAll('ul li')).toHaveLength(2);
    expect(assistantBubble.querySelectorAll('.katex').length).toBe(2);
    const assistantKatexHtml = Array.from(assistantBubble.querySelectorAll('.katex-html'))
      .map((el) => el.textContent ?? '')
      .join(' ');
    expect(assistantKatexHtml).toContain('→');
    expect(assistantBubble.textContent).not.toContain('$\\text{High}');

    // 1. Copy user query
    fireEvent.click(screen.getByRole('button', { name: 'Copy query' }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith(userQuery);
    });
    expect(screen.getByRole('button', { name: 'Copy query' }).textContent).toContain('Copied');

    // 2. Copy Gemini output
    fireEvent.click(screen.getByRole('button', { name: 'Copy Gemini output' }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith(geminiReply);
    });
    expect(screen.getByRole('button', { name: 'Copy Gemini output' }).textContent).toContain(
      'Copied',
    );

    // 3. Copy Q&A pair
    fireEvent.click(screen.getByRole('button', { name: 'Copy query and Gemini output' }));
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenLastCalledWith(formatQaPairForCopy(userQuery, geminiReply));
    });
    expect(
      screen.getByRole('button', { name: 'Copy query and Gemini output' }).textContent,
    ).toContain('Copied Q&A');

    // 4. Copy full thread
    fireEvent.click(screen.getByRole('button', { name: /Copy Thread/i }));
    await waitFor(() => {
      const lastArg = writeTextMock.mock.calls.at(-1)?.[0] ?? '';
      expect(lastArg).toContain(`**Q:** ${userQuery}`);
      expect(lastArg).toContain(`**A:** ${geminiReply}`);
    });
  });
});
