export interface TextSegment {
  text: string;
  isCloze: boolean;
  termIndex: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MATH_SPAN_RE = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)[^$\n]+?(?<!\\)\$)/g;

/**
 * Splits a sentence into normal text and maskable cloze spans matching `clozeTerms`
 * (longest terms matched first so nested phrases mask cleanly).
 * Preserves LaTeX math spans ($...$, $$...$$, \(...\), \[...\]) atomically so plain-text
 * cloze terms never slice through a formula delimiter.
 */
export function splitClozeSegments(text: string, clozeTerms: string[]): TextSegment[] {
  const uniqueTerms = Array.from(
    new Set(
      clozeTerms
        .map((t) => t.trim())
        .filter((t) => t.length >= 2),
    ),
  ).sort((a, b) => b.length - a.length);

  if (uniqueTerms.length === 0) {
    return [{ text, isCloze: false, termIndex: -1 }];
  }

  const normalizedTermSet = new Set(uniqueTerms.map((t) => t.toLowerCase()));
  const plainPattern = new RegExp(`(${uniqueTerms.map(escapeRegExp).join('|')})`, 'gi');
  const chunks = text.split(MATH_SPAN_RE);
  const segments: TextSegment[] = [];
  let clozeCounter = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    // Odd indices come from the capturing group MATH_SPAN_RE
    if (i % 2 === 1) {
      if (normalizedTermSet.has(chunk.trim().toLowerCase())) {
        segments.push({ text: chunk, isCloze: true, termIndex: clozeCounter++ });
      } else {
        segments.push({ text: chunk, isCloze: false, termIndex: -1 });
      }
      continue;
    }

    const parts = chunk.split(plainPattern);
    for (const part of parts) {
      if (!part) continue;
      if (normalizedTermSet.has(part.toLowerCase())) {
        segments.push({ text: part, isCloze: true, termIndex: clozeCounter++ });
      } else {
        segments.push({ text: part, isCloze: false, termIndex: -1 });
      }
    }
  }

  return segments;
}

/**
 * Extracts {{cloze}} terms from a user-authored custom line (supports braced LaTeX like {{$\text{CO}_2$}}).
 */
export function parseInlineClozeSyntax(raw: string): { cleanText: string; clozeTerms: string[] } {
  const clozeTerms: string[] = [];
  const cleanText = raw.replace(/\{\{([\s\S]+?)\}\}/g, (_match, inner: string) => {
    const trimmed = inner.trim();
    if (trimmed) clozeTerms.push(trimmed);
    return trimmed;
  });
  return { cleanText, clozeTerms };
}
