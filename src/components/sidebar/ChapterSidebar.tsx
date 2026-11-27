import { CHAPTERS } from '../../data/chapters';
import { useStudy } from '../../state/studyStore';
import type { ChapterData } from '../../types/study';
import { computeChapterStats } from '../../utils/chapterMetrics';

function ProgressRing({ percent }: { percent: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="chapter-ring" aria-label={`${percent}% mastered`}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        <circle
          cx="17"
          cy="17"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="2.8"
        />
        <circle
          cx="17"
          cy="17"
          r={radius}
          fill="none"
          stroke={percent === 100 ? 'var(--accent-green)' : 'var(--accent-blue)'}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 17 17)"
        />
      </svg>
      <span className="chapter-ring-label">{percent}%</span>
    </div>
  );
}

export function ChapterSidebar({ activeChapter }: { activeChapter: ChapterData }) {
  const { state, activeChapterId, setActiveChapterId, setActiveMode } = useStudy();

  const handleJumpSection = (sectionId: string) => {
    setActiveMode('read');
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`sec-${sectionId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <aside className="sidebar-pane" aria-label="Chapter and Section Navigator">
      <div className="sidebar-scroll">
        {Array.from(new Set(CHAPTERS.map((ch) => ch.unitTitle))).map((unitTitle, uIdx) => (
          <div key={unitTitle}>
            <div
              className="sidebar-section-label"
              style={uIdx > 0 ? { marginTop: 10 } : undefined}
            >
              {unitTitle}
            </div>

            {CHAPTERS.filter((ch) => ch.unitTitle === unitTitle).map((ch) => {
              const stats = computeChapterStats(ch, state);
              const isActive = ch.id === activeChapterId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`chapter-card-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveChapterId(ch.id)}
                >
                  <ProgressRing percent={stats.masteryPercent} />
                  <div className="chapter-card-meta">
                    <div className="chapter-card-kicker">Chapter {ch.chapterNumber}</div>
                    <div className="chapter-card-title">{ch.title}</div>
                    <div className="chapter-card-sub">
                      <span>{stats.totalLines} lines</span>
                      <span>·</span>
                      <span>{ch.diagrams.length} figs</span>
                      {stats.revisionQueueCount > 0 && (
                        <span style={{ color: 'var(--accent-amber)' }}>
                          · {stats.revisionQueueCount} rev
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        <div className="sidebar-divider" />

        <div className="sidebar-section-label">
          Ch {activeChapter.chapterNumber} Sections
        </div>

        <nav className="outline-list">
          {activeChapter.sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`outline-btn level-${sec.level}`}
              onClick={() => handleJumpSection(sec.id)}
            >
              <span className="outline-num">{sec.number}</span>
              <span className="outline-title">{sec.title}</span>
            </button>
          ))}
          <button
            type="button"
            className="outline-btn level-1"
            onClick={() => {
              setActiveMode('read');
              window.requestAnimationFrame(() => {
                document
                  .getElementById('chapter-end-vault')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            }}
          >
            <span className="outline-num">Vault</span>
            <span className="outline-title">Categorized Summary</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="shortcut-hint-row">
          <span>Navigate lines</span>
          <span className="kbd-chip">J / K</span>
        </div>
        <div className="shortcut-hint-row">
          <span>Master / Revise</span>
          <span className="kbd-chip">M / R</span>
        </div>
        <div className="shortcut-hint-row">
          <span>Cloze Recall</span>
          <span className="kbd-chip">C</span>
        </div>
        <div className="shortcut-hint-row">
          <span>Quick Search</span>
          <span className="kbd-chip">⌘K</span>
        </div>
      </div>
    </aside>
  );
}
