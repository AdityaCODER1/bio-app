import { useState } from 'react';
import { splitClozeSegments } from '../../utils/cloze';

interface ClozeTextProps {
  text: string;
  clozeTerms: string[];
  enabled: boolean;
}

export function ClozeText({ text, clozeTerms, enabled }: ClozeTextProps) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  if (!enabled || clozeTerms.length === 0) {
    return <>{text}</>;
  }

  const segments = splitClozeSegments(text, clozeTerms);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.isCloze) {
          return <span key={i}>{seg.text}</span>;
        }
        const isShown = Boolean(revealed[seg.termIndex]);
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className={`cloze-blank ${isShown ? 'revealed' : ''}`}
            title={isShown ? 'Click to hide again' : 'Click to reveal term'}
            onClick={(e) => {
              e.stopPropagation();
              setRevealed((prev) => ({ ...prev, [seg.termIndex]: !prev[seg.termIndex] }));
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                setRevealed((prev) => ({ ...prev, [seg.termIndex]: !prev[seg.termIndex] }));
              }
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}
