import { useState } from 'react';
import {
  Check,
  FileText,
  HelpCircle,
  Maximize2,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import type { ChapterDiagram, DiagramInfoPoint } from '../../types/study';
import { resolveAssetUrl } from '../../utils/assetUrl';

interface DiagramCardProps {
  chapterId: string;
  diagram: ChapterDiagram;
}

export function DiagramCard({ chapterId, diagram }: DiagramCardProps) {
  const {
    state,
    activeSelection,
    selectDiagram,
    setDiagramMastery,
    addDiagramInfoPoint,
    deleteDiagramInfoPoint,
  } = useStudy();

  const [darkAdapted, setDarkAdapted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [addingPoint, setAddingPoint] = useState(false);
  const [newCategory, setNewCategory] = useState<DiagramInfoPoint['category']>('inference');
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const isSelected = activeSelection?.type === 'diagram' && activeSelection.id === diagram.id;
  const mastery = state.diagramMastery[diagram.id] ?? 'unread';
  const customPoints = state.diagramExtraInfo[diagram.id] ?? [];
  const allPoints = [...diagram.infoList, ...customPoints];
  const noteCount = (state.lineNotes[diagram.id] ?? []).length;
  const mcqCount = (state.pinnedMcqs[diagram.id] ?? []).length;

  const handleSavePoint = () => {
    if (!newTitle.trim() || !newDetail.trim()) return;
    addDiagramInfoPoint(diagram.id, {
      category: newCategory,
      title: newTitle.trim(),
      detail: newDetail.trim(),
    });
    setNewTitle('');
    setNewDetail('');
    setAddingPoint(false);
  };

  return (
    <>
      <article
        className={`diagram-card ${isSelected ? 'selected' : ''}`}
        id={diagram.id}
        onClick={() => selectDiagram(chapterId, diagram.id)}
      >
        <div className="diagram-card-header">
          <div className="diagram-card-title">
            <span className="diagram-fig-badge">{diagram.figureNumber}</span>
            <span className="diagram-caption">{diagram.caption}</span>
          </div>
          <div className="diagram-header-actions">
            <button
              type="button"
              className={`btn-ghost ${mastery === 'mastered' ? 'active' : ''}`}
              title="Toggle Diagram Mastered"
              onClick={(e) => {
                e.stopPropagation();
                setDiagramMastery(diagram.id, mastery === 'mastered' ? 'review' : 'mastered');
              }}
              style={
                mastery === 'mastered'
                  ? { color: 'var(--accent-green)', background: 'var(--accent-green-soft)' }
                  : undefined
              }
            >
              <Check size={14} />
              {mastery === 'mastered' ? 'Mastered' : 'Master'}
            </button>
            <button
              type="button"
              className="mini-action-btn"
              title="Ask Gemini about this diagram"
              onClick={(e) => {
                e.stopPropagation();
                selectDiagram(chapterId, diagram.id, 'ask');
              }}
            >
              <Sparkles size={14} />
            </button>
            <button
              type="button"
              className="mini-action-btn"
              title="Generate diagram MCQ"
              onClick={(e) => {
                e.stopPropagation();
                selectDiagram(chapterId, diagram.id, 'mcq');
              }}
            >
              <HelpCircle size={14} />
            </button>
            <button
              type="button"
              className="mini-action-btn"
              title={`Peek NCERT Page ${diagram.ncertPage}`}
              onClick={(e) => {
                e.stopPropagation();
                selectDiagram(chapterId, diagram.id, 'pdf');
              }}
            >
              <FileText size={14} />
            </button>
          </div>
        </div>

        <div className="diagram-split">
          <div className="diagram-visual-pane">
            <div
              className={`diagram-image-frame ${darkAdapted ? 'dark-adapted' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              title="Click to inspect full resolution"
            >
              <img src={resolveAssetUrl(diagram.imagePath)} alt={`${diagram.figureNumber}: ${diagram.caption}`} loading="lazy" />
            </div>
            <div className="diagram-visual-controls">
              <span>NCERT p.{diagram.ncertPage}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {noteCount > 0 && <span className="micro-badge has-notes">{noteCount} note{noteCount > 1 ? 's' : ''}</span>}
                {mcqCount > 0 && <span className="micro-badge has-mcqs">{mcqCount} MCQ</span>}
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDarkAdapted((v) => !v);
                  }}
                  title="Toggle paper contrast vs dark-adapted filter"
                >
                  {darkAdapted ? <Sun size={13} /> : <Moon size={13} />}
                  {darkAdapted ? 'Paper' : 'Dark'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                >
                  <Maximize2 size={13} />
                  Zoom
                </button>
              </div>
            </div>
          </div>

          <div className="diagram-info-pane">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span className="diagram-info-heading">
                Information Conveyed ({allPoints.length})
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingPoint((v) => !v);
                }}
              >
                <Plus size={13} />
                Add Point
              </button>
            </div>

            {addingPoint && (
              <div
                className="inline-composer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="diagram-point-row">
                  <select
                    className="macos-select diagram-point-select"
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as DiagramInfoPoint['category'])
                    }
                  >
                    <option value="label">Label</option>
                    <option value="fact">NCERT Fact</option>
                    <option value="inference">Inference / Trap</option>
                  </select>
                  <input
                    className="macos-input"
                    placeholder="Point heading (e.g., Polar head orientation)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <textarea
                  className="composer-textarea"
                  rows={2}
                  placeholder="Add the detail you want to remember for this diagram..."
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setAddingPoint(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!newTitle.trim() || !newDetail.trim()}
                    onClick={handleSavePoint}
                  >
                    Save Point
                  </button>
                </div>
              </div>
            )}

            {allPoints.map((pt, idx) => (
              <div key={pt.id ?? idx} className={`diagram-info-item ${pt.category}`}>
                <div className="diagram-info-item-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`info-cat-chip ${pt.category}`}>
                      {pt.category === 'inference'
                        ? 'Exam Inference'
                        : pt.category === 'fact'
                          ? 'NCERT Fact'
                          : 'Label'}
                    </span>
                    <span className="diagram-info-title">{pt.title}</span>
                  </div>
                  {pt.isCustom && pt.id && (
                    <button
                      type="button"
                      className="mini-action-btn btn-danger-ghost"
                      title="Delete custom diagram point"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDiagramInfoPoint(diagram.id, pt.id!);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="diagram-info-detail">{pt.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {lightboxOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="macos-modal lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {diagram.figureNumber} — {diagram.caption}
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center', background: '#121317' }}>
              <div
                style={{
                  background: darkAdapted ? '#101216' : '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  maxWidth: '100%',
                }}
              >
                <img
                  src={resolveAssetUrl(diagram.imagePath)}
                  alt={diagram.caption}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '72vh',
                    objectFit: 'contain',
                    display: 'block',
                    filter: darkAdapted ? 'invert(0.92) hue-rotate(180deg)' : 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
