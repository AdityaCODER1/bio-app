import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useStudy } from '../../state/studyStore';
import type { ChapterData } from '../../types/study';
import { DiagramCard } from './DiagramCard';

export function DiagramsGalleryView({ chapter }: { chapter: ChapterData }) {
  const { state } = useStudy();
  const [filter, setFilter] = useState<'all' | 'unmastered'>('all');

  const visibleDiagrams = chapter.diagrams.filter((d) => {
    if (filter === 'all') return true;
    return (state.diagramMastery[d.id] ?? 'unread') !== 'mastered';
  });

  const masteredCount = chapter.diagrams.filter(
    (d) => state.diagramMastery[d.id] === 'mastered',
  ).length;

  return (
    <div className="center-container wide">
      <div className="chapter-hero">
        <div className="chapter-hero-eyebrow">
          <span className="hero-pill">Chapter {chapter.chapterNumber}</span>
          <span>Diagrams & Side-by-Side Breakdown</span>
        </div>
        <h1>{chapter.title} — All NCERT Diagrams</h1>
        <div className="chapter-hero-stats">
          <div className="stat-strip">
            <span>
              <strong>{chapter.diagrams.length}</strong> cropped NCERT figures
            </span>
            <span>
              <strong>{masteredCount}</strong> mastered
            </span>
          </div>
          <div className="reader-filter-bar">
            <button
              type="button"
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({chapter.diagrams.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === 'unmastered' ? 'active' : ''}`}
              onClick={() => setFilter('unmastered')}
            >
              Needs Mastery ({chapter.diagrams.length - masteredCount})
            </button>
          </div>
        </div>
      </div>

      {visibleDiagrams.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={28} />
          <h3>Every diagram in Chapter {chapter.chapterNumber} is mastered!</h3>
          <p>Switch back to "All" anytime to review labels or test yourself with Gemini MCQs.</p>
        </div>
      ) : (
        visibleDiagrams.map((diagram) => (
          <DiagramCard key={diagram.id} chapterId={chapter.id} diagram={diagram} />
        ))
      )}
    </div>
  );
}
