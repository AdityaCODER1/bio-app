/**
 * Normalizes LaTeX math delimiters in Gemini & user Markdown text so remark-math + rehype-katex
 * render all standard math notations reliably without touching fenced or inline code blocks.
 *
 * Handles:
 * - Block display math: \[ ... \] -> $$\n...\n$$
 * - Inline math: \( ... \) -> $...$
 * - Whitespace-padded single-dollar math: $ \rightarrow $ -> $\rightarrow$
 */
const LATEX_NORMALIZE_TOKEN_RE =
  /(```[\s\S]*?```|~~~[\s\S]*?~~~|(`+)(?:(?!\2)[\s\S])*?\2|\$\$[\s\S]*?\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$(?!\$)([^$\n]+?)(?<!\\)\$)/g;

const LIKELY_MATH_INNER_RE = /[\\^_{}=<>+\-*/|]|^[a-zA-Z0-9]+$/;

export function normalizeLatexDelimiters(raw: string): string {
  if (!raw) return '';

  return raw.replace(
    LATEX_NORMALIZE_TOKEN_RE,
    (
      full,
      _whole,
      _inlineCodeTicks,
      bracketBlock: string | undefined,
      parenInline: string | undefined,
      singleDollarInner: string | undefined,
    ) => {
      if (bracketBlock !== undefined) {
        const trimmed = bracketBlock.trim();
        return trimmed ? `\n$$\n${trimmed}\n$$\n` : full;
      }

      if (parenInline !== undefined) {
        const collapsed = parenInline.replace(/\s*\n\s*/g, ' ').trim();
        return collapsed ? `$${collapsed}$` : full;
      }

      if (singleDollarInner !== undefined) {
        const hasOuterSpace =
          singleDollarInner.startsWith(' ') || singleDollarInner.endsWith(' ');
        if (!hasOuterSpace) return full;

        const trimmed = singleDollarInner.trim();
        if (!trimmed) return full;
        if (LIKELY_MATH_INNER_RE.test(trimmed)) {
          return `$${trimmed}$`;
        }
        return full;
      }

      // Convert single-line $$...$$ to multiline display math so remark-math renders .katex-display
      if (full.startsWith('$$') && full.endsWith('$$') && full.length > 4 && !full.includes('\n')) {
        const inner = full.slice(2, -2).trim();
        return inner ? `\n$$\n${inner}\n$$\n` : full;
      }

      // Code blocks, inline code, and existing multiline $$...$$ blocks pass through untouched
      return full;
    },
  );
}

/**
 * Heuristic check for whether a custom line or note is likely taller than 3 visual lines.
 * Used as the initial state before ResizeObserver measures actual layout height (and in jsdom).
 */
export function isLikelyLongAnnotation(text: string): boolean {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return false;

  const lines = normalized.split('\n');
  if (lines.length > 3) return true;
  if (normalized.length > 220) return true;

  const estimatedWrappedLines = lines.reduce(
    (sum, line) => sum + Math.max(1, Math.ceil(line.length / 84)),
    0,
  );
  return estimatedWrappedLines > 3;
}
