import { useState } from 'react';
import {
  Check,
  Edit3,
  FileText,
  Flag,
  HelpCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import {
  LINE_HIGHLIGHT_META,
  LINE_HIGHLIGHT_ORDER,
  NOTE_TAGS,
  type NcertLine,
  type NoteTag,
} from '../../types/study';
import { isClozeActiveForLine } from '../../utils/chapterMetrics';
import { parseInlineClozeSyntax } from '../../utils/cloze';
import { ClozeText } from './ClozeText';

interface LineRowProps {
  chapterId: string;
  line: NcertLine;
}

export function LineRow({ chapterId, line }: LineRowProps) {
  const {
    state,
    config,
    activeSelection,
    selectLine,
    cycleLineMastery,
    setLineMastery,
    setLineHighlight,
    toggleLineHighlight,
    dismissPresetHighYield,
    restorePresetHighYield,
    addCustomLine,
    updateCustomLine,
    deleteCustomLine,
    addNote,
    updateNote,
    deleteNote,
  } = useStudy();

  const [composerMode, setComposerMode] = useState<'none' | 'custom_line' | 'note'>('none');
  const [draftText, setDraftText] = useState('');
  const [draftTags, setDraftTags] = useState<NoteTag[]>(['Trap']);

  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editingCustomText, setEditingCustomText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const isSelected = activeSelection?.type === 'line' && activeSelection.id === line.id;
  const status = state.lineMastery[line.id] ?? 'unread';
  const highlight = state.lineHighlights[line.id];
  const isHighYieldDismissed = state.dismissedHighYieldIds.includes(line.id);
  const showHighYieldBadge =
    Boolean(line.isHighYield) && config.showPresetHighYield && !isHighYieldDismissed;
  const canRestoreHighYield =
    Boolean(line.isHighYield) && config.showPresetHighYield && isHighYieldDismissed;

  const customLines = state.customLines[line.id] ?? [];
  const notes = state.lineNotes[line.id] ?? [];
  const pinnedMcqs = state.pinnedMcqs[line.id] ?? [];

  const clozeEnabledForLine = isClozeActiveForLine(
    config.clozeMode,
    config.clozeScope,
    highlight,
  );

  if (
    config.showOnlyUnmastered &&
    status === 'mastered' &&
    customLines.every((c) => c.status === 'mastered') &&
    notes.every((n) => n.status === 'mastered')
  ) {
    return null;
  }

  const toggleTag = (tag: NoteTag) => {
    setDraftTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSaveDraft = () => {
    const trimmed = draftText.trim();
    if (!trimmed) return;
    if (composerMode === 'custom_line') {
      const { cleanText, clozeTerms } = parseInlineClozeSyntax(trimmed);
      addCustomLine({
        chapterId,
        parentLineId: line.id,
        text: cleanText,
        tags: draftTags,
        clozeTerms,
      });
    } else if (composerMode === 'note') {
      addNote({
        chapterId,
        targetId: line.id,
        targetType: 'line',
        content: trimmed,
        tags: draftTags,
        source: 'user',
      });
    }
    setDraftText('');
    setComposerMode('none');
  };

  const hasAnnotations = customLines.length > 0 || notes.length > 0 || composerMode !== 'none';
  const hasBadges =
    Boolean(highlight) ||
    showHighYieldBadge ||
    customLines.length > 0 ||
    notes.length > 0 ||
    pinnedMcqs.length > 0;

  return (
    <div
      id={`line-${line.id}`}
      data-line-id={line.id}
      data-highlight-tier={highlight ?? ''}
      className={`line-row-wrap ${isSelected ? 'selected' : ''} status-${status} ${
        highlight ? `has-highlight highlight-${highlight}` : ''
      }`}
    >
      <div
        className="line-row"
        onClick={() => selectLine(chapterId, line.id)}
      >
        <div className="line-gutter">
          <button
            type="button"
            className={`line-status-btn ${status}`}
            title={`Status: ${status} (click to cycle Unread → Needs Revision → Mastered)`}
            onClick={(e) => {
              e.stopPropagation();
              cycleLineMastery(line.id);
            }}
          >
            {status === 'mastered' ? (
              <Check size={11} strokeWidth={3} />
            ) : status === 'review' ? (
              <Flag size={9} />
            ) : null}
          </button>
          <span className="line-num">{String(line.lineNumber).padStart(3, '0')}</span>
        </div>

        <div className="line-body">
          <div className="line-text-content">
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

          {hasBadges && (
            <div className="line-meta-badges">
              {highlight && (
                <span className={`micro-badge hl-tier-${highlight}`}>
                  <span className={`tier-dot tier-${highlight}`} aria-hidden="true" />
                  <span>{LINE_HIGHLIGHT_META[highlight].label}</span>
                  <button
                    type="button"
                    className="micro-badge-dismiss"
                    title="Remove highlight (0)"
                    aria-label={`Remove ${LINE_HIGHLIGHT_META[highlight].label} highlight`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLineHighlight(line.id, null);
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {showHighYieldBadge && (
                <span className="micro-badge high-yield">
                  <span>High-Yield</span>
                  <button
                    type="button"
                    className="micro-badge-dismiss"
                    title="Dismiss preset High-Yield badge on this line"
                    aria-label="Dismiss preset High-Yield badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissPresetHighYield(line.id);
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {customLines.length > 0 && (
                <span className="micro-badge has-notes">
                  +{customLines.length} custom line{customLines.length > 1 ? 's' : ''}
                </span>
              )}
              {notes.length > 0 && (
                <span className="micro-badge has-notes">
                  {notes.length} note{notes.length > 1 ? 's' : ''}
                </span>
              )}
              {pinnedMcqs.length > 0 && (
                <button
                  type="button"
                  className="micro-badge has-mcqs"
                  style={{ border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectLine(chapterId, line.id, 'mcq');
                  }}
                >
                  {pinnedMcqs.length} pinned MCQ{pinnedMcqs.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="line-quick-actions" onClick={(e) => e.stopPropagation()}>
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
                      ? `Remove ${meta.label} highlight (${meta.shortcutKey} or 0)`
                      : `Highlight as ${meta.label} (${meta.shortcutKey}) — ${meta.description}`
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
                title="Clear highlight (0)"
                aria-label="Clear highlight"
                onClick={() => setLineHighlight(line.id, null)}
              >
                <X size={10} />
              </button>
            )}
          </div>
          {canRestoreHighYield && (
            <button
              type="button"
              className="mini-action-btn"
              title="Restore preset High-Yield badge"
              aria-label="Restore preset High-Yield badge"
              onClick={() => restorePresetHighYield(line.id)}
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            type="button"
            className={`mini-action-btn ${status === 'mastered' ? 'active' : ''}`}
            title="Mark Mastered (M)"
            onClick={() => setLineMastery(line.id, status === 'mastered' ? 'unread' : 'mastered')}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            className={`mini-action-btn ${status === 'review' ? 'active' : ''}`}
            title="Flag for Revision Queue (R)"
            onClick={() => setLineMastery(line.id, status === 'review' ? 'unread' : 'review')}
          >
            <Flag size={13} />
          </button>
          <button
            type="button"
            className="mini-action-btn"
            title="Add Custom Line or Tagged Note (N)"
            onClick={() =>
              setComposerMode((prev) => (prev === 'none' ? 'custom_line' : 'none'))
            }
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="mini-action-btn"
            title="Ask Gemini about this line"
            onClick={() => selectLine(chapterId, line.id, 'ask')}
          >
            <Sparkles size={14} />
          </button>
          <button
            type="button"
            className="mini-action-btn"
            title="Generate NEET MCQ for this line (Q)"
            onClick={() => selectLine(chapterId, line.id, 'mcq')}
          >
            <HelpCircle size={14} />
          </button>
          <button
            type="button"
            className="mini-action-btn"
            title={`Peek Original NCERT Page ${line.ncertPage} (P)`}
            onClick={() => selectLine(chapterId, line.id, 'pdf')}
          >
            <FileText size={13} />
          </button>
        </div>
      </div>

      {hasAnnotations && (
        <div className="inline-annotations" onClick={(e) => e.stopPropagation()}>
          {customLines.map((cl) => (
            <div key={cl.id} className="custom-line-card">
              <div className="annotation-header">
                <div className="annotation-tags">
                  <span className="revise-type-chip custom_line">CUSTOM LINE</span>
                  {cl.tags.map((t) => (
                    <span key={t} className={`tag-pill ${t}`}>
                      #{t}
                    </span>
                  ))}
                  {cl.status === 'mastered' && (
                    <span className="tag-pill Mnemonic">Mastered</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    className="mini-action-btn"
                    title={cl.status === 'mastered' ? 'Move back to Revision' : 'Mark Mastered'}
                    onClick={() =>
                      updateCustomLine(line.id, cl.id, {
                        status: cl.status === 'mastered' ? 'review' : 'mastered',
                      })
                    }
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn"
                    title="Edit custom line"
                    onClick={() => {
                      setEditingCustomId(cl.id);
                      setEditingCustomText(cl.text);
                    }}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn btn-danger-ghost"
                    title="Delete custom line"
                    onClick={() => deleteCustomLine(line.id, cl.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {editingCustomId === cl.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea
                    className="composer-textarea"
                    rows={2}
                    value={editingCustomText}
                    onChange={(e) => setEditingCustomText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingCustomId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        const parsed = parseInlineClozeSyntax(editingCustomText);
                        updateCustomLine(line.id, cl.id, {
                          text: parsed.cleanText,
                          clozeTerms:
                            parsed.clozeTerms.length > 0 ? parsed.clozeTerms : cl.clozeTerms,
                        });
                        setEditingCustomId(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`annotation-body ${cl.status === 'mastered' ? 'mastered' : ''}`}>
                  <ClozeText
                    text={cl.text}
                    clozeTerms={cl.clozeTerms}
                    enabled={config.clozeMode}
                  />
                </div>
              )}
            </div>
          ))}

          {notes.map((note) => (
            <div
              key={note.id}
              className={`user-note-card ${note.source === 'gemini' ? 'from-gemini' : ''}`}
            >
              <div className="annotation-header">
                <div className="annotation-tags">
                  <span className="revise-type-chip note">
                    {note.source === 'gemini'
                      ? `GEMINI PIN${note.modelUsed ? ` · ${note.modelUsed}` : ''}`
                      : 'NOTE'}
                  </span>
                  {note.tags.map((t) => (
                    <span key={t} className={`tag-pill ${t}`}>
                      #{t}
                    </span>
                  ))}
                  {note.status === 'mastered' && (
                    <span className="tag-pill Mnemonic">Mastered</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    className="mini-action-btn"
                    title={note.status === 'mastered' ? 'Move back to Revision' : 'Mark Mastered'}
                    onClick={() =>
                      updateNote(line.id, note.id, {
                        status: note.status === 'mastered' ? 'review' : 'mastered',
                      })
                    }
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn"
                    title="Edit note"
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setEditingNoteText(note.content);
                    }}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn btn-danger-ghost"
                    title="Delete note"
                    onClick={() => deleteNote(line.id, note.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea
                    className="composer-textarea"
                    rows={3}
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingNoteId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        updateNote(line.id, note.id, { content: editingNoteText.trim() });
                        setEditingNoteId(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`annotation-body ${note.status === 'mastered' ? 'mastered' : ''}`}>
                  {note.content}
                </div>
              )}
            </div>
          ))}

          {composerMode !== 'none' && (
            <div className="inline-composer">
              <div className="composer-tabs">
                <button
                  type="button"
                  className={`filter-pill ${composerMode === 'custom_line' ? 'active' : ''}`}
                  onClick={() => setComposerMode('custom_line')}
                >
                  Insert Custom Line
                </button>
                <button
                  type="button"
                  className={`filter-pill ${composerMode === 'note' ? 'active' : ''}`}
                  onClick={() => setComposerMode('note')}
                >
                  Add Tagged Note
                </button>
              </div>
              <textarea
                className="composer-textarea"
                rows={2}
                autoFocus
                placeholder={
                  composerMode === 'custom_line'
                    ? 'Add a custom study line right beneath this NCERT sentence... Tip: wrap {{key words}} in double braces to auto-mask them in Cloze Mode!'
                    : 'Write your PYQ reference, trap reminder, exception, or mnemonic...'
                }
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveDraft();
                  }
                }}
              />
              <div className="composer-footer">
                <div className="tag-toggle-row">
                  {NOTE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-toggle-btn ${draftTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setComposerMode('none');
                      setDraftText('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!draftText.trim()}
                    onClick={handleSaveDraft}
                  >
                    Save ({composerMode === 'custom_line' ? 'Line' : 'Note'})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
