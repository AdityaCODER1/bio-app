import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type HTMLAttributes,
} from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { splitClozeSegments } from '../../utils/cloze';
import { normalizeLatexDelimiters } from '../../utils/markdownMath';

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface ClozeRevealContextValue {
  revealed: Record<number, boolean>;
  toggle: (idx: number) => void;
}

const ClozeRevealContext = createContext<ClozeRevealContextValue | null>(null);

type RemarkPlugins = NonNullable<ComponentProps<typeof ReactMarkdown>['remarkPlugins']>;
type RehypePlugins = NonNullable<ComponentProps<typeof ReactMarkdown>['rehypePlugins']>;

const REMARK_PLUGINS: RemarkPlugins = [remarkGfm, remarkMath, remarkBreaks];
const KATEX_PLUGIN: RehypePlugins[number] = [
  rehypeKatex,
  { throwOnError: false, strict: 'ignore' },
];
const BASE_REHYPE_PLUGINS: RehypePlugins = [KATEX_PLUGIN];

function stripMathDelimiters(term: string): string {
  const trimmed = term.trim();
  if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith('$') && trimmed.endsWith('$') && trimmed.length > 2) {
    return trimmed.slice(1, -1).trim();
  }
  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)') && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 4) {
    return trimmed.slice(2, -2).trim();
  }
  return trimmed;
}

/**
 * HAST plugin (runs before rehype-katex) that wraps matching plain-text and inline-math
 * cloze terms in `<span data-cloze-idx="N">` while preserving Markdown structure (lists,
 * bold/italic, tables) and leaving non-cloze LaTeX equations intact.
 */
function createRehypeClozePlugin(clozeTerms: string[]) {
  const normalizedTerms = Array.from(
    new Set(clozeTerms.map((t) => t.trim()).filter((t) => t.length >= 2)),
  );
  const mathTermSet = new Set(
    normalizedTerms.map((t) => stripMathDelimiters(t).toLowerCase()),
  );
  const plainTerms = normalizedTerms.filter(
    (t) =>
      !(
        (t.startsWith('$') && t.endsWith('$')) ||
        (t.startsWith('\\(') && t.endsWith('\\)')) ||
        (t.startsWith('\\[') && t.endsWith('\\]'))
      ),
  );

  return function rehypeCloze() {
    return (tree: HastNode) => {
      if (normalizedTerms.length === 0) return;
      let counter = 0;

      const walk = (node: HastNode) => {
        if (!node.children || node.children.length === 0) return;
        const nextChildren: HastNode[] = [];

        for (const child of node.children) {
          if (child.type === 'element') {
            const cls = child.properties?.className;
            const classes = Array.isArray(cls)
              ? cls.map(String)
              : typeof cls === 'string'
                ? cls.split(/\s+/)
                : [];

            // Inline math element before rehype-katex: <code class="language-math math-inline">
            if (child.tagName === 'code' && classes.includes('math-inline')) {
              const rawMath = (child.children ?? [])
                .map((c) => (c.type === 'text' ? c.value ?? '' : ''))
                .join('')
                .trim()
                .toLowerCase();

              if (rawMath && mathTermSet.has(rawMath)) {
                nextChildren.push({
                  type: 'element',
                  tagName: 'span',
                  properties: { 'data-cloze-idx': String(counter++) },
                  children: [child],
                });
              } else {
                nextChildren.push(child);
              }
              continue;
            }

            // Skip non-math code/pre blocks and display math blocks
            if (child.tagName === 'code' || child.tagName === 'pre') {
              nextChildren.push(child);
              continue;
            }

            walk(child);
            nextChildren.push(child);
            continue;
          }

          if (child.type === 'text' && child.value && plainTerms.length > 0) {
            const segs = splitClozeSegments(child.value, plainTerms);
            for (const seg of segs) {
              if (!seg.isCloze) {
                nextChildren.push({ type: 'text', value: seg.text });
              } else {
                nextChildren.push({
                  type: 'element',
                  tagName: 'span',
                  properties: { 'data-cloze-idx': String(counter++) },
                  children: [{ type: 'text', value: seg.text }],
                });
              }
            }
            continue;
          }

          nextChildren.push(child);
        }

        node.children = nextChildren;
      };

      walk(tree);
    };
  };
}

function ClozeAwareSpan(props: HTMLAttributes<HTMLSpanElement> & { 'data-cloze-idx'?: string }) {
  const clozeCtx = useContext(ClozeRevealContext);
  const clozeIdxRaw = props['data-cloze-idx'];

  if (clozeIdxRaw === undefined || !clozeCtx) {
    return <span {...props} />;
  }

  const idx = Number(clozeIdxRaw);
  const isShown = Boolean(clozeCtx.revealed[idx]);

  return (
    <span
      role="button"
      tabIndex={0}
      className={`cloze-blank ${isShown ? 'revealed' : ''}`}
      title={isShown ? 'Click to hide again' : 'Click to reveal term'}
      onClick={(e) => {
        e.stopPropagation();
        clozeCtx.toggle(idx);
      }}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          clozeCtx.toggle(idx);
        }
      }}
    >
      {props.children}
    </span>
  );
}

const BASE_BLOCK_COMPONENTS: Components = {
  table({ children, ...props }) {
    return (
      <div className="markdown-table-wrap">
        <table {...props}>{children}</table>
      </div>
    );
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

const CLOZE_BLOCK_COMPONENTS: Components = {
  ...BASE_BLOCK_COMPONENTS,
  span: ClozeAwareSpan,
};

const BASE_INLINE_COMPONENTS: Components = {
  p({ children }) {
    return <>{children}</>;
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

const CLOZE_INLINE_COMPONENTS: Components = {
  ...BASE_INLINE_COMPONENTS,
  span: ClozeAwareSpan,
};

interface MarkdownMathProps {
  content: string;
  inline?: boolean;
  className?: string;
  clozeTerms?: string[];
  clozeEnabled?: boolean;
}

export function MarkdownMath({
  content,
  inline = false,
  className = '',
  clozeTerms,
  clozeEnabled = false,
}: MarkdownMathProps) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const toggle = useCallback((idx: number) => {
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const clozeContextValue = useMemo<ClozeRevealContextValue>(
    () => ({ revealed, toggle }),
    [revealed, toggle],
  );

  const normalized = useMemo(() => normalizeLatexDelimiters(content), [content]);
  const hasCloze = Boolean(clozeEnabled && clozeTerms && clozeTerms.length > 0);
  const clozeKey = hasCloze ? clozeTerms!.join('\u0001') : '';

  const rehypePlugins = useMemo<RehypePlugins>(() => {
    if (!hasCloze || !clozeTerms) return BASE_REHYPE_PLUGINS;
    return [createRehypeClozePlugin(clozeTerms) as RehypePlugins[number], KATEX_PLUGIN];
  }, [hasCloze, clozeKey]);

  const components = inline
    ? hasCloze
      ? CLOZE_INLINE_COMPONENTS
      : BASE_INLINE_COMPONENTS
    : hasCloze
      ? CLOZE_BLOCK_COMPONENTS
      : BASE_BLOCK_COMPONENTS;

  const Wrapper = inline ? 'span' : 'div';
  const baseClass = inline ? 'markdown-inline' : 'markdown-body';
  const fullClass = className ? `${baseClass} ${className}` : baseClass;

  const body = (
    <Wrapper className={fullClass}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </Wrapper>
  );

  if (!hasCloze) return body;

  return (
    <ClozeRevealContext.Provider value={clozeContextValue}>
      {body}
    </ClozeRevealContext.Provider>
  );
}
