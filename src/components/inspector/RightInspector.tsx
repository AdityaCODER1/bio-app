import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Moon,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  askGeminiAboutTarget,
  generateLineMcqs,
  type LineContextPayload,
} from '../../services/geminiClient';
import { useStudy } from '../../state/studyStore';
import {
  MCQ_STYLE_META,
  type ChapterData,
  type GeneratedMcqDraft,
  type McqStyle,
} from '../../types/study';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { findDiagramById, getAllChapterLines } from '../../utils/chapterMetrics';
import {
  copyTextToClipboard,
  formatQaPairForCopy,
  formatThreadForCopy,
} from '../../utils/clipboard';
import { MarkdownMath } from '../common/MarkdownMath';

const QUICK_PROMPTS = [
  'Explain this NCERT line deeply',
  'What NEET trap or word twist can come from here?',
  'Give a quick mnemonic to lock this in',
  'Connect this to other NCERT Biology chapters',
];

const MCQ_STYLES: McqStyle[] = [
  'single_correct',
  'assertion_reason',
  'statement_pair',
  'word_trap',
];

interface RightInspectorProps {
  chapter: ChapterData;
  onOpenSettings: () => void;
}

export function RightInspector({ chapter, onOpenSettings }: RightInspectorProps) {
  const {
    state,
    config,
    effectiveModelId,
    diskSyncAvailable,
    activeSelection,
    inspectorTab,
    setInspectorTab,
    setInspectorOpen,
    appendChatMessage,
    clearChatThread,
    addNote,
    pinMcq,
    recordMcqAttempt,
    deletePinnedMcq,
    updatePinnedMcq,
    updateConfig,
  } = useStudy();

  const allLines = useMemo(() => getAllChapterLines(chapter), [chapter]);

  const resolvedTarget = useMemo(() => {
    if (activeSelection && activeSelection.chapterId === chapter.id) {
      if (activeSelection.type === 'diagram') {
        const diag = findDiagramById(chapter, activeSelection.id);
        if (diag) {
          return {
            type: 'diagram' as const,
            id: diag.id,
            title: `${diag.figureNumber} · p.${diag.ncertPage}`,
            preview: diag.caption,
            pdfPage: diag.pdfPage,
            ncertPage: diag.ncertPage,
            context: {
              chapterTitle: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
              sectionTitle: diag.figureNumber,
              ncertPage: diag.ncertPage,
              targetText: `${diag.figureNumber}: ${diag.caption}`,
              surroundingText: diag.infoList
                .map((p) => `[${p.category}] ${p.title}: ${p.detail}`)
                .join('\n'),
              userNotes: (state.lineNotes[diag.id] ?? []).map((n) => n.content),
              isDiagram: true,
              diagramFigureNumber: diag.figureNumber,
            } satisfies LineContextPayload,
          };
        }
      } else {
        const found = allLines.find((item) => item.line.id === activeSelection.id);
        if (found) {
          return {
            type: 'line' as const,
            id: found.line.id,
            title: `Line #${found.line.lineNumber} · ${found.section.number} · p.${found.line.ncertPage}`,
            preview: found.line.text,
            pdfPage: found.line.pdfPage,
            ncertPage: found.line.ncertPage,
            context: {
              chapterTitle: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
              sectionTitle: `${found.section.number} ${found.section.title}`,
              ncertPage: found.line.ncertPage,
              lineNumber: found.line.lineNumber,
              targetText: found.line.text,
              surroundingText: found.paragraphText,
              userNotes: [
                ...(state.customLines[found.line.id] ?? []).map((c) => c.text),
                ...(state.lineNotes[found.line.id] ?? []).map((n) => n.content),
              ],
            } satisfies LineContextPayload,
          };
        }
      }
    }

    const first = allLines[0];
    if (!first) return null;
    return {
      type: 'line' as const,
      id: first.line.id,
      title: `Line #${first.line.lineNumber} · ${first.section.number} · p.${first.line.ncertPage}`,
      preview: first.line.text,
      pdfPage: first.line.pdfPage,
      ncertPage: first.line.ncertPage,
      context: {
        chapterTitle: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
        sectionTitle: `${first.section.number} ${first.section.title}`,
        ncertPage: first.line.ncertPage,
        lineNumber: first.line.lineNumber,
        targetText: first.line.text,
        surroundingText: first.paragraphText,
      } satisfies LineContextPayload,
    };
  }, [activeSelection, allLines, chapter, state.customLines, state.lineNotes]);

  // Ask Gemini state
  const [questionInput, setQuestionInput] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [pinnedNoticeId, setPinnedNoticeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (!ok) return;
    setCopiedKey(key);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  // MCQ Lab state
  const [mcqStyle, setMcqStyle] = useState<McqStyle>('single_correct');
  const [mcqCount, setMcqCount] = useState(2);
  const [mcqFocus, setMcqFocus] = useState('');
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqError, setMcqError] = useState<string | null>(null);
  const [draftMcqs, setDraftMcqs] = useState<GeneratedMcqDraft[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<number, number>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, number>>({});

  // PDF Page Peek state synced to active line
  const [pdfPage, setPdfPage] = useState(resolvedTarget?.pdfPage ?? 1);
  useEffect(() => {
    if (resolvedTarget) {
      setPdfPage(resolvedTarget.pdfPage);
    }
    setDraftMcqs([]);
    setDraftAnswers({});
    setAskError(null);
    setMcqError(null);
    setCopiedKey(null);
  }, [resolvedTarget?.id, resolvedTarget?.pdfPage]);

  if (!resolvedTarget) return null;

  const thread = state.aiThreads[resolvedTarget.id] ?? [];
  const pinnedMcqs = state.pinnedMcqs[resolvedTarget.id] ?? [];
  const hasKey = Boolean(config.apiKey.trim());

  const handleAsk = async (promptText?: string) => {
    const q = (promptText ?? questionInput).trim();
    if (!q || askLoading) return;
    if (!hasKey) {
      setAskError('Add your Gemini API key in Settings (⌘,) to chat with Gemini.');
      return;
    }

    setAskError(null);
    setQuestionInput('');
    appendChatMessage(resolvedTarget.id, { role: 'user', content: q });
    setAskLoading(true);
    try {
      const reply = await askGeminiAboutTarget({
        apiKey: config.apiKey,
        modelId: effectiveModelId,
        context: resolvedTarget.context,
        history: thread,
        question: q,
      });
      appendChatMessage(resolvedTarget.id, {
        role: 'assistant',
        content: reply,
        modelUsed: effectiveModelId,
      });
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Gemini request failed.');
    } finally {
      setAskLoading(false);
    }
  };

  const handleGenerateMcqs = async () => {
    if (mcqLoading) return;
    if (!hasKey) {
      setMcqError('Add your Gemini API key in Settings (⌘,) to generate custom MCQs.');
      return;
    }
    setMcqError(null);
    setMcqLoading(true);
    setDraftAnswers({});
    try {
      const list = await generateLineMcqs({
        apiKey: config.apiKey,
        modelId: effectiveModelId,
        context: resolvedTarget.context,
        style: mcqStyle,
        count: mcqCount,
        customFocus: mcqFocus,
      });
      setDraftMcqs(list);
    } catch (err) {
      setMcqError(err instanceof Error ? err.message : 'MCQ generation failed.');
    } finally {
      setMcqLoading(false);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];
  const pdfImageSrc = resolveAssetUrl(
    `pdf-pages/${chapter.id}/page-${String(pdfPage).padStart(2, '0')}.webp`,
  );
  const externalPdfHref = diskSyncAvailable
    ? `/api/chapter-pdf/${encodeURIComponent(chapter.pdfFile)}#page=${pdfPage}`
    : `https://github.com/AdityaCODER1/bio-app/blob/main/${encodeURIComponent(chapter.pdfFile)}`;

  return (
    <aside className="inspector-pane" aria-label="Line AI, MCQ Lab, and PDF Page Inspector">
      <div className="inspector-header">
        <div className="inspector-tabs-row">
          <div className="inspector-tabs">
            <button
              type="button"
              className={`inspector-tab-btn ${inspectorTab === 'ask' ? 'active' : ''}`}
              onClick={() => setInspectorTab('ask')}
            >
              <Sparkles size={13} /> Ask Gemini
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${inspectorTab === 'mcq' ? 'active' : ''}`}
              onClick={() => setInspectorTab('mcq')}
            >
              <HelpCircle size={13} /> MCQ Lab
              {pinnedMcqs.length > 0 && (
                <span className="micro-badge has-mcqs">{pinnedMcqs.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${inspectorTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setInspectorTab('pdf')}
            >
              <FileText size={13} /> PDF Peek
            </button>
          </div>
          <button
            type="button"
            className="icon-btn mobile-inspector-close"
            onClick={() => setInspectorOpen(false)}
            aria-label="Close inspector"
            title="Close inspector"
          >
            <X size={16} />
          </button>
        </div>

        <div className="inspector-anchor-card">
          <div className="inspector-anchor-meta">
            <span>{resolvedTarget.title}</span>
            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {effectiveModelId}
            </span>
          </div>
          <div className="inspector-anchor-text">{resolvedTarget.preview}</div>
        </div>
      </div>

      {/* TAB 1: ASK GEMINI */}
      {inspectorTab === 'ask' && (
        <div className="inspector-body">
          <div className="inspector-scroll">
            {!hasKey && (
              <div className="error-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>Gemini API key not configured yet.</span>
                <button type="button" className="btn-secondary" onClick={onOpenSettings}>
                  <Settings size={12} /> Setup
                </button>
              </div>
            )}

            <div className="prompt-chips">
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="prompt-chip"
                  disabled={askLoading}
                  onClick={() => void handleAsk(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            {thread.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <Sparkles size={24} color="var(--accent-blue)" />
                <h3>Line-by-Line Gemini Tutor</h3>
                <p style={{ fontSize: 12.2, margin: 0 }}>
                  Ask any doubt about this exact NCERT sentence or click a quick prompt above.
                  Pin useful explanations directly onto the line for revision.
                </p>
              </div>
            ) : (
              <>
                <div className="chat-thread-toolbar">
                  <button
                    type="button"
                    className="btn-ghost chat-action-btn"
                    onClick={() =>
                      void handleCopy(
                        'thread',
                        formatThreadForCopy(resolvedTarget.title, thread),
                      )
                    }
                    title="Copy entire chat thread for this item"
                  >
                    {copiedKey === 'thread' ? (
                      <>
                        <Check size={12} color="var(--accent-green)" /> Copied Thread
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Thread
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost chat-action-btn"
                    onClick={() => clearChatThread(resolvedTarget.id)}
                  >
                    <Trash2 size={12} /> Clear Thread
                  </button>
                </div>
                {thread.map((msg, msgIdx) => {
                  let pairedUserQuery: string | null = null;
                  if (msg.role === 'assistant') {
                    for (let i = msgIdx - 1; i >= 0; i--) {
                      if (thread[i].role === 'user') {
                        pairedUserQuery = thread[i].content;
                        break;
                      }
                    }
                  }

                  const msgCopyKey = `msg-${msg.id}`;
                  const qaCopyKey = `qa-${msg.id}`;

                  return (
                    <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                      <MarkdownMath content={msg.content} className="chat-markdown" />
                      {msg.role === 'user' ? (
                        <div className="chat-user-footer">
                          <button
                            type="button"
                            className={`btn-ghost chat-action-btn ${
                              copiedKey === msgCopyKey ? 'copied' : ''
                            }`}
                            aria-label="Copy query"
                            title="Copy your query"
                            onClick={() => void handleCopy(msgCopyKey, msg.content)}
                          >
                            {copiedKey === msgCopyKey ? (
                              <>
                                <Check size={11.5} color="var(--accent-green)" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={11.5} /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="chat-bubble-footer">
                          <span className="chat-model-label">
                            {msg.modelUsed || effectiveModelId}
                          </span>
                          <div className="chat-bubble-actions">
                            <button
                              type="button"
                              className={`btn-ghost chat-action-btn ${
                                copiedKey === msgCopyKey ? 'copied' : ''
                              }`}
                              aria-label="Copy Gemini output"
                              title="Copy Gemini output (Markdown & LaTeX)"
                              onClick={() => void handleCopy(msgCopyKey, msg.content)}
                            >
                              {copiedKey === msgCopyKey ? (
                                <>
                                  <Check size={11.5} color="var(--accent-green)" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={11.5} /> Copy
                                </>
                              )}
                            </button>
                            {pairedUserQuery && (
                              <button
                                type="button"
                                className={`btn-ghost chat-action-btn ${
                                  copiedKey === qaCopyKey ? 'copied' : ''
                                }`}
                                aria-label="Copy query and Gemini output"
                                title="Copy both your query and this Gemini response"
                                onClick={() =>
                                  void handleCopy(
                                    qaCopyKey,
                                    formatQaPairForCopy(pairedUserQuery!, msg.content),
                                  )
                                }
                              >
                                {copiedKey === qaCopyKey ? (
                                  <>
                                    <Check size={11.5} color="var(--accent-green)" /> Copied Q&A
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11.5} /> Copy Q&A
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-ghost chat-action-btn"
                              onClick={() => {
                                addNote({
                                  chapterId: chapter.id,
                                  targetId: resolvedTarget.id,
                                  targetType: resolvedTarget.type,
                                  content: msg.content,
                                  tags: ['Concept'],
                                  source: 'gemini',
                                  modelUsed: msg.modelUsed || effectiveModelId,
                                });
                                setPinnedNoticeId(msg.id);
                                window.setTimeout(() => setPinnedNoticeId(null), 1800);
                              }}
                            >
                              {pinnedNoticeId === msg.id ? (
                                <>
                                  <Check size={11.5} color="var(--accent-green)" /> Pinned
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus size={11.5} /> Pin to Line
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {askLoading && (
              <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spin" /> Thinking with {effectiveModelId}…
              </div>
            )}

            {askError && <div className="error-banner">{askError}</div>}
          </div>

          <div className="inspector-composer">
            <div className="composer-row">
              <textarea
                className="composer-textarea"
                rows={2}
                placeholder="Ask a doubt about this line… (⌘↵ to send)"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    void handleAsk();
                  }
                }}
              />
              <button
                type="button"
                className="btn-primary"
                style={{ height: 42, padding: '0 13px' }}
                disabled={!questionInput.trim() || askLoading}
                onClick={() => void handleAsk()}
                title="Send question"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEET MCQ LAB */}
      {inspectorTab === 'mcq' && (
        <div className="inspector-body">
          <div className="inspector-scroll">
            {!hasKey && (
              <div className="error-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>Add your Gemini API key to generate line MCQs.</span>
                <button type="button" className="btn-secondary" onClick={onOpenSettings}>
                  <Settings size={12} /> Setup
                </button>
              </div>
            )}

            <div className="inline-composer">
              <div className="field-label">NEET MCQ Format</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {MCQ_STYLES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-pill ${mcqStyle === st ? 'active' : ''}`}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setMcqStyle(st)}
                  >
                    {MCQ_STYLE_META[st].shortLabel}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr', gap: 6 }}>
                <select
                  className="macos-select"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                >
                  <option value={1}>1 MCQ</option>
                  <option value={2}>2 MCQs</option>
                  <option value={3}>3 MCQs</option>
                </select>
                <input
                  className="macos-input"
                  placeholder="Optional focus (e.g., exception / diagram label)"
                  value={mcqFocus}
                  onChange={(e) => setMcqFocus(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={mcqLoading}
                onClick={() => void handleGenerateMcqs()}
              >
                {mcqLoading ? (
                  <>
                    <Loader2 size={14} /> Generating with {effectiveModelId}…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate Custom MCQ for This Line
                  </>
                )}
              </button>
            </div>

            {mcqError && <div className="error-banner">{mcqError}</div>}

            {draftMcqs.length > 0 && (
              <>
                <div className="diagram-info-heading">
                  Freshly Generated ({draftMcqs.length})
                </div>
                {draftMcqs.map((draft, idx) => {
                  const picked = draftAnswers[idx];
                  return (
                    <div key={idx} className="mcq-card">
                      <div className="revise-item-top">
                        <span className="micro-badge has-mcqs">
                          {MCQ_STYLE_META[draft.style].shortLabel}
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            pinMcq({
                              chapterId: chapter.id,
                              targetId: resolvedTarget.id,
                              targetType: resolvedTarget.type,
                              draft,
                              modelUsed: effectiveModelId,
                            });
                            setDraftMcqs((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <BookmarkPlus size={13} /> Pin to Line
                        </button>
                      </div>

                      {draft.assertion && (
                        <div className="mcq-statement-box">
                          <div>
                            <strong>A:</strong> <MarkdownMath content={draft.assertion} inline />
                          </div>
                          <div>
                            <strong>R:</strong>{' '}
                            <MarkdownMath content={draft.reason ?? ''} inline />
                          </div>
                        </div>
                      )}
                      {draft.statement1 && (
                        <div className="mcq-statement-box">
                          <div>
                            <strong>Statement I:</strong>{' '}
                            <MarkdownMath content={draft.statement1} inline />
                          </div>
                          <div>
                            <strong>Statement II:</strong>{' '}
                            <MarkdownMath content={draft.statement2 ?? ''} inline />
                          </div>
                        </div>
                      )}

                      <div className="mcq-question">
                        <MarkdownMath content={draft.question} />
                      </div>

                      <div className="mcq-options">
                        {draft.options.map((opt, optIdx) => {
                          let cls = 'mcq-option-btn';
                          if (picked !== undefined) {
                            if (optIdx === draft.correctIndex) cls += ' correct';
                            else if (optIdx === picked) cls += ' wrong';
                          }
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              className={cls}
                              disabled={picked !== undefined}
                              onClick={() =>
                                setDraftAnswers((prev) => ({ ...prev, [idx]: optIdx }))
                              }
                            >
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                                {letters[optIdx]}.
                              </strong>
                              <MarkdownMath content={opt} inline />
                            </button>
                          );
                        })}
                      </div>

                      {picked !== undefined && (
                        <div className="mcq-explanation">
                          <MarkdownMath content={draft.explanation} />
                          <div className="mcq-proof">
                            NCERT anchor: “<MarkdownMath content={draft.ncertProof} inline />”
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {pinnedMcqs.length > 0 && (
              <>
                <div className="diagram-info-heading" style={{ marginTop: 6 }}>
                  Pinned MCQs on This Item ({pinnedMcqs.length})
                </div>
                {pinnedMcqs.map((mcq) => {
                  const picked = savedAnswers[mcq.id];
                  return (
                    <div key={mcq.id} className="mcq-card">
                      <div className="revise-item-top">
                        <div style={{ display: 'flex', gap: 5 }}>
                          <span className="revise-type-chip mcq">
                            {mcq.status === 'mastered' ? 'MASTERED' : 'REVISE'}
                          </span>
                          <span className="micro-badge">
                            {mcq.correctAttempts}/{mcq.attempts}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="mini-action-btn"
                            title="Toggle Mastered"
                            onClick={() =>
                              updatePinnedMcq(resolvedTarget.id, mcq.id, {
                                status: mcq.status === 'mastered' ? 'review' : 'mastered',
                              })
                            }
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            className="mini-action-btn btn-danger-ghost"
                            title="Delete Pinned MCQ"
                            onClick={() => deletePinnedMcq(resolvedTarget.id, mcq.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {mcq.assertion && (
                        <div className="mcq-statement-box">
                          <div>
                            <strong>A:</strong> <MarkdownMath content={mcq.assertion} inline />
                          </div>
                          <div>
                            <strong>R:</strong>{' '}
                            <MarkdownMath content={mcq.reason ?? ''} inline />
                          </div>
                        </div>
                      )}
                      {mcq.statement1 && (
                        <div className="mcq-statement-box">
                          <div>
                            <strong>Statement I:</strong>{' '}
                            <MarkdownMath content={mcq.statement1} inline />
                          </div>
                          <div>
                            <strong>Statement II:</strong>{' '}
                            <MarkdownMath content={mcq.statement2 ?? ''} inline />
                          </div>
                        </div>
                      )}

                      <div className="mcq-question">
                        <MarkdownMath content={mcq.question} />
                      </div>

                      <div className="mcq-options">
                        {mcq.options.map((opt, optIdx) => {
                          let cls = 'mcq-option-btn';
                          if (picked !== undefined) {
                            if (optIdx === mcq.correctIndex) cls += ' correct';
                            else if (optIdx === picked) cls += ' wrong';
                          }
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              className={cls}
                              disabled={picked !== undefined}
                              onClick={() => {
                                setSavedAnswers((prev) => ({ ...prev, [mcq.id]: optIdx }));
                                recordMcqAttempt(
                                  resolvedTarget.id,
                                  mcq.id,
                                  optIdx === mcq.correctIndex,
                                );
                              }}
                            >
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                                {letters[optIdx]}.
                              </strong>
                              <MarkdownMath content={opt} inline />
                            </button>
                          );
                        })}
                      </div>

                      {picked !== undefined && (
                        <div className="mcq-explanation">
                          <MarkdownMath content={mcq.explanation} />
                          <div className="mcq-proof">
                            NCERT anchor: “<MarkdownMath content={mcq.ncertProof} inline />”
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORIGINAL NCERT PDF PAGE PEEK */}
      {inspectorTab === 'pdf' && (
        <div className="inspector-body">
          <div className="pdf-peek-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="icon-btn"
                disabled={pdfPage <= 1}
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                title="Previous PDF page"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                PDF p.{pdfPage} / {chapter.pdfPageCount}
              </span>
              <button
                type="button"
                className="icon-btn"
                disabled={pdfPage >= chapter.pdfPageCount}
                onClick={() => setPdfPage((p) => Math.min(chapter.pdfPageCount, p + 1))}
                title="Next PDF page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="icon-btn"
                title="Toggle dark-mode page invert"
                onClick={() =>
                  updateConfig({ showPdfDarkFilter: !config.showPdfDarkFilter })
                }
              >
                {config.showPdfDarkFilter ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <a
                className="icon-btn"
                href={externalPdfHref}
                target="_blank"
                rel="noreferrer"
                title={
                  diskSyncAvailable
                    ? 'Open original NCERT PDF in browser tab'
                    : 'Open original NCERT PDF on GitHub'
                }
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="pdf-page-canvas">
            <img
              src={pdfImageSrc}
              alt={`${chapter.title} PDF page ${pdfPage}`}
              className={`pdf-page-img ${config.showPdfDarkFilter ? 'dark-filtered' : ''}`}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
