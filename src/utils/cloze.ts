export interface TextSegment {
  text: string;
  isCloze: boolean;
  termIndex: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits a sentence into normal text and maskable cloze spans matching `clozeTerms`
 * (longest terms matched first so nested phrases mask cleanly).
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

  const pattern = new RegExp(`(${uniqueTerms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  const segments: TextSegment[] = [];
  let clozeCounter = 0;

  for (const part of parts) {
    if (!part) continue;
    const isMatch = uniqueTerms.some((t) => t.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      segments.push({ text: part, isCloze: true, termIndex: clozeCounter++ });
    } else {
      segments.push({ text: part, isCloze: false, termIndex: -1 });
    }
  }

  return segments;
}

/**
 * Extracts {{cloze}} terms from a user-authored custom line or auto-picks key uppercase/numeric tokens.
 */
export function parseInlineClozeSyntax(raw: string): { cleanText: string; clozeTerms: string[] } {
  const clozeTerms: string[] = [];
  const cleanText = raw.replace(/\{\{([^}]+)\}\}/g, (_match, inner: string) => {
    const trimmed = inner.trim();
    if (trimmed) clozeTerms.push(trimmed);
    return trimmed;
  });
  return { cleanText, clozeTerms };
}
