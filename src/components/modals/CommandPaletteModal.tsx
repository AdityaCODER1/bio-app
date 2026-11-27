import { useMemo, useState } from 'react';
import { Highlighter, Search, X } from 'lucide-react';
import { CHAPTERS } from '../../data/chapters';
import { useStudy } from '../../state/studyStore';
import {
  LINE_HIGHLIGHT_META,
  type LineHighlightTier,
} from '../../types/study';
import {
  createEmptyHighlightCounts,
  getAllChapterLines,
  getResolvedVaultItems,
} from '../../utils/chapterMetrics';

type PaletteHighlightFilter = 'none' | 'any' | LineHighlightTier;

const PALETTE_TIER_CHIPS: LineHighlightTier[] = ['trap', 'volatile', 'pyq', 'important'];

interface SearchHit {
  kind: 'line' | 'diagram' | 'vault';
  chapterId: string;
  chapterNumber: number;
  chapterLabel: string;
  id: string;
  title: string;
  snippet: string;
  highlightTier?: LineHighlightTier;
  lineNumber?: number;
}

export function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const { state, jumpToLine, setActiveChapterId, setActiveMode, selectDiagram } = useStudy();
  const [query, setQuery] = useState('');
  const [highlightFilter, setHighlightFilter] = useState<PaletteHighlightFilter>('none');

  const globalHighlightCounts = useMemo(() => {
    const countsByTier = createEmptyHighlightCounts();
    let total = 0;
    for (const ch of CHAPTERS) {
      for (const { line } of getAllChapterLines(ch)) {
        const tier = state.lineHighlights[line.id];
        if (tier) {
          countsByTier[tier]++;
          total++;
        }
      }
    }
    return { total, countsByTier };
  }, [state.lineHighlights]);

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();

    // Cross-chapter highlight browsing mode (works even with empty query)
    if (highlightFilter !== 'none') {
      const hits: SearchHit[] = [];
      for (const ch of CHAPTERS) {
        const chLabel = `Ch ${ch.chapterNumber} · ${ch.title}`;
        for (const { line, section } of getAllChapterLines(ch)) {
          const tier = state.lineHighlights[line.id];
          if (!tier) continue;
          if (highlightFilter !== 'any' && tier !== highlightFilter) continue;
          if (q.length > 0 && !line.text.toLowerCase().includes(q) && !section.title.toLowerCase().includes(q)) {
            continue;
          }
          hits.push({
            kind: 'line',
            chapterId: ch.id,
            chapterNumber: ch.chapterNumber,
            chapterLabel: chLabel,
            id: line.id,
            title: `Line #${line.lineNumber} · ${section.number} (p.${line.ncertPage})`,
            snippet: line.text,
            highlightTier: tier,
            lineNumber: line.lineNumber,
          });
        }
      }

      hits.sort((a, b) => {
        const pA = a.highlightTier ? LINE_HIGHLIGHT_META[a.highlightTier].priority : 0;
        const pB = b.highlightTier ? LINE_HIGHLIGHT_META[b.highlightTier].priority : 0;
        if (pB !== pA) return pB - pA;
        if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber;
        return (a.lineNumber ?? 0) - (b.lineNumber ?? 0);
      });

      return hits.slice(0, 60);
    }

    if (q.length < 2) return [];
    const hits: SearchHit[] = [];

    for (const ch of CHAPTERS) {
      const chLabel = `Ch ${ch.chapterNumber} · ${ch.title}`;

      for (const { line, section } of getAllChapterLines(ch)) {
        if (line.text.toLowerCase().includes(q)) {
          hits.push({
            kind: 'line',
            chapterId: ch.id,
            chapterNumber: ch.chapterNumber,
            chapterLabel: chLabel,
            id: line.id,
            title: `Line #${line.lineNumber} · ${section.number} (p.${line.ncertPage})`,
            snippet: line.text,
            highlightTier: state.lineHighlights[line.id],
            lineNumber: line.lineNumber,
          });
        }
        if (hits.length >= 28) break;
      }

      for (const diag of ch.diagrams) {
        const blob = `${diag.figureNumber} ${diag.caption} ${diag.infoList
          .map((i) => `${i.title} ${i.detail}`)
          .join(' ')}`.toLowerCase();
        if (blob.includes(q)) {
          hits.push({
            kind: 'diagram',
            chapterId: ch.id,
            chapterNumber: ch.chapterNumber,
            chapterLabel: chLabel,
            id: diag.id,
            title: `${diag.figureNumber} — ${diag.caption}`,
            snippet: diag.infoList[0]?.detail ?? diag.caption,
          });
        }
      }

      for (const v of getResolvedVaultItems(ch, state)) {
        if (
          v.prompt.toLowerCase().includes(q) ||
          v.detail.toLowerCase().includes(q)
        ) {
          hits.push({
            kind: 'vault',
            chapterId: ch.id,
            chapterNumber: ch.chapterNumber,
            chapterLabel: chLabel,
            id: v.sourceLineId || v.id,
            title: `Vault · ${v.prompt}`,
            snippet: v.detail,
          });
        }
      }
    }

    return hits.slice(0, 35);
  }, [highlightFilter, query, state]);

  const handleSelect = (hit: SearchHit) => {
    if (hit.kind === 'line') {
      jumpToLine(hit.chapterId, hit.id);
    } else if (hit.kind === 'diagram') {
      setActiveChapterId(hit.chapterId);
      setActiveMode('diagrams');
      selectDiagram(hit.chapterId, hit.id);
    } else {
      setActiveChapterId(hit.chapterId);
      setActiveMode('vault');
    }
    onClose();
  };

  const toggleChip = (next: Exclude<PaletteHighlightFilter, 'none'>) => {
    setHighlightFilter((prev) => (prev === next ? 'none' : next));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="macos-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Search NCERT chapters"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <Search size={16} color="var(--text-tertiary)" />
          <input
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 14.5,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            placeholder={
              highlightFilter === 'none'
                ? 'Search any NCERT sentence, scientist, enzyme, diagram, or trap…'
                : 'Filter highlighted lines across all chapters…'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) handleSelect(results[0]);
            }}
          />
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div className="spotlight-filter-bar" role="group" aria-label="Cross-chapter highlight filters">
          <button
            type="button"
            className={`filter-pill ${highlightFilter === 'any' ? 'active' : ''}`}
            onClick={() => toggleChip('any')}
          >
            <Highlighter size={12} />
            All Highlighted ({globalHighlightCounts.total})
          </button>
          {PALETTE_TIER_CHIPS.map((tier) => {
            const meta = LINE_HIGHLIGHT_META[tier];
            const count = globalHighlightCounts.countsByTier[tier];
            return (
              <button
                key={tier}
                type="button"
                className={`filter-pill hl-filter-${tier} ${highlightFilter === tier ? 'active' : ''}`}
                onClick={() => toggleChip(tier)}
              >
                <span className={`tier-dot tier-${tier}`} aria-hidden="true" />
                <span>{meta.shortLabel}</span>
                <span>({count})</span>
              </button>
            );
          })}
          {highlightFilter !== 'none' && (
            <button
              type="button"
              className="btn-ghost"
              style={{ marginLeft: 'auto', padding: '3px 7px', fontSize: 11.5 }}
              onClick={() => setHighlightFilter('none')}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="modal-body" style={{ padding: 10, maxHeight: '60vh' }}>
          {highlightFilter === 'none' && query.trim().length < 2 ? (
            <div className="empty-state" style={{ padding: '26px 12px' }}>
              <p style={{ margin: 0 }}>
                Type at least 2 characters — e.g. <code>zwitterionic</code>,{' '}
                <code>chiasmata</code>, <code>tonoplast</code>, or <code>RuBisCO</code> — or click a
                highlight chip above to browse across all chapters.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state" style={{ padding: '26px 12px' }}>
              <p style={{ margin: 0 }}>
                {highlightFilter === 'none'
                  ? 'No matches across loaded NCERT chapters.'
                  : 'No highlighted lines match this filter across loaded chapters yet.'}
              </p>
            </div>
          ) : (
            results.map((hit, idx) => (
              <button
                key={`${hit.kind}-${hit.id}-${idx}`}
                type="button"
                className="spotlight-result"
                onClick={() => handleSelect(hit)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 12.8 }}>{hit.title}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {hit.highlightTier && (
                      <span className={`micro-badge hl-tier-${hit.highlightTier}`}>
                        <span className={`tier-dot tier-${hit.highlightTier}`} aria-hidden="true" />
                        {LINE_HIGHLIGHT_META[hit.highlightTier].shortLabel}
                      </span>
                    )}
                    <span className="micro-badge">{hit.chapterLabel}</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {hit.snippet}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
