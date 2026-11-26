import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import {
  VAULT_CATEGORY_META,
  type ChapterData,
  type VaultCategoryKey,
  type VaultItem,
} from '../../types/study';
import { getResolvedVaultItems } from '../../utils/chapterMetrics';

const CATEGORY_ORDER: VaultCategoryKey[] = [
  'scientists_years',
  'numbers_dimensions',
  'examples_exceptions',
  'equations_tables',
  'word_traps',
];

interface ChapterVaultViewProps {
  chapter: ChapterData;
  embedded?: boolean;
}

export function ChapterVaultView({ chapter, embedded = false }: ChapterVaultViewProps) {
  const {
    state,
    config,
    setVaultMastery,
    addCustomVaultItem,
    editVaultItem,
    deleteVaultItem,
    jumpToLine,
  } = useStudy();

  const [selectedCategory, setSelectedCategory] = useState<'all' | VaultCategoryKey>('all');
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<VaultCategoryKey>('word_traps');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const items = useMemo(() => getResolvedVaultItems(chapter, state), [chapter, state]);

  const countsByCat = useMemo(() => {
    const map: Record<VaultCategoryKey, number> = {
      scientists_years: 0,
      numbers_dimensions: 0,
      examples_exceptions: 0,
      equations_tables: 0,
      word_traps: 0,
    };
    for (const item of items) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const masteredCount = items.filter((i) => state.vaultMastery[i.id] === 'mastered').length;

  const visibleCategories =
    selectedCategory === 'all' ? CATEGORY_ORDER : [selectedCategory];

  const handleCreate = () => {
    if (!newPrompt.trim() || !newDetail.trim()) return;
    addCustomVaultItem(chapter.id, {
      category: newCategory,
      prompt: newPrompt,
      detail: newDetail,
    });
    setNewPrompt('');
    setNewDetail('');
    setAdding(false);
  };

  const startEdit = (item: VaultItem) => {
    setEditingId(item.id);
    setEditPrompt(item.prompt);
    setEditDetail(item.detail);
  };

  const content = (
    <>
      <div className="vault-header">
        <div>
          <div className="chapter-hero-eyebrow" style={{ marginBottom: 4 }}>
            <span className="hero-pill">End-of-Chapter Vault</span>
            <span>
              {masteredCount} / {items.length} facts mastered
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: embedded ? 21 : 25, fontWeight: 700 }}>
            {chapter.title} — Categorized Important Info
          </h2>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus size={14} />
          Add Fact to Vault
        </button>
      </div>

      {adding && (
        <div className="inline-composer" style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 8 }}>
            <select
              className="macos-select"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as VaultCategoryKey)}
            >
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>
                  {VAULT_CATEGORY_META[key].label}
                </option>
              ))}
            </select>
            <input
              className="macos-input"
              placeholder="Topic / Cue (e.g., Competitive inhibitor example)"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
            />
          </div>
          <textarea
            className="composer-textarea"
            rows={2}
            placeholder="Exact high-yield fact, number, exception, or trap..."
            value={newDetail}
            onChange={(e) => setNewDetail(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!newPrompt.trim() || !newDetail.trim()}
              onClick={handleCreate}
            >
              Save Fact
            </button>
          </div>
        </div>
      )}

      <div className="vault-filter-pills">
        <button
          type="button"
          className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Categories ({items.length})
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {VAULT_CATEGORY_META[cat].shortLabel} ({countsByCat[cat]})
          </button>
        ))}
      </div>

      {visibleCategories.map((cat) => {
        const groupItems = items.filter((item) => item.category === cat);
        if (groupItems.length === 0) return null;

        return (
          <div key={cat} className="vault-group">
            <h3 className="vault-group-title">
              <span>{VAULT_CATEGORY_META[cat].label}</span>
              <span className="micro-badge">{groupItems.length}</span>
            </h3>
            <div className="vault-list">
              {groupItems.map((item) => {
                const isMastered = state.vaultMastery[item.id] === 'mastered';
                const isEditing = editingId === item.id;
                const isRevealed = Boolean(revealedIds[item.id]);

                return (
                  <div
                    key={item.id}
                    className={`vault-row ${isMastered ? 'mastered' : ''}`}
                  >
                    <button
                      type="button"
                      className={`line-status-btn ${isMastered ? 'mastered' : 'unread'}`}
                      style={{ marginTop: 2 }}
                      title={isMastered ? 'Unmark Mastered' : 'Mark Fact Mastered'}
                      onClick={() =>
                        setVaultMastery(item.id, isMastered ? 'review' : 'mastered')
                      }
                    >
                      {isMastered && <Check size={11} strokeWidth={3} />}
                    </button>

                    {isEditing ? (
                      <div
                        style={{
                          gridColumn: '2 / 5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <input
                          className="macos-input"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                        />
                        <textarea
                          className="composer-textarea"
                          rows={2}
                          value={editDetail}
                          onChange={(e) => setEditDetail(e.target.value)}
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
                              editVaultItem(chapter.id, item.id, Boolean(item.isCustom), {
                                prompt: editPrompt.trim(),
                                detail: editDetail.trim(),
                              });
                              setEditingId(null);
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="vault-prompt">
                          {item.prompt}
                          {item.isCustom && (
                            <span
                              className="micro-badge has-notes"
                              style={{ marginLeft: 6 }}
                            >
                              Custom
                            </span>
                          )}
                        </div>
                        <div
                          className={`vault-detail ${
                            config.clozeMode ? `cloze-hidden ${isRevealed ? 'revealed' : ''}` : ''
                          }`}
                          onClick={() => {
                            if (config.clozeMode) {
                              setRevealedIds((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }));
                            }
                          }}
                          title={config.clozeMode ? 'Click to reveal fact' : undefined}
                        >
                          {item.detail}
                        </div>
                        <div className="vault-row-actions">
                          {item.sourceLineId && (
                            <button
                              type="button"
                              className="mini-action-btn"
                              title="Jump to verbatim NCERT line"
                              onClick={() => jumpToLine(chapter.id, item.sourceLineId!)}
                            >
                              <ArrowUpRight size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="mini-action-btn"
                            title="Edit vault fact"
                            onClick={() => startEdit(item)}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            className="mini-action-btn btn-danger-ghost"
                            title="Delete vault fact"
                            onClick={() =>
                              deleteVaultItem(chapter.id, item.id, Boolean(item.isCustom))
                            }
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );

  if (embedded) return content;
  return <div className="center-container wide">{content}</div>;
}
