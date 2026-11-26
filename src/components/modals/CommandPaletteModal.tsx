import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { CHAPTERS } from '../../data/chapters';
import { useStudy } from '../../state/studyStore';
import { getAllChapterLines, getResolvedVaultItems } from '../../utils/chapterMetrics';

interface SearchHit {
  kind: 'line' | 'diagram' | 'vault';
  chapterId: string;
  chapterLabel: string;
  id: string;
  title: string;
  snippet: string;
}

export function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const { state, jumpToLine, setActiveChapterId, setActiveMode, selectDiagram } = useStudy();
  const [query, setQuery] = useState('');

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const hits: SearchHit[] = [];

    for (const ch of CHAPTERS) {
      const chLabel = `Ch ${ch.chapterNumber} · ${ch.title}`;

      for (const { line, section } of getAllChapterLines(ch)) {
        if (line.text.toLowerCase().includes(q)) {
          hits.push({
            kind: 'line',
            chapterId: ch.id,
            chapterLabel: chLabel,
            id: line.id,
            title: `Line #${line.lineNumber} · ${section.number} (p.${line.ncertPage})`,
            snippet: line.text,
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
            chapterLabel: chLabel,
            id: v.sourceLineId || v.id,
            title: `Vault · ${v.prompt}`,
            snippet: v.detail,
          });
        }
      }
    }

    return hits.slice(0, 35);
  }, [query, state]);

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
            placeholder="Search any NCERT sentence, scientist, enzyme, diagram, or trap…"
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

        <div className="modal-body" style={{ padding: 10, maxHeight: '60vh' }}>
          {query.trim().length < 2 ? (
            <div className="empty-state" style={{ padding: '26px 12px' }}>
              <p style={{ margin: 0 }}>
                Type at least 2 characters — e.g. <code>zwitterionic</code>,{' '}
                <code>chiasmata</code>, <code>tonoplast</code>, or <code>RuBisCO</code>.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state" style={{ padding: '26px 12px' }}>
              <p style={{ margin: 0 }}>No matches across loaded NCERT chapters.</p>
            </div>
          ) : (
            results.map((hit, idx) => (
              <button
                key={`${hit.kind}-${hit.id}-${idx}`}
                type="button"
                className="spotlight-result"
                onClick={() => handleSelect(hit)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ fontSize: 12.8 }}>{hit.title}</strong>
                  <span className="micro-badge">{hit.chapterLabel}</span>
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
