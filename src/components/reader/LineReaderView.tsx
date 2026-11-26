import { useMemo } from 'react';
import { CheckCheck, EyeOff } from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import type { ChapterData, ChapterSection } from '../../types/study';
import { computeChapterStats, findDiagramById } from '../../utils/chapterMetrics';
import { DiagramCard } from '../diagrams/DiagramCard';
import { ChapterVaultView } from '../vault/ChapterVaultView';
import { LineRow } from './LineRow';
import { EquationCard, NcertTableCard } from './NcertTableBlock';

function getSectionLineIds(section: ChapterSection): string[] {
  const ids: string[] = [];
  for (const block of section.blocks) {
    if (block.type === 'paragraph' || block.type === 'callout') {
      for (const line of block.lines) ids.push(line.id);
    }
  }
  return ids;
}

export function LineReaderView({ chapter }: { chapter: ChapterData }) {
  const { state, config, updateConfig, markLinesMastery } = useStudy();
  const stats = useMemo(() => computeChapterStats(chapter, state), [chapter, state]);

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

      {chapter.sections.map((section) => {
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
              {sectionLineIds.length > 0 && (
                <button
                  type="button"
                  className="section-action-btn"
                  onClick={() =>
                    markLinesMastery(sectionLineIds, allSectionMastered ? 'unread' : 'mastered')
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
                return (
                  <div
                    key={block.id}
                    className={`paragraph-group ${block.style ?? 'normal'}`}
                  >
                    {block.lines.map((line) => (
                      <LineRow key={line.id} chapterId={chapter.id} line={line} />
                    ))}
                  </div>
                );
              }

              if (block.type === 'callout') {
                return (
                  <div key={block.id} className="ncert-callout">
                    <div className="ncert-callout-header">
                      <span className="ncert-callout-title">{block.title}</span>
                      {block.badge && (
                        <span className="ncert-callout-badge">{block.badge}</span>
                      )}
                    </div>
                    <div className="paragraph-group" style={{ marginBottom: 0 }}>
                      {block.lines.map((line) => (
                        <LineRow key={line.id} chapterId={chapter.id} line={line} />
                      ))}
                    </div>
                  </div>
                );
              }

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
      })}

      {/* Embedded End-of-Chapter Categorized Important Info Vault */}
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
    </div>
  );
}
