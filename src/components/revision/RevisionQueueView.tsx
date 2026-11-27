import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import {
  LINE_HIGHLIGHT_META,
  LINE_HIGHLIGHT_ORDER,
  type ChapterData,
  type SavedMcq,
} from '../../types/study';
import {
  computeChapterStats,
  getAllChapterLines,
  isClozeActiveForLine,
} from '../../utils/chapterMetrics';
import { parseInlineClozeSyntax } from '../../utils/cloze';
import { CollapsibleAnnotationBody } from '../common/CollapsibleAnnotationBody';
import { MarkdownMath } from '../common/MarkdownMath';
import { ClozeText } from '../reader/ClozeText';

type QueueFilter = 'all' | 'lines' | 'custom_lines' | 'notes' | 'mcqs';

function PinnedMcqPracticeCard({
  mcq,
  onAttempt,
  onMaster,
  onDelete,
  onJump,
}: {
  mcq: SavedMcq;
  onAttempt: (correct: boolean) => void;
  onMaster: () => void;
  onDelete: () => void;
  onJump?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="mcq-card">
      <div className="revise-item-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="revise-type-chip mcq">PINNED MCQ</span>
          <span className="micro-badge">{mcq.style.replace('_', ' ')}</span>
          {mcq.attempts > 0 && (
            <span className="micro-badge">
              {mcq.correctAttempts}/{mcq.attempts} correct
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onJump && (
            <button type="button" className="btn-ghost" onClick={onJump}>
              <ArrowUpRight size={13} /> Line
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={onMaster}
            style={{ color: 'var(--accent-green)' }}
          >
            <Check size={13} /> Mastered
          </button>
          <button
            type="button"
            className="mini-action-btn btn-danger-ghost"
            title="Delete MCQ"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {mcq.assertion && (
        <div className="mcq-statement-box">
          <div>
            <strong>Assertion (A):</strong> <MarkdownMath content={mcq.assertion} inline />
          </div>
          <div>
            <strong>Reason (R):</strong> <MarkdownMath content={mcq.reason ?? ''} inline />
          </div>
        </div>
      )}
      {mcq.statement1 && (
        <div className="mcq-statement-box">
          <div>
            <strong>Statement I:</strong> <MarkdownMath content={mcq.statement1} inline />
          </div>
          <div>
            <strong>Statement II:</strong> <MarkdownMath content={mcq.statement2 ?? ''} inline />
          </div>
        </div>
      )}

      <div className="mcq-question">
        <MarkdownMath content={mcq.question} />
      </div>

      <div className="mcq-options">
        {mcq.options.map((opt, idx) => {
          let cls = 'mcq-option-btn';
          if (picked !== null) {
            if (idx === mcq.correctIndex) cls += ' correct';
            else if (idx === picked) cls += ' wrong';
          }
          return (
            <button
              key={idx}
              type="button"
              className={cls}
              disabled={picked !== null}
              onClick={() => {
                setPicked(idx);
                onAttempt(idx === mcq.correctIndex);
              }}
            >
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{letters[idx]}.</strong>
              <MarkdownMath content={opt} inline />
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mcq-explanation">
          <MarkdownMath content={mcq.explanation} />
          <div className="mcq-proof">
            NCERT anchor: “<MarkdownMath content={mcq.ncertProof} inline />”
          </div>
          <div style={{ marginTop: 6 }}>
            <button type="button" className="btn-ghost" onClick={() => setPicked(null)}>
              <RotateCcw size={12} /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RevisionQueueView({ chapter }: { chapter: ChapterData }) {
  const {
    state,
    config,
    setLineMastery,
    setLineHighlight,
    toggleLineHighlight,
    updateCustomLine,
    deleteCustomLine,
    updateNote,
    deleteNote,
    updatePinnedMcq,
    recordMcqAttempt,
    deletePinnedMcq,
    jumpToLine,
  } = useStudy();

  const [filter, setFilter] = useState<QueueFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const allLines = useMemo(() => getAllChapterLines(chapter), [chapter]);
  const lineLookup = useMemo(
    () => new Map(allLines.map((item) => [item.line.id, item])),
    [allLines],
  );
  const stats = useMemo(() => computeChapterStats(chapter, state), [chapter, state]);

  const flaggedLines = useMemo(
    () =>
      allLines
        .filter(({ line }) => state.lineMastery[line.id] === 'review')
        .sort((a, b) => {
          const tierA = state.lineHighlights[a.line.id];
          const tierB = state.lineHighlights[b.line.id];
          const pA = tierA ? LINE_HIGHLIGHT_META[tierA].priority : 0;
          const pB = tierB ? LINE_HIGHLIGHT_META[tierB].priority : 0;
          if (pB !== pA) return pB - pA;
          return a.line.lineNumber - b.line.lineNumber;
        }),
    [allLines, state.lineHighlights, state.lineMastery],
  );

  const unmasteredCustomLines = useMemo(() => {
    const out: Array<{ parentLineId: string; item: (typeof state.customLines)[string][number] }> = [];
    for (const { line } of allLines) {
      for (const cl of state.customLines[line.id] ?? []) {
        if (cl.status !== 'mastered') out.push({ parentLineId: line.id, item: cl });
      }
    }
    return out;
  }, [allLines, state.customLines]);

  const unmasteredNotes = useMemo(() => {
    const targetIds = [
      ...allLines.map((l) => l.line.id),
      ...chapter.diagrams.map((d) => d.id),
    ];
    const out: Array<{ targetId: string; note: (typeof state.lineNotes)[string][number] }> = [];
    for (const tid of targetIds) {
      for (const note of state.lineNotes[tid] ?? []) {
        if (note.status !== 'mastered') out.push({ targetId: tid, note });
      }
    }
    return out;
  }, [allLines, chapter.diagrams, state.lineNotes]);

  const unmasteredMcqs = useMemo(() => {
    const targetIds = [
      ...allLines.map((l) => l.line.id),
      ...chapter.diagrams.map((d) => d.id),
    ];
    const out: SavedMcq[] = [];
    for (const tid of targetIds) {
      for (const mcq of state.pinnedMcqs[tid] ?? []) {
        if (mcq.status !== 'mastered') out.push(mcq);
      }
    }
    return out;
  }, [allLines, chapter.diagrams, state.pinnedMcqs]);

  const totalPending =
    flaggedLines.length +
    unmasteredCustomLines.length +
    unmasteredNotes.length +
    unmasteredMcqs.length;

  return (
    <div className="center-container wide">
      <div className="chapter-hero">
        <div className="chapter-hero-eyebrow">
          <span className="hero-pill">Revise Until Mastered</span>
          <span>Chapter {chapter.chapterNumber}</span>
        </div>
        <h1>{chapter.title} — Active Revision Queue</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
          Every flagged NCERT line, custom study line, tagged note, and pinned MCQ stays here for
          editing, drilling, or deletion until you graduate it to <strong>Mastered</strong>.
        </p>
      </div>

      <div className="revise-summary-strip">
        <div className="revise-stat-box">
          <div className="revise-stat-num" style={{ color: 'var(--accent-amber)' }}>
            {flaggedLines.length}
          </div>
          <div className="revise-stat-label">Flagged NCERT Lines</div>
        </div>
        <div className="revise-stat-box">
          <div className="revise-stat-num" style={{ color: 'var(--accent-teal)' }}>
            {unmasteredCustomLines.length}
          </div>
          <div className="revise-stat-label">Custom Lines to Revise</div>
        </div>
        <div className="revise-stat-box">
          <div className="revise-stat-num" style={{ color: 'var(--accent-blue)' }}>
            {unmasteredNotes.length}
          </div>
          <div className="revise-stat-label">Tagged Notes & AI Pins</div>
        </div>
        <div className="revise-stat-box">
          <div className="revise-stat-num" style={{ color: 'var(--accent-green)' }}>
            {unmasteredMcqs.length}
          </div>
          <div className="revise-stat-label">Pinned MCQs to Drill</div>
        </div>
      </div>

      <div className="vault-filter-pills">
        <button
          type="button"
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Pending ({totalPending})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'lines' ? 'active' : ''}`}
          onClick={() => setFilter('lines')}
        >
          NCERT Lines ({flaggedLines.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'custom_lines' ? 'active' : ''}`}
          onClick={() => setFilter('custom_lines')}
        >
          Custom Lines ({unmasteredCustomLines.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'notes' ? 'active' : ''}`}
          onClick={() => setFilter('notes')}
        >
          Notes ({unmasteredNotes.length})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'mcqs' ? 'active' : ''}`}
          onClick={() => setFilter('mcqs')}
        >
          Pinned MCQs ({unmasteredMcqs.length})
        </button>
      </div>

      {totalPending === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={36} color="var(--accent-green)" />
          <h3>Revision Queue Clear ({stats.masteryPercent}% chapter mastered)</h3>
          <p style={{ maxWidth: 460 }}>
            Flag tricky NCERT sentences (press <code>R</code>), insert custom lines or tagged
            notes, or pin Gemini MCQs while studying to build your targeted revision drill here.
          </p>
        </div>
      ) : (
        <>
          {(filter === 'all' || filter === 'lines') &&
            flaggedLines.map(({ line, section }) => {
              const highlight = state.lineHighlights[line.id];
              const clozeEnabledForLine = isClozeActiveForLine(
                config.clozeMode,
                config.clozeScope,
                highlight,
              );
              return (
                <div key={line.id} className="revise-item-card">
                  <div className="revise-item-top">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}>
                      <span className="revise-type-chip line">
                        NCERT LINE #{line.lineNumber}
                      </span>
                      <span className="micro-badge">
                        {section.number} · p.{line.ncertPage}
                      </span>
                      {highlight && (
                        <span className={`micro-badge hl-tier-${highlight}`}>
                          <span className={`tier-dot tier-${highlight}`} aria-hidden="true" />
                          <span>{LINE_HIGHLIGHT_META[highlight].label}</span>
                          <button
                            type="button"
                            className="micro-badge-dismiss"
                            title="Remove highlight"
                            aria-label={`Remove ${LINE_HIGHLIGHT_META[highlight].label} highlight`}
                            onClick={() => setLineHighlight(line.id, null)}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="highlight-swatch-bar" role="group" aria-label="Line highlight tier">
                        {LINE_HIGHLIGHT_ORDER.map((tier) => {
                          const meta = LINE_HIGHLIGHT_META[tier];
                          const isActive = highlight === tier;
                          return (
                            <button
                              key={tier}
                              type="button"
                              className={`highlight-dot-btn tier-${tier} ${isActive ? 'active' : ''}`}
                              title={
                                isActive
                                  ? `Remove ${meta.label} highlight`
                                  : `Highlight as ${meta.label} — ${meta.description}`
                              }
                              aria-label={`${isActive ? 'Remove' : 'Set'} ${meta.label} highlight`}
                              aria-pressed={isActive}
                              onClick={() => toggleLineHighlight(line.id, tier)}
                            />
                          );
                        })}
                        {highlight && (
                          <button
                            type="button"
                            className="highlight-clear-btn"
                            title="Clear highlight"
                            aria-label="Clear highlight"
                            onClick={() => setLineHighlight(line.id, null)}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => jumpToLine(chapter.id, line.id)}
                      >
                        <ArrowUpRight size={13} /> Open in Reader
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ color: 'var(--accent-green)' }}
                        onClick={() => setLineMastery(line.id, 'mastered')}
                      >
                        <Check size={13} /> Mark Mastered
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16.5,
                      lineHeight: 1.65,
                    }}
                  >
                    {highlight ? (
                      <span className={`line-marker hl-${highlight}`}>
                        <ClozeText
                          text={line.text}
                          clozeTerms={line.clozeTerms}
                          enabled={clozeEnabledForLine}
                        />
                      </span>
                    ) : (
                      <ClozeText
                        text={line.text}
                        clozeTerms={line.clozeTerms}
                        enabled={clozeEnabledForLine}
                      />
                    )}
                  </div>
                </div>
              );
            })}

          {(filter === 'all' || filter === 'custom_lines') &&
            unmasteredCustomLines.map(({ parentLineId, item }) => {
              const parent = lineLookup.get(parentLineId);
              return (
                <div key={item.id} className="revise-item-card">
                  <div className="revise-item-top">
                    <div className="annotation-tags">
                      <span className="revise-type-chip custom_line">CUSTOM LINE</span>
                      {parent && (
                        <span className="micro-badge">
                          Under Line #{parent.line.lineNumber}
                        </span>
                      )}
                      {item.tags.map((t) => (
                        <span key={t} className={`tag-pill ${t}`}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => jumpToLine(chapter.id, parentLineId)}
                      >
                        <ArrowUpRight size={13} /> Context
                      </button>
                      <button
                        type="button"
                        className="mini-action-btn"
                        title="Edit"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditText(item.text);
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ color: 'var(--accent-green)' }}
                        onClick={() =>
                          updateCustomLine(parentLineId, item.id, { status: 'mastered' })
                        }
                      >
                        <Check size={13} /> Mastered
                      </button>
                      <button
                        type="button"
                        className="mini-action-btn btn-danger-ghost"
                        title="Delete"
                        onClick={() => deleteCustomLine(parentLineId, item.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        className="composer-textarea"
                        rows={2}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            const parsed = parseInlineClozeSyntax(editText.trim());
                            updateCustomLine(parentLineId, item.id, {
                              text: parsed.cleanText,
                              clozeTerms:
                                parsed.clozeTerms.length > 0
                                  ? parsed.clozeTerms
                                  : item.clozeTerms,
                            });
                            setEditingId(null);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CollapsibleAnnotationBody
                      rawText={item.text}
                      className="annotation-body revision-custom-body"
                    >
                      <ClozeText
                        text={item.text}
                        clozeTerms={item.clozeTerms}
                        enabled={config.clozeMode}
                        renderMarkdownMath
                      />
                    </CollapsibleAnnotationBody>
                  )}
                </div>
              );
            })}

          {(filter === 'all' || filter === 'notes') &&
            unmasteredNotes.map(({ targetId, note }) => {
              const parent = lineLookup.get(targetId);
              return (
                <div key={note.id} className="revise-item-card">
                  <div className="revise-item-top">
                    <div className="annotation-tags">
                      <span className="revise-type-chip note">
                        {note.source === 'gemini' ? 'GEMINI PIN' : 'TAGGED NOTE'}
                      </span>
                      {parent && (
                        <span className="micro-badge">
                          Line #{parent.line.lineNumber}
                        </span>
                      )}
                      {note.tags.map((t) => (
                        <span key={t} className={`tag-pill ${t}`}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {parent && (
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => jumpToLine(chapter.id, targetId)}
                        >
                          <ArrowUpRight size={13} /> Line
                        </button>
                      )}
                      <button
                        type="button"
                        className="mini-action-btn"
                        title="Edit note"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.content);
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ color: 'var(--accent-green)' }}
                        onClick={() => updateNote(targetId, note.id, { status: 'mastered' })}
                      >
                        <Check size={13} /> Mastered
                      </button>
                      <button
                        type="button"
                        className="mini-action-btn btn-danger-ghost"
                        title="Delete note"
                        onClick={() => deleteNote(targetId, note.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {editingId === note.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        className="composer-textarea"
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            updateNote(targetId, note.id, { content: editText.trim() });
                            setEditingId(null);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CollapsibleAnnotationBody rawText={note.content} className="annotation-body">
                      <MarkdownMath content={note.content} />
                    </CollapsibleAnnotationBody>
                  )}
                </div>
              );
            })}

          {(filter === 'all' || filter === 'mcqs') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unmasteredMcqs.map((mcq) => (
                <PinnedMcqPracticeCard
                  key={mcq.id}
                  mcq={mcq}
                  onAttempt={(correct) => recordMcqAttempt(mcq.targetId, mcq.id, correct)}
                  onMaster={() =>
                    updatePinnedMcq(mcq.targetId, mcq.id, { status: 'mastered' })
                  }
                  onDelete={() => deletePinnedMcq(mcq.targetId, mcq.id)}
                  onJump={
                    mcq.targetType === 'line'
                      ? () => jumpToLine(chapter.id, mcq.targetId)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
