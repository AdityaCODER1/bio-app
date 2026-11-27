import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, EyeOff, Highlighter, Sparkles, X } from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import {
  LINE_HIGHLIGHT_META,
  LINE_HIGHLIGHT_ORDER,
  type ChapterData,
  type ChapterSection,
  type LineHighlightTier,
} from '../../types/study';
import { computeChapterStats, findDiagramById } from '../../utils/chapterMetrics';
import { DiagramCard } from '../diagrams/DiagramCard';
import { ChapterVaultView } from '../vault/ChapterVaultView';
import { LineRow } from './LineRow';
import { EquationCard, NcertTableCard } from './NcertTableBlock';

type HighlightFilter = 'all' | 'any' | LineHighlightTier;

function getSectionLineIds(section: ChapterSection): string[] {
  const ids: string[] = [];
  for (const block of section.blocks) {
    if (block.type === 'paragraph' || block.type === 'callout') {
      for (const line of block.lines) ids.push(line.id);
    }
  }
  return ids;
}

function matchesHighlightFilter(
  filter: HighlightFilter,
  tier: LineHighlightTier | undefined,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'any') return Boolean(tier);
  return tier === filter;
}

export function LineReaderView({ chapter }: { chapter: ChapterData }) {
  const { state, config, updateConfig, markLinesMastery, jumpRequest } = useStudy();
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>('all');

  const stats = useMemo(() => computeChapterStats(chapter, state), [chapter, state]);

  // Reset highlight filter when changing chapters so users never land on an unexpectedly blank chapter
  useEffect(() => {
    setHighlightFilter('all');
  }, [chapter.id]);

  // Clear highlight filter if jumping to a line that would otherwise be hidden by the active filter
  useEffect(() => {
    if (!jumpRequest || highlightFilter === 'all') return;
    const tier = state.lineHighlights[jumpRequest.lineId];
    if (!matchesHighlightFilter(highlightFilter, tier)) {
      setHighlightFilter('all');
    }
  }, [jumpRequest, highlightFilter, state.lineHighlights]);

  const toggleHighlightFilter = (next: Exclude<HighlightFilter, 'all'>) => {
    setHighlightFilter((prev) => (prev === next ? 'all' : next));
  };

  const isFilteredByHighlight = highlightFilter !== 'all';

  const visibleSections = useMemo(() => {
    if (!isFilteredByHighlight) return chapter.sections;
    return chapter.sections.filter((section) =>
      section.blocks.some(
        (block) =>
          (block.type === 'paragraph' || block.type === 'callout') &&
          block.lines.some((line) =>
            matchesHighlightFilter(highlightFilter, state.lineHighlights[line.id]),
          ),
      ),
    );
  }, [chapter.sections, highlightFilter, isFilteredByHighlight, state.lineHighlights]);

  return (
    <div
      className={`center-container reader-font-${config.readerFont} reader-size-${config.fontSize}`}
    >
      <header className="chapter-hero">
        <div className="chapter-hero-eyebrow">
          <span className="hero-pill">Chapter {chapter.chapterNumber}</span>
          <span>{chapter.unitTitle}</span>
          <span>·</span>
          <span>
            NCERT pp. {chapter.ncertPageRange[0]}–{chapter.ncertPageRange[1]} ({chapter.edition})
          </span>
        </div>
        <h1>{chapter.title}</h1>
        <div className="chapter-hero-stats">
          <div className="stat-strip">
            <span>
              <strong>{stats.masteredLines}</strong> / {stats.totalLines} lines mastered (
              {stats.masteryPercent}%)
            </span>
            <span>
              <strong>{stats.highlightedLines}</strong> highlighted
            </span>
            <span>
              <strong>{stats.reviewLines}</strong> flagged
            </span>
            <span>
              <strong>{stats.customLineCount + stats.noteCount}</strong> notes & lines
            </span>
            <span>
              <strong>{stats.pinnedMcqCount}</strong> pinned MCQs
            </span>
          </div>

          <div className="reader-filter-bar">
            <button
              type="button"
              className={`filter-pill ${highlightFilter === 'any' ? 'active' : ''}`}
              onClick={() => toggleHighlightFilter('any')}
              title="Show only lines you highlighted in any tier"
            >
              <Highlighter size={12.5} />
              Highlighted ({stats.highlightedLines})
            </button>

            {LINE_HIGHLIGHT_ORDER.map((tier) => {
              const meta = LINE_HIGHLIGHT_META[tier];
              const count = stats.highlightCountsByTier[tier];
              const active = highlightFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  className={`filter-pill hl-filter-${tier} ${active ? 'active' : ''}`}
                  onClick={() => toggleHighlightFilter(tier)}
                  title={`Filter to ${meta.label} lines (${meta.description})`}
                >
                  <span className={`tier-dot tier-${tier}`} aria-hidden="true" />
                  <span>{meta.shortLabel}</span>
                  <span>({count})</span>
                </button>
              );
            })}

            {isFilteredByHighlight && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setHighlightFilter('all')}
                title="Show all NCERT lines"
              >
                <X size={12.5} />
                All Lines
              </button>
            )}

            <button
              type="button"
              className={`filter-pill ${config.showPresetHighYield ? 'active' : ''}`}
              onClick={() =>
                updateConfig({ showPresetHighYield: !config.showPresetHighYield })
              }
              title="Toggle preset NCERT High-Yield badges on or off globally"
            >
              <Sparkles size={12.5} />
              {config.showPresetHighYield ? 'High-Yield: On' : 'High-Yield: Off'}
            </button>

            <button
              type="button"
              className={`filter-pill ${config.showOnlyUnmastered ? 'active' : ''}`}
              onClick={() =>
                updateConfig({ showOnlyUnmastered: !config.showOnlyUnmastered })
              }
              title="Hide lines you already marked Mastered"
            >
              <EyeOff size={13} />
              {config.showOnlyUnmastered ? 'Hiding Mastered' : 'Hide Mastered'}
            </button>
          </div>
        </div>
      </header>

      {isFilteredByHighlight && visibleSections.length === 0 ? (
        <div className="empty-state">
          <Highlighter size={32} color="var(--text-tertiary)" />
          <h3>
            No{' '}
            {highlightFilter === 'any'
              ? 'highlighted'
              : LINE_HIGHLIGHT_META[highlightFilter].label}{' '}
            lines in Chapter {chapter.chapterNumber} yet
          </h3>
          <p style={{ maxWidth: 440, margin: 0 }}>
            Hover any sentence to click one of the 4 highlight dots, or select a line and press{' '}
            <code>1</code>–<code>4</code> (or <code>H</code> to cycle) to mark it.
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => setHighlightFilter('all')}
          >
            Show All Lines
          </button>
        </div>
      ) : (
        visibleSections.map((section) => {
          const sectionLineIds = getSectionLineIds(section);
          const allSectionMastered =
            sectionLineIds.length > 0 &&
            sectionLineIds.every((id) => state.lineMastery[id] === 'mastered');

          return (
            <section key={section.id} id={`sec-${section.id}`} className="chapter-section">
              <div className="section-header-row">
                <h2 className={`section-heading level-${section.level}`}>
                  <span className="section-num-tag">{section.number}</span>
                  <span>{section.title}</span>
                </h2>
                {sectionLineIds.length > 0 && !isFilteredByHighlight && (
                  <button
                    type="button"
                    className="section-action-btn"
                    onClick={() =>
                      markLinesMastery(
                        sectionLineIds,
                        allSectionMastered ? 'unread' : 'mastered',
                      )
                    }
                  >
                    <CheckCheck
                      size={12}
                      style={{ marginRight: 5, verticalAlign: '-1px' }}
                    />
                    {allSectionMastered ? 'Reset Section' : 'Master Section'}
                  </button>
                )}
              </div>

              {section.blocks.map((block) => {
                if (block.type === 'paragraph') {
                  const linesToRender = isFilteredByHighlight
                    ? block.lines.filter((line) =>
                        matchesHighlightFilter(highlightFilter, state.lineHighlights[line.id]),
                      )
                    : block.lines;
                  if (linesToRender.length === 0) return null;
                  return (
                    <div
                      key={block.id}
                      className={`paragraph-group ${block.style ?? 'normal'}`}
                    >
                      {linesToRender.map((line) => (
                        <LineRow key={line.id} chapterId={chapter.id} line={line} />
                      ))}
                    </div>
                  );
                }

                if (block.type === 'callout') {
                  const linesToRender = isFilteredByHighlight
                    ? block.lines.filter((line) =>
                        matchesHighlightFilter(highlightFilter, state.lineHighlights[line.id]),
                      )
                    : block.lines;
                  if (linesToRender.length === 0) return null;
                  return (
                    <div key={block.id} className="ncert-callout">
                      <div className="ncert-callout-header">
                        <span className="ncert-callout-title">{block.title}</span>
                        {block.badge && (
                          <span className="ncert-callout-badge">{block.badge}</span>
                        )}
                      </div>
                      <div className="paragraph-group" style={{ marginBottom: 0 }}>
                        {linesToRender.map((line) => (
                          <LineRow key={line.id} chapterId={chapter.id} line={line} />
                        ))}
                      </div>
                    </div>
                  );
                }

                if (isFilteredByHighlight) return null;

                if (block.type === 'table') {
                  return <NcertTableCard key={block.id} block={block} />;
                }

                if (block.type === 'equation') {
                  return <EquationCard key={block.id} block={block} />;
                }

                if (block.type === 'diagram') {
                  const diagram = findDiagramById(chapter, block.diagramId);
                  if (!diagram) return null;
                  return (
                    <DiagramCard
                      key={diagram.id}
                      chapterId={chapter.id}
                      diagram={diagram}
                    />
                  );
                }

                return null;
              })}
            </section>
          );
        })
      )}

      {/* Embedded End-of-Chapter Categorized Important Info Vault */}
      {!isFilteredByHighlight && (
        <div
          id="chapter-end-vault"
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <ChapterVaultView chapter={chapter} embedded />
        </div>
      )}
    </div>
  );
}
