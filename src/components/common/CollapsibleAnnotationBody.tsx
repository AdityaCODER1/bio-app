import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { isLikelyLongAnnotation } from '../../utils/markdownMath';

interface CollapsibleAnnotationBodyProps {
  rawText: string;
  className?: string;
  children: ReactNode;
}

/**
 * Renders custom line / note content and automatically collapses entries taller than 3 lines
 * into a 3-line preview with a fade mask and Show more / Show less toggle.
 */
export function CollapsibleAnnotationBody({
  rawText,
  className = '',
  children,
}: CollapsibleAnnotationBodyProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(() => isLikelyLongAnnotation(rawText));

  useEffect(() => {
    setIsOverflowing(isLikelyLongAnnotation(rawText));
  }, [rawText]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      if (el.scrollHeight === 0) {
        // Non-layout environment (e.g., jsdom): keep text-based heuristic
        setIsOverflowing(isLikelyLongAnnotation(rawText));
        return;
      }
      const computed = window.getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize) || 12.8;
      const parsedLineHeight = parseFloat(computed.lineHeight);
      const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.55;
      const collapsedThresholdPx = lineHeight * 3.2;
      setIsOverflowing(el.scrollHeight > collapsedThresholdPx + 4);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [rawText]);

  const isCollapsed = isOverflowing && !isExpanded;

  return (
    <div className="annotation-collapsible">
      <div
        ref={contentRef}
        className={`annotation-collapsible-body ${className} ${isCollapsed ? 'is-collapsed' : ''}`.trim()}
      >
        {children}
      </div>
      {isOverflowing && (
        <button
          type="button"
          className="annotation-collapse-toggle"
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}
